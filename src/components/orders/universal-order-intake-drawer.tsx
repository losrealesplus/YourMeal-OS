import { useCustomOrderCapture } from "@/hooks/use-custom-order-capture";
import {
  customDraftLine,
  newCustomItemDraft,
  type CustomItemDraft,
} from "@/modules/orders/domain/custom-order-capture-draft";
import type { CanonicalOrderCommand } from "@/modules/orders/domain/canonical-order-write";
import type { CanonicalOrderWriteResult } from "@/modules/orders/infrastructure/canonical-order-write-repository";
import { DishAllergenDeclaration } from "@/components/operations/dish-allergen-declaration";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  History,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  fetchCatalogHistoricalPricesMap,
  fetchTenantReusableCustomItems,
  type HistoricalPriceResult,
  type ReusableCustomItem,
} from "@/modules/orders/application/order-historical-queries";
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
import { fetchCatalogDishes } from "@/modules/dish-library/application/dish-catalog-queries";
import {
  utcWeekStartMonday,
  utcWeekDates,
  offsetWeekMonday,
  DAY_NAMES_ES,
  formatDayDateEs,
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
import {
  isEatCleanContext,
  isEatCleanStaffOrderCaptureFrozen,
  EATCLEAN_PARTIAL_LAUNCH_CONFIG,
} from "@/config/eatclean-partial-launch";
import {
  createCustomCaptureSession,
  customCaptureTransport,
} from "@/modules/orders/application/custom-order-capture-service";
import {
  getPendingCaptureToken,
  savePendingCaptureToken,
  clearPendingCaptureToken,
  type PendingCaptureToken,
} from "@/modules/orders/application/pending-capture-recovery";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  onSuccess?: (result: StaffOrderCaptureResult | CanonicalOrderWriteResult) => void;
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
  const isTenantCaptureFrozen = isEatCleanStaffOrderCaptureFrozen(tenantId);

  const isStaffAdmin = useMemo(() => {
    return roles.some((r) =>
      ["company_admin", "operations_manager", "saas_admin"].includes(r),
    );
  }, [roles]);

  // Off-Menu Catalog Exceptions & Free Custom Preparations State
  const [catalogDishes, setCatalogDishes] = useState<CatalogDish[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [offMenuKeys, setOffMenuKeys] = useState<Set<string>>(new Set());
  const [dishTab, setDishTab] = useState<"menu" | "off_menu">("menu");
  const [offMenuSubTab, setOffMenuSubTab] = useState<"catalog" | "custom">("catalog");
  const [offMenuSearch, setOffMenuSearch] = useState("");
  const [historicalPrices, setHistoricalPrices] = useState<Record<string, HistoricalPriceResult>>({});
  const [loadingHistoricalPrices, setLoadingHistoricalPrices] = useState(false);

  // Free Custom Preparation State (Fuera de carta / Nivel 1 & 2)
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customQty, setCustomQty] = useState(1);
  const [customPrice, setCustomPrice] = useState("");
  const [customComment, setCustomComment] = useState("");
  const [reusableItems, setReusableItems] = useState<ReusableCustomItem[]>([]);
  const [reusableSearch, setReusableSearch] = useState("");
  const [loadingReusable, setLoadingReusable] = useState(false);

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

  const customEnabled = useCustomOrderCapture(demandChannel);
  const [customItems, setCustomItems] = useState<CustomItemDraft[]>([]);
  const [canonicalLocked, setCanonicalLocked] = useState(false);
  const captureSessionRef = useRef<ReturnType<typeof createCustomCaptureSession> | undefined>(
    undefined,
  );

  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingRecovery, setPendingRecovery] = useState<PendingCaptureToken | null>(() => {
    return open && tenantId ? getPendingCaptureToken(tenantId) : null;
  });
  const [reconciling, setReconciling] = useState(false);

  useEffect(() => {
    if (open && tenantId) {
      const token = getPendingCaptureToken(tenantId);
      setPendingRecovery(token);
    } else if (!open) {
      setPendingRecovery(null);
    }
  }, [open, tenantId]);

  // CR-CUST-01 Dietary Profile State
  const [customerDietaryProfile, setCustomerDietaryProfile] =
    useState<CustomerDietaryProfile | null>(null);
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
          .select(
            `
            id,
            company_id,
            location_id,
            department_id,
            internal_location,
            companies:company_id (id, name, company_code),
            company_locations:location_id (id, name, address),
            company_departments:department_id (id, name)
          `,
          )
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
  }, [
    open,
    tenantId,
    customerMode,
    selectedCustomerId,
    preselectedCompanyId,
    preselectedDemandChannel,
  ]);

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

  // Load tenant catalog dishes for off-menu exceptions
  useEffect(() => {
    if (!open || !tenantId) return;
    let isMounted = true;
    async function loadCatalog() {
      setLoadingCatalog(true);
      try {
        const dishes = await fetchCatalogDishes(tenantId!);
        if (isMounted) {
          setCatalogDishes(dishes);
        }
      } catch {
        // Non-fatal
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }
    }
    void loadCatalog();
    return () => {
      isMounted = false;
    };
  }, [open, tenantId]);

  // Load historical price suggestions for catalog dishes
  useEffect(() => {
    if (!open || !tenantId || catalogDishes.length === 0) return;
    let isMounted = true;
    async function loadPrices() {
      setLoadingHistoricalPrices(true);
      try {
        const prices = await fetchCatalogHistoricalPricesMap(
          supabase,
          tenantId!,
          catalogDishes.map((d) => ({ id: d.id, price: d.price })),
          customerMode === "existing" && selectedCustomerId ? selectedCustomerId : null,
        );
        if (isMounted) {
          setHistoricalPrices(prices);
        }
      } catch {
        // non-fatal
      } finally {
        if (isMounted) setLoadingHistoricalPrices(false);
      }
    }
    void loadPrices();
    return () => {
      isMounted = false;
    };
  }, [open, tenantId, catalogDishes, selectedCustomerId, customerMode]);

  // Load reusable custom preparations for Level 2 reuse
  useEffect(() => {
    if (!open || !tenantId || dishTab !== "off_menu" || offMenuSubTab !== "custom") return;
    let isMounted = true;
    async function loadReusable() {
      setLoadingReusable(true);
      try {
        const items = await fetchTenantReusableCustomItems(
          supabase,
          tenantId!,
          reusableSearch,
        );
        if (isMounted) {
          setReusableItems(items);
        }
      } catch {
        // non-fatal
      } finally {
        if (isMounted) setLoadingReusable(false);
      }
    }
    const timer = setTimeout(() => {
      void loadReusable();
    }, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [open, tenantId, dishTab, offMenuSubTab, reusableSearch]);

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

  const handleAddOffMenuDish = (dayDate: string, dishId: string) => {
    setOffMenuKeys((prev) => {
      const next = new Set(prev);
      next.add(`${dayDate}:${dishId}`);
      return next;
    });
    setQuantities((prev) => {
      const currentDay = prev[dayDate] || {};
      return {
        ...prev,
        [dayDate]: {
          ...currentDay,
          [dishId]: (currentDay[dishId] || 0) + 1,
        },
      };
    });
    setPriceOverrides((prev) => {
      const currentDay = prev[dayDate] || {};
      if (currentDay[dishId] !== undefined) return prev;
      const suggested =
        historicalPrices[dishId]?.suggestedPrice ?? dishPriceMap.get(dishId);
      if (suggested !== undefined) {
        return {
          ...prev,
          [dayDate]: {
            ...currentDay,
            [dishId]: suggested,
          },
        };
      }
      return prev;
    });
  };

  const handleRemoveOffMenuDish = (dayDate: string, dishId: string) => {
    setOffMenuKeys((prev) => {
      const next = new Set(prev);
      next.delete(`${dayDate}:${dishId}`);
      return next;
    });
    setQuantities((prev) => {
      const currentDay = { ...(prev[dayDate] || {}) };
      delete currentDay[dishId];
      return {
        ...prev,
        [dayDate]: currentDay,
      };
    });
    setPriceOverrides((prev) => {
      const currentDay = { ...(prev[dayDate] || {}) };
      delete currentDay[dishId];
      return {
        ...prev,
        [dayDate]: currentDay,
      };
    });
  };

  const handleAddCustomPreparation = (dayDate: string) => {
    const rawPrice = customPrice.trim().replace(",", ".");
    const p = parseFloat(rawPrice);
    if (!customName.trim()) {
      toast.error("El nombre de la preparación es obligatorio.");
      return;
    }
    if (isNaN(p) || p <= 0) {
      toast.error("El precio manual es obligatorio para la preparación libre y debe ser mayor que 0.");
      return;
    }
    const newItem: CustomItemDraft = {
      key: `custom:${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dayDate,
      name: customName.trim(),
      description: customDescription.trim(),
      qty: customQty >= 1 ? customQty : 1,
      price: rawPrice,
      comment: customComment.trim() || null,
      explicitZeroConfirmed: false,
    };
    setCustomItems((prev) => [...prev, newItem]);
    setCustomName("");
    setCustomDescription("");
    setCustomQty(1);
    setCustomPrice("");
    setCustomComment("");
    toast.success(`Preparación libre "${newItem.name}" añadida.`);
  };

  const handleRemoveCustomItem = (key: string) => {
    setCustomItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleSelectReusableCustomItem = (item: ReusableCustomItem) => {
    setCustomName(item.name);
    setCustomDescription(item.description || "");
    // Mandatory manual entry: NEVER auto-populate price from past orders
    setCustomPrice("");
    toast.info(`Cargado "${item.name}". Introduce el precio unitario obligatorio.`);
  };

  const allDishes = useMemo(() => {
    const seen = new Set<string>();
    const res: CatalogDish[] = [];
    if (menuView) {
      for (const d of menuView.days) {
        for (const dish of d.dishes) {
          if (!seen.has(dish.id)) {
            seen.add(dish.id);
            res.push(dish);
          }
        }
      }
    }
    for (const dish of catalogDishes) {
      if (!seen.has(dish.id)) {
        seen.add(dish.id);
        res.push(dish);
      }
    }
    return res;
  }, [menuView, catalogDishes]);

  const dishPriceMap = useMemo(() => {
    return new Map(allDishes.map((d) => [d.id, d.price]));
  }, [allDishes]);

  const offerPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!menuView) return map;
    for (const day of menuView.days) {
      if (day.offers) {
        for (const offer of day.offers) {
          map.set(`${offer.dayDate}:${offer.dishId}`, offer.effectivePrice);
        }
      }
    }
    return map;
  }, [menuView]);

  // Compute live totals
  const { totalPortions, grandTotal } = useMemo(() => {
    let portions = 0;
    let total = 0;

    for (const [dayDate, dayQtyMap] of Object.entries(quantities)) {
      for (const [dishId, qty] of Object.entries(dayQtyMap)) {
        if (qty > 0) {
          portions += qty;
          const isOff = offMenuKeys.has(`${dayDate}:${dishId}`);
          const override = priceOverrides[dayDate]?.[dishId];
          const publishedOfferPrice = isOff ? undefined : offerPriceMap.get(`${dayDate}:${dishId}`);
          const catalogPrice = dishPriceMap.get(dishId);
          const effectivePrice =
            override !== undefined
              ? override
              : publishedOfferPrice !== undefined
                ? publishedOfferPrice
                : catalogPrice != null
                  ? catalogPrice
                  : 0;
          total += effectivePrice * qty;
        }
      }
    }

    for (const custom of customItems) {
      const qty = custom.qty || 0;
      const price = parseFloat(custom.price.replace(",", ".")) || 0;
      portions += qty;
      total += qty * price;
    }

    return {
      totalPortions: portions,
      grandTotal: Math.round(total * 100) / 100,
    };
  }, [quantities, priceOverrides, dishPriceMap, offerPriceMap, offMenuKeys, customItems]);

  // Submit Order
  const buildCustomCommand = (autoConfirm: boolean): CanonicalOrderCommand => {
    if (!customEnabled || demandChannel !== "individual") throw new Error("CUSTOM_NOT_ENABLED");
    const dishLines = Object.entries(quantities).flatMap(([dayDate, byDish]) =>
      Object.entries(byDish)
        .filter(([, qty]) => qty > 0)
        .map(([dishId, qty]) => {
          const isOff = offMenuKeys.has(`${dayDate}:${dishId}`);
          const override = priceOverrides[dayDate]?.[dishId];
          if (!isOff && override !== undefined)
            throw new Error("OFFER_PRICING_OVERRIDE_UNSUPPORTED");
          return {
            kind: "dish" as const,
            dishId,
            dayDate,
            qty,
            comment: comments[dayDate]?.[dishId] || null,
            isOffMenu: isOff ? true : undefined,
            unitPriceOverride: isOff && override !== undefined ? override.toFixed(4) : undefined,
            unitPriceOverrideReason: isOff && override !== undefined ? "Excepción administrativa fuera de menú" : undefined,
          };
        }),
    );
    if (dishLines.length && menuView?.status !== "published") throw new Error("MENU_LOCKED");
    return {
      operation: "capture",
      weekStart,
      autoConfirm,
      demandChannel: "individual",
      customer:
        customerMode === "existing"
          ? { kind: "existing", id: selectedCustomerId }
          : {
              kind: "new",
              displayName: newCustomerName.trim(),
              phone: newCustomerPhone.trim(),
              street: newCustomerStreet.trim() || null,
              city: newCustomerCity.trim() || null,
              deliveryNotes: newCustomerDeliveryNotes.trim() || null,
            },
      lines: [...dishLines, ...customItems.map(customDraftLine)],
      orderNotes: orderNotes.trim() || null,
      dietaryOverride: isEditingDietaryOverride
        ? {
            dietaryNotes: dietaryOverrideNotes.trim() || null,
            overrideReason: dietaryOverrideReason.trim(),
          }
        : null,
    };
  };

  const handleReconcilePending = async () => {
    if (!pendingRecovery || !tenantId) return;
    setReconciling(true);
    try {
      const { reconcileOfferOrder } = await import(
        "@/modules/weekly-menu/application/offer-write.functions"
      );
      const result = await reconcileOfferOrder({
        data: {
          tenantId,
          requestId: pendingRecovery.requestId,
        },
      });
      if (result.committed && result.order) {
        toast.success(
          `Pedido conciliado con éxito (#${result.order.id.slice(0, 8)}). Ya estaba registrado en el servidor.`,
        );
        clearPendingCaptureToken(tenantId);
        setPendingRecovery(null);
        captureSessionRef.current = undefined;
        onSuccess?.({
          order: { id: result.order.id, status: result.order.status } as any,
          total: result.order.total,
          orderId: result.order.id,
        } as any);
        onOpenChange(false);
      } else {
        // Safe recovery: Never unlock automatically on missing ledger record.
        // A delayed commit or network interruption means the outcome is still uncertain.
        // The lock is strictly conserved to prevent duplicate orders.
        toast.warning(
          `Sin registro confirmado en el ledger (#${pendingRecovery.requestId.slice(0, 8)}). Se conserva el bloqueo para evitar pedidos duplicados. Comprueba de nuevo o realiza una conciliación administrativa.`,
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Error al conciliar: ${err.message}`
          : "No se pudo contactar con el servidor. Se mantiene el bloqueo por seguridad.",
      );
    } finally {
      setReconciling(false);
    }
  };

  const handleSubmit = async (autoConfirm: boolean) => {
    if (!user || !tenantId) return;
    if (pendingRecovery) {
      toast.error("Concilia la operación pendiente con el servidor antes de crear otra captura.");
      return;
    }

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

    // Commercial rule: weekly menu items cannot have manual price overrides
    const hasForbiddenOverrides = Object.entries(priceOverrides).some(([dDate, byDish]) =>
      Object.entries(byDish).some(
        ([dId, p]) => p !== undefined && !offMenuKeys.has(`${dDate}:${dId}`),
      ),
    );
    if (hasForbiddenOverrides) {
      toast.error(
        "Los platos del menú semanal no admiten precios manuales. Los precios especiales solo aplican a platos fuera de menú.",
      );
      return;
    }

    // Validate custom items
    for (const c of customItems) {
      const p = parseFloat(c.price.replace(",", "."));
      if (!c.name.trim() || isNaN(p) || p <= 0 || c.qty <= 0) {
        toast.error(
          `La preparación libre '${c.name || "sin nombre"}' debe tener un precio manual mayor a 0 y raciones válidas.`,
        );
        return;
      }
    }

    // Build Lines
    const lines: UniversalOrderCaptureLineInput[] = [];
    for (const [dayDate, dayQtyMap] of Object.entries(quantities)) {
      for (const [dishId, qty] of Object.entries(dayQtyMap)) {
        if (qty > 0) {
          const isOff = offMenuKeys.has(`${dayDate}:${dishId}`);
          const comment = comments[dayDate]?.[dishId]?.trim() || null;
          const override = priceOverrides[dayDate]?.[dishId];
          const publishedOfferPrice = isOff ? undefined : offerPriceMap.get(`${dayDate}:${dishId}`);
          const catalogDish = allDishes.find((d) => d.id === dishId);
          const resolvedPrice =
            override !== undefined
              ? override
              : publishedOfferPrice !== undefined
                ? publishedOfferPrice
                : catalogDish?.price ?? null;

          if (resolvedPrice === null && !isOff) {
            toast.error(
              `El plato '${catalogDish?.name ?? dishId}' no tiene precio asignado en la oferta ni en el catálogo.`,
            );
            return;
          }

          lines.push({
            dayDate,
            dishId,
            qty,
            comment,
            isOffMenu: isOff ? true : undefined,
            unitPriceOverride: isOff && override !== undefined ? override : undefined,
          });
        }
      }
    }

    if (lines.length === 0 && customItems.length === 0) {
      toast.error("Debes seleccionar al menos un plato o preparación en la semana.");
      return;
    }

    if (isEditingDietaryOverride) {
      const reason = dietaryOverrideReason.trim();
      if (!reason || reason.length < 5) {
        toast.error(
          "Debe especificar un motivo obligatorio para la personalización de este pedido (mínimo 5 caracteres).",
        );
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
        siteId: isCompanyContext ? selectedSiteId || null : null,
        organizationalUnitId: isCompanyContext ? selectedOrganizationalUnitId || null : null,
        lines,
        customLines: customItems,
        dietaryOverride: isEditingDietaryOverride
          ? {
              dietaryNotes: dietaryOverrideNotes.trim() ? dietaryOverrideNotes.trim() : null,
              overrideReason: dietaryOverrideReason.trim() ? dietaryOverrideReason.trim() : null,
            }
          : null,
      };

      const captureSession = (captureSessionRef.current ??= createCustomCaptureSession(
        await customCaptureTransport(),
      ));

      const result = await StaffOrderCaptureService.captureOrder(ctx, dto, {
        session: captureSession,
        beforeCommit: (preparedSession) => {
          const canonicalRequestId = preparedSession.review?.request?.requestId;
          if (!canonicalRequestId) {
            throw new Error("CANNOT_COMMIT_WITHOUT_CANONICAL_REQUEST_ID");
          }
          // Persist minimal recovery token with the exact canonical requestId before commit is invoked.
          // Throws StoragePersistenceError if localStorage is unavailable or write cannot be verified,
          // which immediately aborts commit. Zero customer personal names or PII stored.
          savePendingCaptureToken({
            requestId: canonicalRequestId,
            tenantId,
            customerId: customerMode === "new" ? "new_customer_placeholder" : selectedCustomerId,
            weekStart,
            lineCount: lines.length + customItems.length,
            timestamp: new Date().toISOString(),
          });
        },
      });

      // Clear the pending token on successful commit
      clearPendingCaptureToken(tenantId);
      captureSessionRef.current = undefined;
      setPendingRecovery(null);
      setOffMenuKeys(new Set());
      setCustomItems([]);
      setQuantities({});
      setComments({});
      setPriceOverrides({});

      toast.success(
        autoConfirm
          ? `Pedido confirmado con éxito (#${result.order.id.slice(0, 8)}) por ${result.total.toFixed(2)} €`
          : `Borrador de pedido guardado (#${result.order.id.slice(0, 8)}) por ${result.total.toFixed(2)} €`,
      );

      onSuccess?.(result);
      onOpenChange(false);
    } catch (e) {
      const isKnownNonPublishedError =
        e instanceof Error &&
        ([
          "OFFER_PRICING_OVERRIDE_UNSUPPORTED",
          "CUSTOM_NOT_ENABLED",
          "PRICE_CHANGED",
          "QUOTE_INPUT_MISMATCH",
          "PERMISSION_DENIED",
          "ORDER_CLOSED",
          "PRICE_UNAVAILABLE",
          "OFFER_NOT_FOUND",
          "OFFER_AMBIGUOUS",
          "COMMERCIAL_QUOTE_REQUIRED",
          "TENANT_MISMATCH",
          "STORAGE_PERSISTENCE_FAILED",
        ].includes(e.message) ||
          e.name === "StoragePersistenceError" ||
          e.message.startsWith("Failed to persist recovery token") ||
          e.message.startsWith("LocalStorage is not available"));

      if (isKnownNonPublishedError) {
        clearPendingCaptureToken(tenantId);
        setPendingRecovery(null);
      } else {
        // Uncertain error (e.g. network timeout or server dropped response)
        // Keep pending token and refresh state so drawer locks against new distinct captures
        const token = getPendingCaptureToken(tenantId);
        setPendingRecovery(token);
      }
      toast.error(e instanceof Error ? e.message : "Error al procesar el pedido");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!canonicalLocked) onOpenChange(next);
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col p-0 gap-0"
      >
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
                disabled={canonicalLocked}
                title="Semana anterior"
                onClick={() => {
                  const prev = offsetWeekMonday(weekStart, -1);
                  setWeekStart(prev);
                  setSelectedDayDate(prev);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge
                variant={menuView?.status === "published" ? "secondary" : "outline"}
                className="font-mono text-xs"
              >
                Semana: {weekStart}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                disabled={canonicalLocked}
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

        <div
          className="min-h-0 min-w-0 flex-1 overflow-y-auto"
          data-testid="order-capture-scroll"
          inert={canonicalLocked}
        >
          {pendingRecovery && (
            <div
              data-testid="pending-capture-reconciliation-alert"
              className="m-4 sm:m-6 mb-0 p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive dark:text-red-300 text-xs"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-bold text-sm">
                    Captura previa con resultado incierto detectada (#{pendingRecovery.requestId.slice(0, 8)})
                  </p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Se registró un intento de confirmación previo para{" "}
                    <strong>el cliente (#{pendingRecovery.customerId.slice(0, 8)})</strong> (Semana {pendingRecovery.weekStart}) cuya respuesta del servidor quedó interrumpida. Para prevenir pedidos duplicados en el ledger canónico, las nuevas capturas están bloqueadas hasta que el servidor confirme el pedido.
                  </p>
                  <p className="text-[11px] leading-relaxed opacity-80">
                    Si el ledger no contiene el pedido tras comprobar el estado, contacta con el administrador del sistema para verificar los registros del servidor antes de iniciar una nueva captura.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="text-xs h-7 gap-1.5"
                      disabled={reconciling}
                      onClick={handleReconcilePending}
                    >
                      {reconciling ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Comprobando servidor...
                        </>
                      ) : (
                        "Comprobar estado en servidor"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {isTenantCaptureFrozen && (
            <div className="m-4 sm:m-6 mb-0 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs">
              <p className="font-bold mb-1">{EATCLEAN_PARTIAL_LAUNCH_CONFIG.frozenMessage}</p>
              <p className="text-[11px] opacity-90">
                La captura administrativa de pedidos se encuentra pausada temporalmente mientras se
                completa la activación comercial.
              </p>
            </div>
          )}
          <div className="p-4 sm:p-6 space-y-6">
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
                          <p className="text-xs text-muted-foreground">
                            ID: {selectedCustomerId.slice(0, 8)}
                          </p>
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
                                Personalización temporal para este pedido (no modifica el perfil
                                maestro):
                              </p>
                              <div>
                                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                  Motivo de personalización{" "}
                                  <span className="text-destructive font-bold">*</span> (mínimo 5
                                  caracteres):
                                </label>
                                <Input
                                  value={dietaryOverrideReason}
                                  onChange={(e) => setDietaryOverrideReason(e.target.value)}
                                  placeholder="Ej. Invitado en la cena / excepción temporal (obligatorio)"
                                  className="h-7 text-xs"
                                  required
                                />
                                {dietaryOverrideReason.trim().length > 0 &&
                                  dietaryOverrideReason.trim().length < 5 && (
                                    <p className="text-[10px] text-destructive mt-0.5">
                                      El motivo debe tener al menos 5 caracteres.
                                    </p>
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
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          Buscando...
                        </div>
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
                        <div className="space-y-1 min-w-0">
                          <Label className="text-[11px] text-muted-foreground">
                            Sede de Entrega
                          </Label>
                          <select
                            value={selectedSiteId}
                            onChange={(e) => setSelectedSiteId(e.target.value)}
                            className="w-full max-w-full truncate h-8 rounded-md border border-border bg-background px-2 text-xs"
                          >
                            <option value="">Sede principal / Sin especificar</option>
                            {companySites.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} {s.address ? `(${s.address})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1 min-w-0">
                          <Label className="text-[11px] text-muted-foreground">
                            Departamento / Unidad
                          </Label>
                          <select
                            value={selectedOrganizationalUnitId}
                            onChange={(e) => setSelectedOrganizationalUnitId(e.target.value)}
                            className="w-full max-w-full truncate h-8 rounded-md border border-border bg-background px-2 text-xs"
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

            {customItems.length > 0 && (
              <div className="rounded-lg border border-purple-500/30 bg-purple-50/20 dark:bg-purple-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-purple-900 dark:text-purple-200">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    Preparaciones libres añadidas ({customItems.length})
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-purple-100 text-purple-800 border-purple-300">
                    Fuera de carta
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {customItems.map((c) => (
                    <div
                      key={c.key}
                      className="flex items-center justify-between text-xs bg-background/80 px-2.5 py-1.5 rounded border border-border/60"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-muted-foreground ml-2 font-mono">
                          ({c.dayDate}) · {c.qty} ración(es) @ {parseFloat(c.price).toFixed(2)} €
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => handleRemoveCustomItem(c.key)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                <div className="overflow-x-auto pb-1">
                  <TabsList className="grid grid-cols-7 min-w-[360px] sm:min-w-0 h-auto p-1 bg-muted/60">
                    {weekDays.map((d) => {
                      const { dayName, formattedDate } = formatDayDateEs(d.date);
                      const count =
                        Object.values(quantities[d.date] || {}).reduce((a, b) => a + b, 0) +
                        customItems.filter((c) => c.dayDate === d.date).reduce((a, b) => a + b.qty, 0);
                      return (
                        <TabsTrigger
                          key={d.date}
                          value={d.date}
                          aria-label={`${dayName}, ${formattedDate} ${d.date.slice(0, 4)}; ${count} ${count === 1 ? "ración" : "raciones"}`}
                          className="py-1.5 px-1 text-xs flex flex-col items-center gap-0.5 min-w-0"
                        >
                          <span className="font-semibold text-[11px] truncate">
                            {d.label.slice(0, 3)}
                          </span>
                          <span className="text-[11px] whitespace-nowrap">{formattedDate}</span>
                          {count > 0 ? (
                            <Badge
                              variant="secondary"
                              className="h-4 px-1 text-[10px] font-mono shrink-0"
                            >
                              {count}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>

                {weekDays.map((d) => {
                  const dayDishes =
                    menuView?.days.find((day) => day.dayDate === d.date)?.dishes ?? [];
                  const dayOffMenuDishIds = Object.keys(quantities[d.date] || {}).filter(
                    (id) => (quantities[d.date]?.[id] || 0) > 0 && offMenuKeys.has(`${d.date}:${id}`),
                  );
                  const dayCustomItems = customItems.filter((c) => c.dayDate === d.date);
                  const dayDishIds = new Set(dayDishes.map((dd) => dd.id));
                  const filteredCatalog = catalogDishes.filter((dish) => {
                    if (dayDishIds.has(dish.id)) return false;
                    if (!offMenuSearch.trim()) return true;
                    const q = offMenuSearch.toLowerCase().trim();
                    return (
                      dish.name.toLowerCase().includes(q) ||
                      (dish.tagline && dish.tagline.toLowerCase().includes(q))
                    );
                  });

                  return (
                    <TabsContent key={d.date} value={d.date} className="mt-4 space-y-3">
                      <div className="flex items-center justify-between pb-1 gap-2 flex-wrap">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {dishTab === "menu"
                            ? `Menú semanal para ${d.label} (${d.date})`
                            : `Catálogo fuera de menú para ${d.label} (${d.date})`}
                        </p>
                        <div className="flex items-center gap-2">
                          {dishTab === "menu" && menuView?.status === "published" && (
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {dayDishes.length}{" "}
                              {dayDishes.length === 1 ? "plato ofertado" : "platos ofertados"}
                            </span>
                          )}
                          {isStaffAdmin && (
                            <div className="flex items-center gap-1 bg-muted/70 p-0.5 rounded-md">
                              <button
                                type="button"
                                onClick={() => setDishTab("menu")}
                                className={cn(
                                  "px-2 py-0.5 text-xs font-medium rounded transition-all",
                                  dishTab === "menu"
                                    ? "bg-background text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground",
                                )}
                              >
                                Menú semanal
                              </button>
                              <button
                                type="button"
                                onClick={() => setDishTab("off_menu")}
                                className={cn(
                                  "px-2 py-0.5 text-xs font-medium rounded transition-all flex items-center gap-1",
                                  dishTab === "off_menu"
                                    ? "bg-background text-foreground shadow-xs font-semibold text-amber-700 dark:text-amber-300"
                                    : "text-muted-foreground hover:text-foreground",
                                )}
                              >
                                Fuera de menú
                                {dayOffMenuDishIds.length > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="h-3.5 px-1 text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                                  >
                                    {dayOffMenuDishIds.length}
                                  </Badge>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {dishTab === "menu" ? (
                        <>
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
                                {customEnabled
                                  ? "Los platos requieren un menú publicado. Los personalizados pueden capturarse sin él."
                                  : "Publica el menú semanal en la sección de Menús para habilitar la captura de pedidos para estas fechas."}
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
                                      qty > 0
                                        ? "border-primary/50 bg-primary/5"
                                        : "border-border bg-card",
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
                                          <p className="text-sm font-medium leading-none truncate">
                                            {dish.name}
                                          </p>
                                          <DishAllergenDeclaration
                                            allergens={dish.allergens}
                                            showDeclared
                                          />
                                          {(() => {
                                            const publishedOfferPrice = offerPriceMap.get(
                                              `${d.date}:${dish.id}`,
                                            );
                                            const displayPrice =
                                              publishedOfferPrice !== undefined
                                                ? publishedOfferPrice
                                                : dish.price;
                                            if (displayPrice !== null && displayPrice > 0) {
                                              return (
                                                <p className="text-xs text-muted-foreground font-mono">
                                                  {displayPrice.toFixed(2)} € / ración
                                                  {publishedOfferPrice !== undefined &&
                                                    dish.price !== null &&
                                                    publishedOfferPrice !== dish.price && (
                                                      <span className="text-[10px] text-primary ml-1.5 font-sans font-medium">
                                                        (oferta semanal)
                                                      </span>
                                                    )}
                                                </p>
                                              );
                                            }
                                            if (displayPrice === 0) {
                                              return (
                                                <p className="text-xs text-muted-foreground font-mono">
                                                  0,00 € (Sin coste)
                                                </p>
                                              );
                                            }
                                            return (
                                              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                ⚠️ Precio no asignado (Requiere ajuste)
                                              </p>
                                            );
                                          })()}
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

                          {/* Platos añadidos fuera de menú para este día */}
                          {dayOffMenuDishIds.length > 0 && (
                            <div className="pt-3 border-t border-dashed border-amber-500/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                                  >
                                    Excepción Fuera de Menú
                                  </Badge>
                                  Platos añadidos para este día ({dayOffMenuDishIds.length})
                                </span>
                              </div>
                              <div className="space-y-3">
                                {dayOffMenuDishIds.map((dishId) => {
                                  const dish = allDishes.find((item) => item.id === dishId);
                                  if (!dish) return null;
                                  const qty = quantities[d.date]?.[dish.id] || 0;
                                  const comment = comments[d.date]?.[dish.id] || "";
                                  return (
                                    <div
                                      key={dish.id}
                                      className="p-3 rounded-lg border border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/20"
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
                                            <div className="flex items-center gap-2">
                                              <p className="text-sm font-medium leading-none truncate">
                                                {dish.name}
                                              </p>
                                              <Badge
                                                variant="outline"
                                                className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 shrink-0"
                                              >
                                                Fuera de Menú
                                              </Badge>
                                            </div>
                                            <DishAllergenDeclaration
                                              allergens={dish.allergens}
                                              showDeclared
                                            />
                                            <p className="text-xs text-muted-foreground font-mono">
                                              {dish.price != null
                                                ? `${dish.price.toFixed(2)} € (catálogo)`
                                                : "0,00 €"}
                                            </p>
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
                                      {qty > 0 && (
                                        <div className="mt-3 pt-2 border-t border-border/60 text-xs">
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
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-md mb-2">
                            <button
                              type="button"
                              onClick={() => setOffMenuSubTab("catalog")}
                              className={cn(
                                "flex-1 py-1 px-2.5 text-xs font-medium rounded transition-all text-center",
                                offMenuSubTab === "catalog"
                                  ? "bg-background text-foreground shadow-xs font-semibold"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              📚 Platos de Biblioteca ({filteredCatalog.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setOffMenuSubTab("custom")}
                              className={cn(
                                "flex-1 py-1 px-2.5 text-xs font-medium rounded transition-all text-center flex items-center justify-center gap-1.5",
                                offMenuSubTab === "custom"
                                  ? "bg-background text-foreground shadow-xs font-semibold text-purple-700 dark:text-purple-300"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <Sparkles className="h-3 w-3" />
                              Preparación Libre
                              {dayCustomItems.length > 0 && (
                                <Badge variant="secondary" className="h-3.5 px-1 text-[9px] bg-purple-100 text-purple-800">
                                  {dayCustomItems.length}
                                </Badge>
                              )}
                            </button>
                          </div>

                          {offMenuSubTab === "catalog" ? (
                            <div className="space-y-3">
                              <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold">Excepción Administrativa Controlada</p>
                                  <p className="text-[11px] opacity-90">
                                    Selecciona platos activos del catálogo de la Biblioteca para este día. El sistema sugiere un precio según el histórico y permite modificarlo antes de confirmar sin modificar el menú semanal publicado.
                                  </p>
                                </div>
                              </div>

                              <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                  placeholder="Buscar en el catálogo general (nombre, descripción)..."
                                  value={offMenuSearch}
                                  onChange={(e) => setOffMenuSearch(e.target.value)}
                                  className="h-8 pl-8 text-xs"
                                />
                              </div>

                              {loadingCatalog ? (
                                <div className="py-8 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando catálogo de la biblioteca...
                                </div>
                              ) : filteredCatalog.length === 0 ? (
                                <div className="py-8 px-4 text-center rounded-lg border border-dashed text-muted-foreground text-xs">
                                  No se encontraron platos en el catálogo {offMenuSearch.trim() ? `para "${offMenuSearch}"` : "disponibles fuera de menú para este día"}.
                                </div>
                              ) : (
                                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                                  {filteredCatalog.map((dish) => {
                                    const qty = quantities[d.date]?.[dish.id] || 0;
                                    const isAdded = offMenuKeys.has(`${d.date}:${dish.id}`) && qty > 0;
                                    const comment = comments[d.date]?.[dish.id] || "";
                                    const hist = historicalPrices[dish.id];
                                    const override = priceOverrides[d.date]?.[dish.id];

                                    return (
                                      <div
                                        key={dish.id}
                                        className={cn(
                                          "p-3 rounded-lg border transition-all",
                                          isAdded
                                            ? "border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/30"
                                            : "border-border bg-card",
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
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium leading-none truncate">
                                                  {dish.name}
                                                </p>
                                                <Badge
                                                  variant="outline"
                                                  className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 shrink-0"
                                                >
                                                  Excepción Fuera de Menú
                                                </Badge>
                                                {hist?.source === "customer_history" && (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1 shrink-0"
                                                  >
                                                    <History className="h-2.5 w-2.5" />
                                                    Histórico cliente: {hist.suggestedPrice.toFixed(2)} €
                                                  </Badge>
                                                )}
                                                {hist?.source === "tenant_history" && (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-[10px] bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 flex items-center gap-1 shrink-0"
                                                  >
                                                    <History className="h-2.5 w-2.5" />
                                                    Histórico general: {hist.suggestedPrice.toFixed(2)} €
                                                  </Badge>
                                                )}
                                              </div>
                                              <DishAllergenDeclaration
                                                allergens={dish.allergens}
                                                showDeclared
                                              />
                                              <p className="text-xs text-muted-foreground font-mono">
                                                {dish.price != null
                                                  ? `${dish.price.toFixed(2)} € (catálogo)`
                                                  : "0,00 €"}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            {isAdded ? (
                                              <div className="flex items-center gap-2">
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  onClick={() => handleQtyChange(d.date, dish.id, -1)}
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
                                            ) : (
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-8 gap-1 border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950 font-medium"
                                                onClick={() => handleAddOffMenuDish(d.date, dish.id)}
                                              >
                                                <Plus className="h-3.5 w-3.5" />
                                                Añadir al día
                                              </Button>
                                            )}
                                          </div>
                                        </div>

                                        {isAdded && (
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
                                                Precio unitario acordado (€):
                                              </Label>
                                              <Input
                                                type="number"
                                                step="0.10"
                                                min="0"
                                                placeholder="Precio acordado"
                                                value={override !== undefined ? override : (dish.price ?? "")}
                                                onChange={(e) =>
                                                  handlePriceOverrideChange(d.date, dish.id, e.target.value)
                                                }
                                                className="h-7 text-xs font-mono border-amber-300"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="p-2.5 rounded-lg border border-purple-500/30 bg-purple-50/40 dark:bg-purple-950/20 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold">Preparación Libre (Fuera de Carta)</p>
                                  <p className="text-[11px] opacity-90">
                                    Registra una preparación no catalogada para este día. El precio manual es obligatorio y no altera la biblioteca de platos.
                                  </p>
                                </div>
                              </div>

                              {reusableItems.length > 0 && (
                                <div className="space-y-1.5 p-2.5 rounded-lg border bg-muted/40">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                                      <History className="h-3.5 w-3.5 text-primary" />
                                      Histórico reutilizable (Nivel 2)
                                    </Label>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                      {reusableItems.length} preparaciones
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                                    {reusableItems.map((item, idx) => (
                                      <button
                                        key={`${item.name}-${idx}`}
                                        type="button"
                                        onClick={() => handleSelectReusableCustomItem(item)}
                                        className="text-xs px-2 py-1 rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground text-left transition-colors flex items-center gap-1"
                                        title={item.description || item.name}
                                      >
                                        <span className="font-medium truncate max-w-[220px]">{item.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground italic">
                                    Al hacer clic se copian el nombre y descripción. El precio unitario debe reintroducirse manualmente.
                                  </p>
                                </div>
                              )}

                              <div className="space-y-3 p-3 rounded-lg border border-border bg-card">
                                <p className="text-xs font-semibold">Añadir preparación para {d.label} ({d.date})</p>
                                <div className="space-y-2">
                                  <div className="space-y-1">
                                    <Label htmlFor={`custom-name-${d.date}`} className="text-xs">
                                      Nombre de la preparación (*)
                                    </Label>
                                    <Input
                                      id={`custom-name-${d.date}`}
                                      placeholder="Ej. Salmón a la plancha con puré de coliflor sin sal"
                                      value={customName}
                                      onChange={(e) => setCustomName(e.target.value)}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`custom-desc-${d.date}`} className="text-xs">
                                      Descripción / Ingredientes (opcional)
                                    </Label>
                                    <Input
                                      id={`custom-desc-${d.date}`}
                                      placeholder="Ej. 200g salmón fresco, coliflor hervida sin lácteos"
                                      value={customDescription}
                                      onChange={(e) => setCustomDescription(e.target.value)}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label htmlFor={`custom-qty-${d.date}`} className="text-xs">
                                        Raciones (*)
                                      </Label>
                                      <Input
                                        id={`custom-qty-${d.date}`}
                                        type="number"
                                        min="1"
                                        value={customQty}
                                        onChange={(e) => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="h-8 text-xs font-mono"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label htmlFor={`custom-price-${d.date}`} className="text-xs">
                                        Precio unitario (€) (*) <span className="text-destructive font-bold">Manual</span>
                                      </Label>
                                      <Input
                                        id={`custom-price-${d.date}`}
                                        type="number"
                                        step="0.10"
                                        min="0.01"
                                        placeholder="0.00 €"
                                        value={customPrice}
                                        onChange={(e) => setCustomPrice(e.target.value)}
                                        className="h-8 text-xs font-mono border-amber-400 focus-visible:ring-amber-400"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`custom-notes-${d.date}`} className="text-xs flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3 text-amber-500" /> Notas especiales para cocina
                                    </Label>
                                    <Input
                                      id={`custom-notes-${d.date}`}
                                      placeholder="Ej. Servir en envase hermético biodegradable, no usar pimienta"
                                      value={customComment}
                                      onChange={(e) => setCustomComment(e.target.value)}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleAddCustomPreparation(d.date)}
                                    className="w-full text-xs font-medium gap-1.5 mt-1"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Añadir preparación a {d.label}
                                  </Button>
                                </div>
                              </div>

                              {dayCustomItems.length > 0 && (
                                <div className="space-y-2 pt-2">
                                  <Label className="text-xs font-semibold">
                                    Preparaciones añadidas para este día ({dayCustomItems.length})
                                  </Label>
                                  {dayCustomItems.map((item) => (
                                    <div
                                      key={item.key}
                                      className="p-3 rounded-lg border border-purple-500/30 bg-purple-50/10 flex items-center justify-between gap-3"
                                    >
                                      <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-xs truncate">{item.name}</span>
                                          <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200">
                                            Fuera de carta
                                          </Badge>
                                        </div>
                                        {item.description && (
                                          <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
                                        )}
                                        <p className="text-xs font-mono text-muted-foreground">
                                          {item.qty} ración(es) @ {parseFloat(item.price).toFixed(2)} € = {(item.qty * parseFloat(item.price)).toFixed(2)} €
                                        </p>
                                        {item.comment && (
                                          <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                            ⚠️ Cocina: {item.comment}
                                          </p>
                                        )}
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                                        onClick={() => handleRemoveCustomItem(item.key)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
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
          </div>
        </div>

        {/* 4. FOOTER CON RESUMEN ECONÓMICO Y BOTONES */}
        <SheetFooter className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:space-x-0">
          <div className="text-left flex items-baseline justify-between sm:block">
            <p className="text-xs text-muted-foreground">
              Total: <strong>{totalPortions}</strong> raciones
            </p>
            <p className="text-lg font-bold font-mono text-primary">{grandTotal.toFixed(2)} €</p>
          </div>
          <div className="flex items-center gap-2 justify-end shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSubmit(false)}
              disabled={submitting || totalPortions === 0 || isTenantCaptureFrozen || !!pendingRecovery}
              className="shrink-0 text-xs"
            >
              Guardar Borrador
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => handleSubmit(true)}
              disabled={submitting || totalPortions === 0 || isTenantCaptureFrozen || !!pendingRecovery}
              className="gap-1.5 shrink-0 text-xs font-semibold"
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
