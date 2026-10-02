import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  User,
  Plus,
  Minus,
  Check,
  Loader2,
  UserPlus,
  Search,
  Utensils,
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { DishThumb } from "@/components/consumer/dish-thumb";
import { DietaryBadges } from "@/components/operations/dietary-badges";
import type { CustomerDietaryProfile } from "@/types/dietary";
import {
  StaffOrderCaptureService,
  type UniversalOrderCaptureDTO,
  type UniversalOrderCaptureLineInput,
  type StaffOrderCaptureResult,
} from "@/modules/orders";
import { fetchPublishedWeeklyMenu } from "@/modules/weekly-menu/application/weekly-menu-queries";
import type { WeeklyMenuView } from "@/modules/weekly-menu/application/weekly-menu-mapper";
import type { CatalogDish } from "@/modules/dish-library/application/dish-catalog-mapper";
import {
  utcWeekStartMonday,
  utcWeekDates,
  offsetWeekMonday,
  DAY_NAMES_ES,
} from "@/modules/weekly-menu/application/week-dates";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface UniversalOrderIntakeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedCustomerId?: string;
  preselectedCustomerName?: string;
  preselectedDemandChannel?: "individual" | "company";
  preselectedCompanyId?: string;
  preselectedSiteId?: string;
  preselectedOrganizationalUnitId?: string;
  preselectedWeekStart?: string;
  initialDayDate?: string;
  onSuccess?: (result: StaffOrderCaptureResult) => void;
}

type CustomerItem = {
  id: string;
  display_name: string | null;
  phone?: string | null;
};

