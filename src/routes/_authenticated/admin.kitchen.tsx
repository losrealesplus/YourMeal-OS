import type { OperationalRollbackScope } from "@/modules/operations/domain/operational-status";
/**
 * Workspace Cocina — pedidos reales, filtros y transición de estado.
 * PR-034 · Operations Workspace Activation
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useState } from "react";
import { ChefHat, RefreshCw, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OperationalTimeline } from "@/components/operations/operational-timeline";
import { MonthlyOperationsCalendar } from "@/components/operations/monthly-operations-calendar";
import { SectionTitle } from "@/components/admin";
import { DietaryBadges } from "@/components/operations/dietary-badges";
import { DishSafetyAlert } from "@/components/operations/dish-safety-alert";
import { BootstrapReadinessBanner } from "@/components/tenant/bootstrap-readiness-banner";
import {
  useBulkOrderSelection,
  BulkActionBar,
  BulkAdvanceModal,
  BulkRollbackModal,
  executeRollbackOrders,
  isOrderMultiDay,
  type BulkExecutionResult,
} from "@/components/orders/bulk-order-actions";
import { useOrder } from "@/order/useOrder";
import {
  confirmOrderCommand,
  readyForKitchenCommand,
  scheduleProductionCommand,
  readyForDeliveryCommand,
} from "@/order/OrderCommands";
import {
  OperationsService,
  kitchenNextStatuses,
  operationalStatusLabel,
  type OperationalOrderListItem,
  type OperationalStatus,
} from "@/modules/operations";
import {
  getRollbackStatus,
  ROLLBACK_LABEL_ES,
  isOperationalRollbackEnabled,
} from "@/modules/operations/domain/operational-status";

export const Route = createFileRoute("/_authenticated/admin/kitchen")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "kitchen.operate");
  },
  component: KitchenWorkspacePage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Cocina" },
      {
        name: "description",
        content: "Pedidos pendientes de preparación (piloto EatClean).",
      },
    ],
  }),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function executeBulkAdvanceOrders(
  eligibleOrders: OperationalOrderListItem[],
  orderApi: Pick<
    ReturnType<typeof useOrder>,
    "confirmOrder" | "scheduleProduction" | "readyForKitchen" | "readyForDelivery"
  >,
): Promise<BulkExecutionResult> {
  const result: BulkExecutionResult = {
    succeeded: [],
    omitted: [],
    failed: [],
  };

  for (const o of eligibleOrders) {
    try {
      let res;
      let target: OperationalStatus;
      if (o.status === "draft") {
        target = "confirmed";
        res = await orderApi.confirmOrder(confirmOrderCommand({ orderId: o.id }));
      } else if (o.status === "confirmed") {
        target = "in_production";
        res = await orderApi.scheduleProduction(scheduleProductionCommand({ orderId: o.id }));
      } else if (o.status === "in_production") {
        target = "prepared";
        res = await orderApi.readyForKitchen(readyForKitchenCommand({ orderId: o.id }));
      } else if (o.status === "prepared") {
        target = "ready_for_delivery";
        res = await orderApi.readyForDelivery(readyForDeliveryCommand({ orderId: o.id }));
      } else {
        result.omitted.push({ orderId: o.id, reason: `Estado ${o.status} omitido` });
        continue;
      }

      if (res.ok) {
        result.succeeded.push({ orderId: o.id, from: o.status, to: target });
      } else {
        result.failed.push({
          orderId: o.id,
          error: res.errors[0]?.message ?? "Error desconocido al avanzar",
        });
      }
    } catch (err: any) {
      result.failed.push({
        orderId: o.id,
        error: err.message ?? "Error inesperado",
      });
    }
  }

  return result;
}

export function KitchenWorkspacePage() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  const [date, setDate] = useState(todayISO());
  const [companyId, setCompanyId] = useState<string>("all");
  const [siteId, setSiteId] = useState<string>("all");
  const [deliveryGroupId, setDeliveryGroupId] = useState<string>("all");
  const [orders, setOrders] = useState<OperationalOrderListItem[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [sites, setSites] = useState<
    { id: string; name: string; company_id: string }[]
  >([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OperationalOrderListItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const orderApi = useOrder();
  const {
    selectedOrderIds,
    selectedOrders,
    selectedPortions,
    toggleSelectOrder,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
    isPartiallySelected,
  } = useBulkOrderSelection(orders, [date, companyId, siteId, deliveryGroupId]);

  const [bulkAdvanceOpen, setBulkAdvanceOpen] = useState(false);
  const [bulkRollbackOpen, setBulkRollbackOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Single order rollback in detail modal
  const [detailRollbackOpen, setDetailRollbackOpen] = useState(false);
  const [detailRollbackNeedsRefresh, setDetailRollbackNeedsRefresh] = useState(false);
  const [detailRollbackBusy, setDetailRollbackBusy] = useState(false);

  const loadFilters = useCallback(async () => {
    /* Tables/columns from ADR 0015 may lag generated types */
    const db = supabase as any;
    const [cRes, sRes, gRes] = await Promise.all([
      db.from("companies").select("id, name").is("deleted_at", null).order("name"),
      db
        .from("company_locations")
        .select("id, name, company_id")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("name"),
      db
        .from("delivery_groups")
        .select("id, name")
        .is("deleted_at", null)
        .order("name"),
    ]);
    setCompanies((cRes.data as { id: string; name: string }[]) ?? []);
    setSites(
      (sRes.data as { id: string; name: string; company_id: string }[]) ?? [],
    );
    setGroups((gRes.data as { id: string; name: string }[]) ?? []);
  }, []);

  const load = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      const rows = await OperationsService.listKitchenOrders(ctx, {
        deliveryDate: date,
        companyId: companyId === "all" ? null : companyId,
        siteId: siteId === "all" ? null : siteId,
        deliveryGroupId: deliveryGroupId === "all" ? null : deliveryGroupId,
      });
      setOrders(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar cocina");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles, date, companyId, siteId, deliveryGroupId]);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredSites =
    companyId === "all" ? sites : sites.filter((s) => s.company_id === companyId);

  async function advance(
    order: OperationalOrderListItem,
    next: OperationalStatus,
  ) {
    if (!user || !tenantId) return;
    setBusyId(order.id);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await OperationsService.transitionKitchen(ctx, order.id, next);
      toast.success(`Pedido → ${operationalStatusLabel(next)}`);
      setDetail(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transición rechazada");
    } finally {
      setBusyId(null);
    }
  }

  const executeBulkAdvance = async (
    eligibleOrders: OperationalOrderListItem[],
  ): Promise<BulkExecutionResult> => {
    setBulkBusy(true);
    try {
      const result = await executeBulkAdvanceOrders(eligibleOrders, orderApi);
      clearSelection();
      await load();
      if (result.succeeded.length > 0) {
        toast.success(
          `Se avanzaron ${result.succeeded.length} pedidos correctamente.`,
        );
      }
      if (result.failed.length > 0) {
        toast.error(
          `${result.failed.length} pedidos fallaron al avanzar. Revisa el resumen.`,
        );
      }
      return result;
    } finally {
      setBulkBusy(false);
    }
  };

  const executeBulkRollback = async (
    eligibleOrders: OperationalOrderListItem[], reason: string,
    scope: Pick<OperationalRollbackScope, "allowMultiDay" | "operatingDate">,
  ): Promise<BulkExecutionResult> => {
    setBulkBusy(true);
    try {
      const result = await executeRollbackOrders(eligibleOrders, reason, scope, orderApi);
      await load();
      return result;
    } finally { setBulkBusy(false); }
  };

  const detailRollbackStatus = detail ? getRollbackStatus(detail.status) : null;
  const detailRollbackLabel = detail && detailRollbackStatus ? ROLLBACK_LABEL_ES[detail.status] : null;
  const detailIsV2 = detail?.writeContractVersion === 2;


  if (!can("kitchen.operate")) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No tienes permiso de cocina.{" "}
        <Link to="/admin" className="text-primary underline-offset-4 hover:underline">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle
          overline="Operaciones"
          title="Cocina"
          subtitle="Pedidos pendientes de preparación. Filtros por fecha, empresa, sede y delivery group."
        />
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to="/admin/kitchen-execution" search={{ date }}>
              <ChefHat className="mr-2 h-4 w-4" />
              Ejecución
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/production-sheet" search={{ date }}>
              Hoja de Producción
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <BootstrapReadinessBanner
        focus={["BOOTSTRAP_NO_KITCHEN_DEMAND", "BOOTSTRAP_NO_PUBLISHED_MENU"]}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "daily" | "monthly")} className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Pedidos Diarios</TabsTrigger>
          <TabsTrigger value="monthly">Calendario Mensual</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <MonthlyOperationsCalendar
            onSelectDate={(selectedDate) => {
              setDate(selectedDate);
              setActiveTab("daily");
            }}
          />
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="kitchen-date">Fecha</Label>
              <Input
                id="kitchen-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Select
                value={companyId}
                onValueChange={(v) => {
                  setCompanyId(v);
                  setSiteId("all");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Sede</Label>
          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {filteredSites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Delivery Group</Label>
          <Select value={deliveryGroupId} onValueChange={setDeliveryGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Barra de Acciones Masivas Contextual */}
      <BulkActionBar
        selectedCount={selectedOrderIds.size}
        selectedPortions={selectedPortions}
        onAdvance={() => setBulkAdvanceOpen(true)}
        onRollback={() => setBulkRollbackOpen(true)}
        onClear={clearSelection}
        busy={bulkBusy}
      />

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          <ChefHat className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No hay pedidos pendientes de cocina para estos filtros.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={
                      orders.length > 0 && selectedOrderIds.size === orders.length
                        ? true
                        : selectedOrderIds.size > 0
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Seleccionar todos los pedidos visibles"
                  />
                </TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>OU</TableHead>
                <TableHead>Delivery Group</TableHead>
                <TableHead>Día</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow
                  key={o.id}
                  className={selectedOrderIds.has(o.id) ? "bg-muted/40" : undefined}
                >
                  <TableCell
                    className="w-12 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedOrderIds.has(o.id)}
                      onCheckedChange={() => toggleSelectOrder(o.id)}
                      aria-label={`Seleccionar pedido ${o.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {o.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-sm">{o.customerName ?? "—"}</TableCell>
                  <TableCell className="text-sm">{o.companyName ?? "—"}</TableCell>
                  <TableCell className="text-sm">{o.siteName ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {o.organizationalUnitName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {o.deliveryGroupName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{o.deliveryDates.join(", ") || date}</span>
                      {isOrderMultiDay(o, date) && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 text-amber-700 dark:text-amber-300 border-amber-300"
                        >
                          {o.temporalScopeKnown === false ? "Alcance no confirmado" : "Multijornada"}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {operationalStatusLabel(o.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setDetail(o)}>
                      Detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      </TabsContent>
      </Tabs>

      {/* Modales de Acciones Masivas */}
      <BulkAdvanceModal
        open={bulkAdvanceOpen}
        onOpenChange={setBulkAdvanceOpen}
        selectedOrders={selectedOrders}
        onExecute={executeBulkAdvance}
        busy={bulkBusy}
        currentOperatingDate={date}
      />

      <BulkRollbackModal
        open={bulkRollbackOpen}
        onOpenChange={(open) => { setBulkRollbackOpen(open); if (!open) clearSelection(); }}
        selectedOrders={selectedOrders}
        onExecute={executeBulkRollback}
        busy={bulkBusy}
        currentOperatingDate={date}
      />

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Pedido {detail.id.slice(0, 8)}</DialogTitle>
              </DialogHeader>
              {isOrderMultiDay(detail, date) && (
                <div
                  data-testid="detail-multiday-alert"
                  className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">
                      {detail.temporalScopeKnown === false
                        ? "Alcance no confirmado:"
                        : "Pedido multijornada:"}
                    </span>{" "}
                    {detail.temporalScopeKnown === false
                      ? "No se pudo confirmar el alcance total de fechas de este pedido. Por seguridad, cualquier cambio de estado debe realizarse con precaución."
                      : `Contiene entregas en varias fechas (${(detail.allDeliveryDates && detail.allDeliveryDates.length > 0
                          ? detail.allDeliveryDates
                          : detail.deliveryDates
                        ).join(", ")}). Cambiar su estado afectará al contrato del pedido completo.`}
                  </div>
                </div>
              )}
              <div className="space-y-4 text-sm">
                <dl className="grid grid-cols-2 gap-2">
                  <div>
                    <dt className="text-muted-foreground">Cliente</dt>
                    <dd>{detail.customerName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Canal</dt>
                    <dd>{detail.demandChannel === "company" ? "B2B" : "B2C"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Empresa</dt>
                    <dd>{detail.companyName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Sede</dt>
                    <dd>{detail.siteName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">OU</dt>
                    <dd>{detail.organizationalUnitName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Delivery Group</dt>
                    <dd>{detail.deliveryGroupName ?? "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Estado</dt>
                    <dd>
                      <Badge className="mt-1">
                        {operationalStatusLabel(detail.status)}
                      </Badge>
                    </dd>
                  </div>
                  {detail.dietarySnapshot && (
                    <div className="col-span-2 pt-1">
                      <dt className="text-muted-foreground text-xs">Alergias y Preferencias</dt>
                      <dd className="mt-1">
                        <DietaryBadges snapshot={detail.dietarySnapshot} />
                      </dd>
                    </div>
                  )}
                  {detail.notes && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Observaciones</dt>
                      <dd>{detail.notes}</dd>
                    </div>
                  )}
                </dl>

                <div>
                  <p className="mb-2 font-medium">Platos</p>
                  <ul className="space-y-1.5 divide-y divide-border/40 rounded-md border p-3">
                    {detail.items.map((it) => {
                      const isCustom = it.line?.kind === "custom";
                      const allergenState = it.line?.allergenState;
                      const allergens = it.line?.allergensSnapshot ?? [];

                      return (
                        <li key={it.id} className="pt-1.5 first:pt-0 flex justify-between items-start gap-2">
                          <div className="space-y-0.5 leading-tight">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium">{it.dishName ?? "Plato"}</span>
                              {isCustom && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] uppercase font-semibold text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800"
                                >
                                  Custom
                                </Badge>
                              )}
                            </div>
                            <DishSafetyAlert
                              isCustom={isCustom}
                              allergenState={allergenState}
                              allergens={allergens}
                              customerAllergens={detail.dietarySnapshot?.allergens}
                            />
                            <span className="block text-xs text-muted-foreground">
                              {it.dayDate}
                              {it.notes ? ` · 🟡 ${it.notes}` : ""}
                            </span>
                          </div>
                          <span className="tabular-nums font-bold text-foreground">
                            ×{it.qty}
                          </span>
                        </li>
                      );
                    })}
                    {detail.items.length === 0 && (
                      <li className="text-muted-foreground">Sin ítems</li>
                    )}
                  </ul>
                </div>

                <OperationalTimeline status={detail.status} />

                <div className="flex flex-wrap gap-2 items-center">
                  {kitchenNextStatuses(detail.status).map((next) => (
                    <Button
                      key={next}
                      size="sm"
                      disabled={busyId === detail.id || detailRollbackBusy}
                      onClick={() => void advance(detail, next)}
                    >
                      → {operationalStatusLabel(next)}
                    </Button>
                  ))}

                  {detailRollbackLabel && detailRollbackStatus && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (detailIsV2) return;
                        setDetailRollbackOpen(true);
                      }}
                      disabled={busyId === detail.id || detailRollbackBusy || detailIsV2 || !isOperationalRollbackEnabled()}
                      title={
                        detailIsV2
                          ? "Los pedidos canónicos v2 no admiten retroceso de estado operacional directo"
                          : undefined
                      }
                      className="gap-1.5 text-xs font-semibold border-amber-500/40 text-amber-900 dark:text-amber-200"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      {detailRollbackLabel}
                      {detailIsV2 && (
                        <span className="text-[10px] text-muted-foreground ml-1">(No disp. v2)</span>
                      )}
                    </Button>
                  )}

                  {kitchenNextStatuses(detail.status).length === 0 && !detailRollbackStatus && (
                    <p className="text-xs text-muted-foreground">
                      Sin transiciones de cocina disponibles.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para retroceso individual de Cocina */}
      <BulkRollbackModal
        open={detailRollbackOpen} onOpenChange={(open) => {
          setDetailRollbackOpen(open);
          if (!open && detailRollbackNeedsRefresh) { setDetailRollbackNeedsRefresh(false); setDetail(null); }
        }}
        selectedOrders={detail ? [detail] : []} busy={detailRollbackBusy}
        currentOperatingDate={date}
        onExecute={async (orders, reason, scope) => {
          setDetailRollbackBusy(true);
          try {
            const result = await executeRollbackOrders(orders, reason, scope, orderApi);
            setDetailRollbackNeedsRefresh(result.succeeded.length > 0 || result.failed.length > 0);
            await load();
            return result;
          } finally { setDetailRollbackBusy(false); }
        }}
      />
    </div>
  );
}

export default KitchenWorkspacePage;
