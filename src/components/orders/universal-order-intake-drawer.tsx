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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import {
  StaffOrderCaptureService,
  type UniversalOrderCaptureDTO,
  type UniversalOrderCaptureLineInput,
  type StaffOrderCaptureResult,
} from "@/modules/orders";
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
  preselectedWeekStart?: string;
  initialDayDate?: string;
  onSuccess?: (result: StaffOrderCaptureResult) => void;
}

const DAY_LABELS_ES: Record<number, string> = {
  0: "Lunes",
  1: "Martes",
  2: "Miércoles",
  3: "Jueves",
  4: "Viernes",
  5: "Sábado",
  6: "Domingo",
};

function getMondayISO(d: Date = new Date()): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().slice(0, 10);
}

function getWeekDates(mondayStr: string): Array<{ date: string; label: string; index: number }> {
  const res: Array<{ date: string; label: string; index: number }> = [];
  const base = new Date(`${mondayStr}T00:00:00Z`);
  for (let i = 0; i < 7; i++) {
    const current = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = current.toISOString().slice(0, 10);
    res.push({
      date: dateStr,
      label: DAY_LABELS_ES[i] || `Día ${i + 1}`,
      index: i,
    });
  }
  return res;
}

type CatalogDish = {
  id: string;
  name: string;
  price: number;
  category?: string | null;
};

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
  preselectedWeekStart,
  initialDayDate,
  onSuccess,
}: UniversalOrderIntakeDrawerProps) {
  const { user, tenantId, roles } = useAuth();

  const [weekStart, setWeekStart] = useState<string>(() => {
    if (initialDayDate) return getMondayISO(new Date(initialDayDate + "T00:00:00Z"));
    if (preselectedWeekStart) return preselectedWeekStart;
    return getMondayISO();
  });
  const weekDays = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const [selectedDayDate, setSelectedDayDate] = useState<string>(() => {
    if (initialDayDate) return initialDayDate;
    return weekDays[0]?.date ?? getMondayISO();
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

  // Dishes & Selection State
  const [dishes, setDishes] = useState<CatalogDish[]>([]);
  const [loadingDishes, setLoadingDishes] = useState(false);

  // Quantities: { [dayDate]: { [dishId]: number } }
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({});
  // Comments: { [dayDate]: { [dishId]: string } }
  const [comments, setComments] = useState<Record<string, Record<string, string>>>({});
  // Price Overrides: { [dayDate]: { [dishId]: number } }
  const [priceOverrides, setPriceOverrides] = useState<Record<string, Record<string, number>>>({});

  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Synchronize week when changed
  useEffect(() => {
    if (initialDayDate) {
      const mon = getMondayISO(new Date(initialDayDate + "T00:00:00Z"));
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

  // Load catalog dishes
  useEffect(() => {
    if (!open || !tenantId) return;
    let isMounted = true;
    async function loadCatalog() {
      setLoadingDishes(true);
      try {
        const { data, error } = await (supabase as any)
          .from("dishes")
          .select("id, name, price, category")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .order("name", { ascending: true });

        if (error) throw error;
        if (isMounted) {
          const rows = (data ?? []) as Array<{
            id: string;
            name: string;
            price: number | null;
            category?: string | null;
          }>;
          setDishes(
            rows.map((d) => ({
              id: d.id,
              name: d.name,
              price: Number(d.price || 0),
              category: d.category,
            })),
          );
        }
      } catch {
        toast.error("Error al cargar el catálogo de platos");
      } finally {
        if (isMounted) setLoadingDishes(false);
      }
    }
    void loadCatalog();
    return () => {
      isMounted = false;
    };
  }, [open, tenantId]);

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

  // Compute live totals
  const { totalPortions, grandTotal } = useMemo(() => {
    let portions = 0;
    let total = 0;
    const dishPriceMap = new Map(dishes.map((d) => [d.id, d.price]));

    for (const [dayDate, dayQtyMap] of Object.entries(quantities)) {
      for (const [dishId, qty] of Object.entries(dayQtyMap)) {
        if (qty > 0) {
          portions += qty;
          const override = priceOverrides[dayDate]?.[dishId];
          const standardPrice = dishPriceMap.get(dishId) ?? 0;
          const effectivePrice = override !== undefined ? override : standardPrice;
          total += effectivePrice * qty;
        }
      }
    }
    return {
      totalPortions: portions,
      grandTotal: Math.round(total * 100) / 100,
    };
  }, [quantities, priceOverrides, dishes]);

  // Submit Order
  const handleSubmit = async (autoConfirm: boolean) => {
    if (!user || !tenantId) return;

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

    setSubmitting(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });

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
        lines,
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
            <Badge variant="outline" className="font-mono text-xs">
              Semana: {weekStart}
            </Badge>
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

              {weekDays.map((d) => (
                <TabsContent key={d.date} value={d.date} className="mt-4 space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Menú para {d.label} ({d.date})
                    </p>
                  </div>

                  {loadingDishes ? (
                    <div className="py-8 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Cargando platos...
                    </div>
                  ) : dishes.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      No hay platos configurados en el catálogo.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dishes.map((dish) => {
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
                            <div className="flex items-center justify-between gap-2">
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium leading-none">{dish.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {dish.price.toFixed(2)} € / ración
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
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
                                    placeholder={`${dish.price.toFixed(2)} € (catálogo)`}
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
              ))}
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