export function UniversalOrderIntakeDrawer({
  open,
  onOpenChange,
  preselectedCustomerId,
  preselectedCustomerName,
  preselectedDemandChannel,
  preselectedCompanyId,
  preselectedSiteId,
  preselectedOrganizationalUnitId,
  preselectedWeekStart,
  initialDayDate,
  onSuccess,
}: UniversalOrderIntakeDrawerProps) {
  const { user, tenantId, roles } = useAuth();

  const [weekStart, setWeekStart] = useState<string>(() => {
    if (initialDayDate) return utcWeekStartMonday(new Date(initialDayDate + "T00:00:00Z"));
    if (preselectedWeekStart) return preselectedWeekStart;
    return utcWeekStartMonday();
  });
  const weekDays = useMemo(() => {
    const dates = utcWeekDates(weekStart);
    return dates.map((dateStr, i) => ({
      date: dateStr,
      label: DAY_NAMES_ES[i] || `Día ${i + 1}`,
      index: i,
    }));
  }, [weekStart]);
  const [selectedDayDate, setSelectedDayDate] = useState<string>(() => {
    if (initialDayDate) return initialDayDate;
    return weekDays[0]?.date ?? utcWeekStartMonday();
  });

  // Customer State
  const [customerMode, setCustomerMode] = useState<"existing" | "new">(
    preselectedCustomerId ? "existing" : "existing",
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomerId ?? "");
  const [selectedCustomerDisplayName, setSelectedCustomerDisplayName] = useState<string>(
    preselectedCustomerName ?? "",
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerItem[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // New Customer Form State
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerStreet, setNewCustomerStreet] = useState("");
  const [newCustomerCity, setNewCustomerCity] = useState("");
  const [newCustomerDeliveryNotes, setNewCustomerDeliveryNotes] = useState("");

  // Context State (Personal B2C vs Empresa B2B)
  const [demandChannel, setDemandChannel] = useState<"individual" | "company">(
    preselectedDemandChannel ?? (preselectedCompanyId ? "company" : "individual"),
  );
  const [memberships, setMemberships] = useState<
    Array<{
      id: string;
      companyId: string;
      companyName: string;
      companyCode: string;
      locationId: string | null;
      locationName: string | null;
      departmentId: string | null;
      departmentName: string | null;
      internalLocation: string | null;
    }>
  >([]);
  const [loadingMemberships, setLoadingMemberships] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(preselectedCompanyId ?? "");
  const [selectedSiteId, setSelectedSiteId] = useState<string>(preselectedSiteId ?? "");
  const [selectedOrganizationalUnitId, setSelectedOrganizationalUnitId] = useState<string>(
    preselectedOrganizationalUnitId ?? "",
  );
  const [companySites, setCompanySites] = useState<
    Array<{ id: string; name: string; address?: string | null }>
  >([]);
  const [companyUnits, setCompanyUnits] = useState<Array<{ id: string; name: string }>>([]);

  // Published Weekly Menu State
  const [menuView, setMenuView] = useState<WeeklyMenuView | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Quantities: { [dayDate]: { [dishId]: number } }
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({});
  // Comments: { [dayDate]: { [dishId]: string } }
  const [comments, setComments] = useState<Record<string, Record<string, string>>>({});
  // Price Overrides: { [dayDate]: { [dishId]: number } }
  const [priceOverrides, setPriceOverrides] = useState<Record<string, Record<string, number>>>({});

  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // CR-CUST-01 Dietary Profile State
  const [customerDietaryProfile, setCustomerDietaryProfile] = useState<CustomerDietaryProfile | null>(null);
  const [isEditingDietaryOverride, setIsEditingDietaryOverride] = useState(false);
  const [dietaryOverrideReason, setDietaryOverrideReason] = useState("");
  const [dietaryOverrideNotes, setDietaryOverrideNotes] = useState("");

  // Synchronize week when changed
  useEffect(() => {
    if (initialDayDate) {
      const mon = utcWeekStartMonday(new Date(initialDayDate + "T00:00:00Z"));
      setWeekStart(mon);
      setSelectedDayDate(initialDayDate);
    } else if (preselectedWeekStart) {
      setWeekStart(preselectedWeekStart);
    }
  }, [initialDayDate, preselectedWeekStart]);

  useEffect(() => {
    if (weekDays.length > 0 && !weekDays.some((d) => d.date === selectedDayDate)) {
      setSelectedDayDate(weekDays[0].date);
    }
  }, [weekDays, selectedDayDate]);

  // Synchronize preselected customer
  useEffect(() => {
    if (preselectedCustomerId) {
      setSelectedCustomerId(preselectedCustomerId);
      setSelectedCustomerDisplayName(preselectedCustomerName ?? "Cliente seleccionado");
      setCustomerMode("existing");
    }
  }, [preselectedCustomerId, preselectedCustomerName]);

  // Synchronize preselected company context
  useEffect(() => {
    if (preselectedDemandChannel) {
      setDemandChannel(preselectedDemandChannel);
    }
    if (preselectedCompanyId) {
      setSelectedCompanyId(preselectedCompanyId);
      setDemandChannel("company");
    }
    if (preselectedSiteId) {
      setSelectedSiteId(preselectedSiteId);
    }
    if (preselectedOrganizationalUnitId) {
      setSelectedOrganizationalUnitId(preselectedOrganizationalUnitId);
    }
  }, [
    preselectedDemandChannel,
    preselectedCompanyId,
    preselectedSiteId,
    preselectedOrganizationalUnitId,
  ]);

  // Load customer company memberships when existing customer is selected
  useEffect(() => {
    if (!open || !tenantId || customerMode !== "existing" || !selectedCustomerId) {
      setMemberships([]);
      return;
    }
    const activeTenantId: string = tenantId;

    let isMounted = true;
    async function loadMemberships() {
      setLoadingMemberships(true);
      try {
        const { data, error } = await supabase
          .from("company_employees")
          .select(`
            id,
            company_id,
            location_id,
            department_id,
            internal_location,
            companies:company_id (id, name, company_code),
            company_locations:location_id (id, name, address),
            company_departments:department_id (id, name)
          `)
          .eq("tenant_id", activeTenantId)
          .eq("customer_id", selectedCustomerId)
          .is("deleted_at", null);

        if (error) throw error;
        if (isMounted) {
          const mapped = (data ?? []).map((m: any) => ({
            id: m.id,
            companyId: m.company_id,
            companyName: m.companies?.name ?? "Empresa",
            companyCode: m.companies?.company_code ?? "",
            locationId: m.location_id ?? null,
            locationName: m.company_locations?.name ?? null,
            departmentId: m.department_id ?? null,
            departmentName: m.company_departments?.name ?? null,
            internalLocation: m.internal_location ?? null,
          }));
          setMemberships(mapped);

          // Apply non-silent UX preselection rules
          if (preselectedCompanyId) {
            setSelectedCompanyId(preselectedCompanyId);
            setDemandChannel("company");
          } else if (mapped.length === 1 && !preselectedDemandChannel) {
            // Suggest company if 1 membership exists, while keeping Particular available
            setSelectedCompanyId(mapped[0].companyId);
            setSelectedSiteId(mapped[0].locationId || "");
            setSelectedOrganizationalUnitId(mapped[0].departmentId || "");
            setDemandChannel("company");
          } else if (mapped.length === 0) {
            setDemandChannel("individual");
          }
        }
      } catch {
        if (isMounted) setMemberships([]);
      } finally {
        if (isMounted) setLoadingMemberships(false);
      }
    }

    void loadMemberships();
    return () => {
      isMounted = false;
    };
  }, [open, tenantId, customerMode, selectedCustomerId, preselectedCompanyId, preselectedDemandChannel]);

  // CR-CUST-01: Load customer dietary profile when existing customer is selected
  useEffect(() => {
    let isMounted = true;
    if (!open || !tenantId || customerMode !== "existing" || !selectedCustomerId) {
      setCustomerDietaryProfile(null);
      setIsEditingDietaryOverride(false);
      return;
    }

    async function loadDietary() {
      try {
        const { data } = await (supabase as any)
          .from("customer_dietary_profiles")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("customer_id", selectedCustomerId)
          .maybeSingle();

        if (isMounted) {
          if (data) {
            setCustomerDietaryProfile({
              id: data.id,
              tenantId: data.tenant_id,
              customerId: data.customer_id,
              allergens: Array.isArray(data.allergens) ? data.allergens : [],
              customAllergens: Array.isArray(data.custom_allergens) ? data.custom_allergens : [],
              restrictions: Array.isArray(data.restrictions) ? data.restrictions : [],
              preferences: Array.isArray(data.preferences) ? data.preferences : [],
              dietaryNotes: data.dietary_notes ?? null,
            });
            setDietaryOverrideNotes(data.dietary_notes ?? "");
          } else {
            setCustomerDietaryProfile(null);
            setDietaryOverrideNotes("");
          }
        }
      } catch {
        if (isMounted) {
          setCustomerDietaryProfile(null);
        }
      }
    }

    void loadDietary();
    return () => {
      isMounted = false;
    };
  }, [open, tenantId, customerMode, selectedCustomerId]);

  // Load company sites and departments when selectedCompanyId changes
  useEffect(() => {
    if (!open || !tenantId || !selectedCompanyId) {
      setCompanySites([]);
      setCompanyUnits([]);
      return;
    }
    const activeTenantId: string = tenantId;

    let isMounted = true;
    async function loadCompanyMeta() {
      try {
        const { data: sitesData } = await supabase
          .from("company_locations")
          .select("id, name, address")
          .eq("tenant_id", activeTenantId)
          .eq("company_id", selectedCompanyId)
          .is("deleted_at", null)
          .order("name", { ascending: true });

        const siteIds = (sitesData || []).map((s) => s.id);
        let unitsData: Array<{ id: string; name: string }> = [];

        if (siteIds.length > 0) {
          const { data: uData } = await supabase
            .from("company_departments")
            .select("id, name")
            .eq("tenant_id", activeTenantId)
            .in("company_location_id", siteIds)
            .is("deleted_at", null)
            .order("name", { ascending: true });
          unitsData = uData || [];
        }

        if (isMounted) {
          setCompanySites(sitesData || []);
          setCompanyUnits(unitsData);
        }
      } catch {
        if (isMounted) {
          setCompanySites([]);
          setCompanyUnits([]);
        }
      }
    }

    void loadCompanyMeta();
    return () => {
      isMounted = false;
    };
  }, [open, tenantId, selectedCompanyId]);

  // Load published weekly menu offer
  useEffect(() => {
    if (!open || !tenantId) return;
    let isMounted = true;
    async function loadPublishedOffer() {
      setLoadingMenu(true);
      try {
        const view = await fetchPublishedWeeklyMenu(tenantId!, weekStart);
        if (isMounted) {
          setMenuView(view);
        }
      } catch {
        if (isMounted) {
          toast.error("Error al cargar la oferta del menú semanal publicado");
        }
      } finally {
        if (isMounted) setLoadingMenu(false);
      }
    }
    void loadPublishedOffer();
    return () => {
      isMounted = false;
    };
  }, [open, tenantId, weekStart]);

  // Customer search autocomplete
  const searchCustomers = useCallback(
    async (query: string) => {
      if (!tenantId || !query.trim()) {
        setCustomerSearchResults([]);
        return;
      }
      setSearchingCustomers(true);
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, display_name")
          .eq("tenant_id", tenantId)
          .ilike("display_name", `%${query.trim()}%`)
          .is("deleted_at", null)
          .limit(8);

        if (error) throw error;
        setCustomerSearchResults(data ?? []);
      } catch {
        // silent fail
      } finally {
        setSearchingCustomers(false);
      }
    },
    [tenantId],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch.trim()) {
        void searchCustomers(customerSearch);
      } else {
        setCustomerSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [customerSearch, searchCustomers]);

  // Stepper handlers
  const handleQtyChange = (dayDate: string, dishId: string, delta: number) => {
    setQuantities((prev) => {
      const currentDay = prev[dayDate] || {};
      const currentQty = currentDay[dishId] || 0;
      const nextQty = Math.max(0, currentQty + delta);
      return {
        ...prev,
        [dayDate]: {
          ...currentDay,
          [dishId]: nextQty,
        },
      };
    });
  };

  const handleCommentChange = (dayDate: string, dishId: string, value: string) => {
    setComments((prev) => {
      const currentDay = prev[dayDate] || {};
      return {
        ...prev,
        [dayDate]: {
          ...currentDay,
          [dishId]: value,
        },
      };
    });
  };

  const handlePriceOverrideChange = (dayDate: string, dishId: string, valStr: string) => {
    const parsed = parseFloat(valStr);
    setPriceOverrides((prev) => {
      const currentDay = prev[dayDate] || {};
      if (isNaN(parsed) || parsed < 0) {
        const copy = { ...currentDay };
        delete copy[dishId];
        return { ...prev, [dayDate]: copy };
      }
      return {
        ...prev,
        [dayDate]: {
          ...currentDay,
          [dishId]: parsed,
        },
      };
    });
  };

  const allDishes = useMemo(() => {
    if (!menuView) return [];
    const seen = new Set<string>();
    const res: CatalogDish[] = [];
    for (const d of menuView.days) {
      for (const dish of d.dishes) {
        if (!seen.has(dish.id)) {
          seen.add(dish.id);
          res.push(dish);
        }
      }
    }
    return res;
  }, [menuView]);

  const dishPriceMap = useMemo(() => {
    return new Map(allDishes.map((d) => [d.id, d.price]));
  }, [allDishes]);

  // Compute live totals
  const { totalPortions, grandTotal } = useMemo(() => {
    let portions = 0;
    let total = 0;

    for (const [dayDate, dayQtyMap] of Object.entries(quantities)) {
      for (const [dishId, qty] of Object.entries(dayQtyMap)) {
        if (qty > 0) {
          portions += qty;
          const override = priceOverrides[dayDate]?.[dishId];
          const standardPrice = dishPriceMap.get(dishId);
          const effectivePrice =
            override !== undefined ? override : standardPrice != null ? standardPrice : 0;
          total += effectivePrice * qty;
        }
      }
    }
    return {
      totalPortions: portions,
      grandTotal: Math.round(total * 100) / 100,
    };
  }, [quantities, priceOverrides, dishPriceMap]);

  // Submit Order
  const handleSubmit = async (autoConfirm: boolean) => {
    if (!user || !tenantId) return;

    if (menuView?.status !== "published") {
      toast.error("No se puede registrar un pedido sin un menú semanal publicado.");
      return;
    }

    // Validate Customer
    if (customerMode === "existing" && !selectedCustomerId) {
      toast.error("Por favor, selecciona un cliente existente o crea uno nuevo.");
      return;
    }
    if (customerMode === "new" && (!newCustomerName.trim() || !newCustomerPhone.trim())) {
      toast.error("El nombre y el teléfono son obligatorios para crear un cliente nuevo.");
      return;
    }

    // Build Lines
    const lines: UniversalOrderCaptureLineInput[] = [];
    for (const [dayDate, dayQtyMap] of Object.entries(quantities)) {
      for (const [dishId, qty] of Object.entries(dayQtyMap)) {
        if (qty > 0) {
          const comment = comments[dayDate]?.[dishId]?.trim() || null;
          const override = priceOverrides[dayDate]?.[dishId];
          const catalogDish = allDishes.find((d) => d.id === dishId);
          if (catalogDish && catalogDish.price === null && override === undefined) {
            toast.error(
              `El plato '${catalogDish.name}' no tiene precio asignado en el catálogo. Introduce un precio manual.`,
            );
            return;
          }
          lines.push({
            dayDate,
            dishId,
            qty,
            comment,
            unitPriceOverride: override !== undefined ? override : null,
          });
        }
      }
    }

    if (lines.length === 0) {
      toast.error("Debes seleccionar al menos un plato en la semana.");
      return;
    }

    if (isEditingDietaryOverride) {
      const reason = dietaryOverrideReason.trim();
      if (!reason || reason.length < 5) {
        toast.error("Debe especificar un motivo obligatorio para la personalización de este pedido (mínimo 5 caracteres).");
        return;
      }
    }

    setSubmitting(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });

      const isCompanyContext = demandChannel === "company" && !!selectedCompanyId;

      const dto: UniversalOrderCaptureDTO = {
        customer:
          customerMode === "existing"
            ? { mode: "existing", customerId: selectedCustomerId }
            : {
                mode: "new",
                displayName: newCustomerName.trim(),
                phone: newCustomerPhone.trim(),
                street: newCustomerStreet.trim() || null,
                city: newCustomerCity.trim() || null,
                deliveryNotes: newCustomerDeliveryNotes.trim() || null,
              },
        weekStart,
        orderNotes: orderNotes.trim() || null,
        autoConfirm,
        demandChannel: isCompanyContext ? "company" : "individual",
        companyId: isCompanyContext ? selectedCompanyId : null,
        siteId: isCompanyContext ? (selectedSiteId || null) : null,
        organizationalUnitId: isCompanyContext ? (selectedOrganizationalUnitId || null) : null,
        lines,
        dietaryOverride: isEditingDietaryOverride
          ? {
              dietaryNotes: dietaryOverrideNotes.trim() ? dietaryOverrideNotes.trim() : null,
              overrideReason: dietaryOverrideReason.trim() ? dietaryOverrideReason.trim() : null,
            }
          : null,
      };

      const result = await StaffOrderCaptureService.captureOrder(ctx, dto);

      toast.success(
        autoConfirm
          ? `Pedido confirmado con éxito (#${result.order.id.slice(0, 8)}) por ${result.total.toFixed(2)} €`
          : `Borrador de pedido guardado (#${result.order.id.slice(0, 8)})`,
      );

      onSuccess?.(result);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al procesar el pedido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Captura Universal de Pedido
            </SheetTitle>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Semana anterior"
                onClick={() => {
                  const prev = offsetWeekMonday(weekStart, -1);
                  setWeekStart(prev);
                  setSelectedDayDate(prev);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge variant={menuView?.status === "published" ? "secondary" : "outline"} className="font-mono text-xs">
                Semana: {weekStart}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Semana siguiente"
                onClick={() => {
                  const next = offsetWeekMonday(weekStart, 1);
                  setWeekStart(next);
                  setSelectedDayDate(next);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SheetDescription className="text-xs">
            Registro ágil multidía con selección por cliente, override comercial y notas de cocina.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6 space-y-6">
          {/* 1. SELECCIÓN DE CLIENTE */}
          <div className="space-y-3 rounded-lg border border-border bg-card/50 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Cliente
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={customerMode === "existing" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCustomerMode("existing")}
                >
                  Existente
                </Button>
                <Button
                  type="button"
                  variant={customerMode === "new" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCustomerMode("new")}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Nuevo
                </Button>
              </div>
            </div>

            {customerMode === "existing" ? (
              <div className="space-y-2">
                {selectedCustomerId ? (
                  <>
                  <div className="flex items-center justify-between p-2.5 rounded-md bg-accent/50 border border-border">
                    <div>
                      <p className="text-sm font-medium">{selectedCustomerDisplayName}</p>
                      <p className="text-xs text-muted-foreground">ID: {selectedCustomerId.slice(0, 8)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomerId("");
                        setSelectedCustomerDisplayName("");
                      }}
                    >
                      Cambiar
                    </Button>
                  </div>

                  {/* CR-CUST-01 Dietary Badges & Override preview */}
                  {customerDietaryProfile && (
                    <div className="space-y-2 pt-1">
                      <DietaryBadges snapshot={customerDietaryProfile} compact={false} />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsEditingDietaryOverride((prev) => !prev)}
                          className="text-xs text-primary underline hover:text-primary/80 transition-colors"
                        >
                          {isEditingDietaryOverride
                            ? "Cancelar personalización de este pedido"
                            : "Personalizar para este pedido"}
                        </button>
                      </div>
                      {isEditingDietaryOverride && (
                        <div className="p-3 rounded-md border border-purple-500/40 bg-purple-500/5 space-y-2 text-xs">
                          <p className="font-semibold text-purple-300">
                            Personalización temporal para este pedido (no modifica el perfil maestro):
                          </p>
                          <div>
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                              Motivo de personalización <span className="text-destructive font-bold">*</span> (mínimo 5 caracteres):
                            </label>
                            <Input
                              value={dietaryOverrideReason}
                              onChange={(e) => setDietaryOverrideReason(e.target.value)}
                              placeholder="Ej. Invitado en la cena / excepción temporal (obligatorio)"
                              className="h-7 text-xs"
                              required
                            />
                            {dietaryOverrideReason.trim().length > 0 && dietaryOverrideReason.trim().length < 5 && (
                              <p className="text-[10px] text-destructive mt-0.5">El motivo debe tener al menos 5 caracteres.</p>
                            )}
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                              Instrucciones específicas para este pedido:
                            </label>
                            <Input
                              value={dietaryOverrideNotes}
                              onChange={(e) => setDietaryOverrideNotes(e.target.value)}
                              placeholder="Notas específicas para cocina"
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre de cliente..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9"
                    />
                    {searchingCustomers ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">Buscando...</div>
                    ) : customerSearchResults.length > 0 ? (
                      <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-md divide-y divide-border">
                        {customerSearchResults.map((cust) => (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(cust.id);
                              setSelectedCustomerDisplayName(cust.display_name || "Sin nombre");
                              setCustomerSearch("");
                              setCustomerSearchResults([]);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between"
                          >
                            <span>{cust.display_name}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {cust.id.slice(0, 6)}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : customerSearch.trim() ? (
                      <div className="p-2 text-center text-xs text-muted-foreground">
                        No se encontraron clientes con ese nombre.
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="new-name" className="text-xs">
                    Nombre completo (*)
                  </Label>
                  <Input
                    id="new-name"
                    placeholder="Ej. Juan Pérez"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-phone" className="text-xs">
                    Teléfono móvil (*)
                  </Label>
                  <Input
                    id="new-phone"
                    placeholder="Ej. +34 600 000 000"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="new-street" className="text-xs">
                    Dirección de entrega
                  </Label>
                  <Input
                    id="new-street"
                    placeholder="Ej. Calle Mayor 14, 2B"
                    value={newCustomerStreet}
                    onChange={(e) => setNewCustomerStreet(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 1.1 CONTEXTO DEL PEDIDO (B2C / B2B) */}
          <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                Contexto del Pedido
              </Label>
              {customerMode === "existing" && memberships.length > 0 ? (
                <Badge
                  variant={demandChannel === "company" ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {demandChannel === "company" ? "🏢 Corporativo B2B" : "👤 Particular B2C"}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  👤 Particular B2C
                </Badge>
              )}
            </div>

            {customerMode === "existing" && memberships.length > 0 ? (
              <div className="space-y-3 pt-1">
                {/* Selector explícito Particular vs Empresa */}
                <div className="grid grid-cols-2 gap-2 bg-muted/60 p-1 rounded-md">
                  <button
                    type="button"
                    onClick={() => setDemandChannel("individual")}
                    className={cn(
                      "py-1.5 px-2 text-xs font-medium rounded-md transition-all text-center",
                      demandChannel === "individual"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    👤 Particular (B2C)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDemandChannel("company");
                      if (!selectedCompanyId && memberships[0]) {
                        setSelectedCompanyId(memberships[0].companyId);
                        setSelectedSiteId(memberships[0].locationId || "");
                        setSelectedOrganizationalUnitId(memberships[0].departmentId || "");
                      }
                    }}
                    className={cn(
                      "py-1.5 px-2 text-xs font-medium rounded-md transition-all text-center",
                      demandChannel === "company"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    🏢 Empresa (B2B)
                  </button>
                </div>

                {demandChannel === "company" && (
                  <div className="space-y-2 pt-1">
                    {/* Dropdown Empresa si tiene múltiples */}
                    {memberships.length > 1 && (
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Empresa</Label>
                        <select
                          value={selectedCompanyId}
                          onChange={(e) => {
                            const compId = e.target.value;
                            setSelectedCompanyId(compId);
                            const mem = memberships.find((m) => m.companyId === compId);
                            setSelectedSiteId(mem?.locationId || "");
                            setSelectedOrganizationalUnitId(mem?.departmentId || "");
                          }}
                          className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                        >
                          {memberships.map((m) => (
                            <option key={m.companyId} value={m.companyId}>
                              {m.companyName} ({m.companyCode})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Sede y Departamento */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Sede de Entrega</Label>
                        <select
                          value={selectedSiteId}
                          onChange={(e) => setSelectedSiteId(e.target.value)}
                          className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                        >
                          <option value="">Sede principal / Sin especificar</option>
                          {companySites.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.address ? `(${s.address})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">
                          Departamento / Unidad
                        </Label>
                        <select
                          value={selectedOrganizationalUnitId}
                          onChange={(e) => setSelectedOrganizationalUnitId(e.target.value)}
                          className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                        >
                          <option value="">General / Sin especificar</option>
                          {companyUnits.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Entrega individual en domicilio del cliente. Sin membresías corporativas activas.
              </p>
            )}
          </div>

          {/* 2. SELECTOR DE DÍAS Y PLATOS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Platos de la Semana
              </Label>
              <div className="text-xs text-muted-foreground">
                Total raciones: <strong>{totalPortions}</strong>
              </div>
            </div>

            <Tabs value={selectedDayDate} onValueChange={setSelectedDayDate}>
              <TabsList className="grid grid-cols-7 h-auto p-1 bg-muted/60">
                {weekDays.map((d) => {
                  const count = Object.values(quantities[d.date] || {}).reduce((a, b) => a + b, 0);
                  return (
                    <TabsTrigger
                      key={d.date}
                      value={d.date}
                      className="py-1.5 px-1 text-xs flex flex-col items-center gap-0.5"
                    >
                      <span className="font-semibold text-[11px]">{d.label.slice(0, 3)}</span>
                      {count > 0 ? (
                        <Badge variant="secondary" className="h-4 px-1 text-[10px] font-mono">
                          {count}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {weekDays.map((d) => {
                const dayDishes = menuView?.days.find((day) => day.dayDate === d.date)?.dishes ?? [];
                return (
                  <TabsContent key={d.date} value={d.date} className="mt-4 space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Menú para {d.label} ({d.date})
                      </p>
                      {menuView?.status === "published" && (
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {dayDishes.length} {dayDishes.length === 1 ? "plato ofertado" : "platos ofertados"}
                        </span>
                      )}
                    </div>

                    {loadingMenu ? (
                      <div className="py-8 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Cargando menú semanal...
                      </div>
                    ) : menuView?.status !== "published" ? (
                      <div className="py-8 px-4 text-center rounded-lg border border-dashed border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10 space-y-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto" />
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                          No hay menú publicado para esta semana ({weekStart})
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Publica el menú semanal en la sección de Menús para habilitar la captura de pedidos para estas fechas.
                        </p>
                      </div>
                    ) : dayDishes.length === 0 ? (
                      <div className="py-8 px-4 text-center rounded-lg border border-dashed text-muted-foreground text-xs">
                        Sin platos planificados para este día ({d.label}, {d.date}).
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dayDishes.map((dish) => {
                        const qty = quantities[d.date]?.[dish.id] || 0;
                        const comment = comments[d.date]?.[dish.id] || "";
                        const override = priceOverrides[d.date]?.[dish.id];

                        return (
                          <div
                            key={dish.id}
                            className={cn(
                              "p-3 rounded-lg border transition-all",
                              qty > 0 ? "border-primary/50 bg-primary/5" : "border-border bg-card",
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <DishThumb
                                  emoji={dish.emoji || "🍽️"}
                                  imageSrc={dish.imageSrc || dish.photoUrl || undefined}
                                  size="sm"
                                  className="size-12 rounded-lg border border-border/80 shrink-0 text-xl"
                                />
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <p className="text-sm font-medium leading-none truncate">{dish.name}</p>
                                  {dish.price !== null && dish.price > 0 ? (
                                    <p className="text-xs text-muted-foreground font-mono">
                                      {dish.price.toFixed(2)} € / ración
                                    </p>
                                  ) : dish.price === 0 ? (
                                    <p className="text-xs text-muted-foreground font-mono">
                                      0,00 € (Sin coste)
                                    </p>
                                  ) : (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                      ⚠️ Precio no asignado (Requiere ajuste)
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleQtyChange(d.date, dish.id, -1)}
                                  disabled={qty === 0}
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <span className="w-6 text-center font-mono font-bold text-sm">
                                  {qty}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleQtyChange(d.date, dish.id, 1)}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Options when qty > 0 */}
                            {qty > 0 ? (
                              <div className="mt-3 pt-2 border-t border-border/60 grid gap-2 sm:grid-cols-2 text-xs">
                                <div className="space-y-1">
                                  <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                                    Nota / Alérgeno Cocina:
                                  </Label>
                                  <Input
                                    placeholder="Ej. ⚠️ Sin cebolla / Salsa aparte"
                                    value={comment}
                                    onChange={(e) =>
                                      handleCommentChange(d.date, dish.id, e.target.value)
                                    }
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[11px] text-muted-foreground">
                                    Precio especial (€):
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.10"
                                    min="0"
                                    placeholder={
                                      dish.price != null
                                        ? `${dish.price.toFixed(2)} € (catálogo)`
                                        : "Precio manual requerido"
                                    }
                                    value={override !== undefined ? override : ""}
                                    onChange={(e) =>
                                      handlePriceOverrideChange(d.date, dish.id, e.target.value)
                                    }
                                    className="h-7 text-xs font-mono"
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
          </div>

          <Separator />

          {/* 3. NOTAS DE REPARTO */}
          <div className="space-y-2">
            <Label htmlFor="order-notes" className="text-xs font-medium">
              Instrucciones de entrega / Reparto para este pedido:
            </Label>
            <Input
              id="order-notes"
              placeholder="Ej. Llamar al llegar, timbre roto, dejar en recepción..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="text-xs"
            />
          </div>
        </ScrollArea>

        {/* 4. FOOTER CON RESUMEN ECONÓMICO Y BOTONES */}
        <SheetFooter className="p-4 border-t border-border bg-card flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left w-full sm:w-auto">
            <p className="text-xs text-muted-foreground">
              Total: <strong>{totalPortions}</strong> raciones
            </p>
            <p className="text-lg font-bold font-mono text-primary">
              {grandTotal.toFixed(2)} €
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSubmit(false)}
              disabled={submitting || totalPortions === 0}
            >
              Guardar Borrador
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => handleSubmit(true)}
              disabled={submitting || totalPortions === 0}
              className="gap-1.5"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Guardar y Confirmar 🟢
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
