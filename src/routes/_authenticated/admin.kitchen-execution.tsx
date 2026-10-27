import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Play,
  RefreshCw,
  Wheat,
  Boxes,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionTitle } from "@/components/admin";
import {
  KitchenExecutionService,
  kitchenBatchStatusLabel,
  nextKitchenBatchStatuses,
  primaryKitchenBatchAction,
  type KitchenBatchStatus,
  type ProductionDishBlock,
  type ProductionReportModel,
} from "@/modules/operations";
import { cn } from "@/lib/utils";
import {
  operationalItemIdentity,
  isCustomOperationalItem,
} from "@/production-experience/operational-item-identity";
import {
  CustomOperationalContext,
  OperationalAllergenDeclaration,
} from "@/production-experience/operational-item-presentation";
import { InventoryService } from "@/modules/inventory/application/inventory-service";
import type { InventoryConsumption } from "@/modules/inventory/domain/inventory-consumption";
import type { InventoryStockItem } from "@/modules/inventory/domain/inventory-types";
import { convertUnits } from "@/modules/inventory/domain/unit-conversion";

export const Route = createFileRoute("/_authenticated/admin/kitchen-execution")({
  validateSearch: (search: Record<string, unknown>): { date?: string } => ({
    date: typeof search.date === "string" ? search.date : undefined,
  }),
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "kitchen.operate");
  },
  component: KitchenExecutionPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Ejecución de Cocina" },
      {
        name: "description",
        content: "Workspace vivo de producción por plato.",
      },
    ],
  }),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function batchTone(status: KitchenBatchStatus): string {
  switch (status) {
    case "pending":
      return "bg-secondary text-secondary-foreground";
    case "preparing":
      return "bg-amber-500/15 text-amber-800";
    case "plating":
      return "bg-sky-500/15 text-sky-800";
    case "finished":
      return "bg-emerald-500/15 text-emerald-800";
  }
}

function formatQty(qty: number): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(qty);
}

function consumptionStatusTone(status: string | null): string {
  switch (status) {
    case "planned":
      return "bg-amber-500/15 text-amber-800 border-amber-300 dark:text-amber-300";
    case "applied":
      return "bg-sky-500/15 text-sky-800 border-sky-300 dark:text-sky-300";
    case "sealed":
      return "bg-emerald-500/15 text-emerald-800 border-emerald-300 dark:text-emerald-300";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

function consumptionStatusLabel(status: string | null): string {
  switch (status) {
    case "planned":
      return "Planificado (T1)";
    case "applied":
      return "Aplicado en almacén (T2)";
    case "sealed":
      return "Sellado (T3 · Definitivo)";
    default:
      return "Pendiente de planificar";
  }
}

function KitchenExecutionPage() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const search = Route.useSearch();
  const [date, setDate] = useState(search.date ?? todayISO());
  const [board, setBoard] = useState<ProductionReportModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyDishId, setBusyDishId] = useState<string | null>(null);

  // FLOW-04 Inventory Consumption state
  const [consumption, setConsumption] = useState<InventoryConsumption | null>(null);
  const [consumptionLoading, setConsumptionLoading] = useState(true);
  const [consumptionActionBusy, setConsumptionActionBusy] = useState(false);
  const [stockMap, setStockMap] = useState<Map<string, { stock: number; unit: string }> | null>(
    null,
  );
  const [stockError, setStockError] = useState<string | null>(null);
  const [consumptionError, setConsumptionError] = useState<string | null>(null);
  const [confirmApplyOpen, setConfirmApplyOpen] = useState(false);
  const [confirmSealOpen, setConfirmSealOpen] = useState(false);

  const canOperateInventory = can("inventory.operate");

  const consumptionReqRef = useRef(0);
  const tenantGenRef = useRef(0);
  const activeTenantRef = useRef<string | null>(tenantId);
  const activeDateRef = useRef<string>(date);

  // Tenant / User / Date change: clear visual state immediately to prevent stale cross-context leaks
  useEffect(() => {
    tenantGenRef.current += 1;
    activeTenantRef.current = tenantId;
    activeDateRef.current = date;
    setConsumption(null);
    setStockMap(null);
    setStockError(null);
    setConsumptionError(null);
  }, [tenantId, user?.id, date]);

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
      const model = await KitchenExecutionService.getDayBoard(ctx, {
        deliveryDate: date,
      });
      setBoard(model);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar la ejecución");
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles, date]);

  const loadConsumption = useCallback(async () => {
    if (!user || !tenantId) return;
    const reqId = ++consumptionReqRef.current;
    const curGen = tenantGenRef.current;
    const curTenant = tenantId;
    const curDate = date;

    setConsumptionLoading(true);
    setConsumptionError(null);

    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });

      let cons: InventoryConsumption | null = null;
      let stockList: InventoryStockItem[] | null = null;
      let stockFetchError: string | null = null;

      if (ctx.capabilities.has("inventory.operate")) {
        const [consRes, stockRes] = await Promise.allSettled([
          InventoryService.getConsumptionByDate(ctx, curDate),
          InventoryService.getInventoryStock(ctx),
        ]);

        if (consRes.status === "fulfilled") {
          cons = consRes.value;
        } else {
          throw consRes.reason;
        }

        if (stockRes.status === "fulfilled") {
          stockList = stockRes.value;
        } else {
          stockFetchError =
            stockRes.reason instanceof Error
              ? stockRes.reason.message
              : "Error al consultar existencias en almacén";
        }
      }

      if (
        tenantGenRef.current !== curGen ||
        activeTenantRef.current !== curTenant ||
        activeDateRef.current !== curDate ||
        consumptionReqRef.current !== reqId
      ) {
        return;
      }

      if (stockList !== null) {
        const map = new Map<string, { stock: number; unit: string }>();
        for (const item of stockList) {
          map.set(item.id, { stock: item.stock, unit: item.unit });
        }
        setStockMap(map);
        setStockError(null);
      } else if (stockFetchError) {
        setStockMap(null);
        setStockError(stockFetchError);
      } else {
        setStockMap(new Map());
        setStockError(null);
      }

      setConsumption(cons);
      setConsumptionError(null);
    } catch (e) {
      if (
        tenantGenRef.current !== curGen ||
        activeTenantRef.current !== curTenant ||
        activeDateRef.current !== curDate ||
        consumptionReqRef.current !== reqId
      ) {
        return;
      }
      setConsumption(null);
      setConsumptionError(e instanceof Error ? e.message : "Error al cargar consumo de inventario");
    } finally {
      if (
        tenantGenRef.current === curGen &&
        activeTenantRef.current === curTenant &&
        activeDateRef.current === curDate &&
        consumptionReqRef.current === reqId
      ) {
        setConsumptionLoading(false);
      }
    }
  }, [user, tenantId, roles, date]);

  const refreshAll = useCallback(async () => {
    await Promise.all([load(), loadConsumption()]);
  }, [load, loadConsumption]);

  useEffect(() => {
    void load();
    void loadConsumption();
  }, [load, loadConsumption]);

  async function handlePlan() {
    if (!user || !tenantId || consumptionActionBusy || !canOperateInventory) return;
    setConsumptionActionBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await InventoryService.planConsumptionFromProduction(ctx, {
        deliveryDate: date,
      });
      toast.success("Plan de consumo generado correctamente (FLOW-04 · T1)");
      await loadConsumption();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al planificar el consumo");
    } finally {
      setConsumptionActionBusy(false);
    }
  }

  async function handleApply() {
    if (!user || !tenantId || !consumption || consumptionActionBusy || !canOperateInventory) return;
    setConsumptionActionBusy(true);
    setConfirmApplyOpen(false);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await InventoryService.applyConsumption(ctx, consumption.id, {
        sessionRecovery: true,
      });
      toast.success("Consumo aplicado en existencias correctamente (FLOW-04 · T2)");
      await loadConsumption();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("insufficient_stock")) {
        toast.error("Stock insuficiente para aplicar el consumo planificado");
      } else {
        toast.error(`Error al aplicar consumo: ${msg}`);
      }
    } finally {
      setConsumptionActionBusy(false);
    }
  }

  async function handleSeal() {
    if (!user || !tenantId || !consumption || consumptionActionBusy || !canOperateInventory) return;
    setConsumptionActionBusy(true);
    setConfirmSealOpen(false);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await InventoryService.sealConsumption(ctx, consumption.id, {
        sessionRecovery: true,
      });
      toast.success("Consumo sellado como definitivo (FLOW-04 · T3)");
      await loadConsumption();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al sellar consumo");
    } finally {
      setConsumptionActionBusy(false);
    }
  }

  async function transition(dish: ProductionDishBlock, to: KitchenBatchStatus) {
    if (!user || !tenantId || isCustomOperationalItem(dish) || !dish.dishId) return;
    setBusyDishId(dish.dishId);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await KitchenExecutionService.transitionBatch(ctx, {
        deliveryDate: date,
        dishId: dish.dishId,
        toStatus: to,
      });
      toast.success(`${dish.dishName} → ${kitchenBatchStatusLabel(to)}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transición rechazada");
    } finally {
      setBusyDishId(null);
    }
  }

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

  const dishes = board?.standardDishes ?? [];
  const customs = board?.customizations ?? [];
  const customsByDish = new Map<string, typeof customs>();
  for (const c of customs) {
    const list = customsByDish.get(operationalItemIdentity(c)) ?? [];
    list.push(c);
    customsByDish.set(operationalItemIdentity(c), list);
  }

  const lines = consumption?.lines ?? [];
  const totalPlannedQty = lines.reduce((acc, l) => acc + (l.qty || 0), 0);

  const linesAnalysis = lines.map((line) => {
    const stockKnown = stockMap !== null;
    const stockItem = stockMap?.get(line.ingredientId);
    if (!stockKnown || !stockItem) {
      return {
        line,
        stockKnown,
        stockItem: null,
        conversion: null,
        isDeficit: false,
        isIncompatible: false,
        availableInLineUnit: null as number | null,
        displayText: !stockKnown ? "Desconocido" : `0 ${line.unit}`,
      };
    }

    const conversion = convertUnits(stockItem.stock, stockItem.unit, line.qty, line.unit);
    if (!conversion.compatible) {
      return {
        line,
        stockKnown: true,
        stockItem,
        conversion,
        isDeficit: false,
        isIncompatible: true,
        availableInLineUnit: null as number | null,
        displayText: `${formatQty(stockItem.stock)} ${stockItem.unit}`,
      };
    }

    const available = conversion.availableInLineUnit;
    const isDeficit = consumption?.status === "planned" && available < line.qty;

    return {
      line,
      stockKnown: true,
      stockItem,
      conversion,
      isDeficit,
      isIncompatible: false,
      availableInLineUnit: available,
      displayText: `${formatQty(available)} ${line.unit}`,
    };
  });

  const insufficientLines = linesAnalysis.filter((item) => item.isDeficit);
  const incompatibleLines = linesAnalysis.filter((item) => item.isIncompatible);
  const hasInsufficientStock = insufficientLines.length > 0;
  const hasIncompatibleUnits = incompatibleLines.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/admin/kitchen">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cocina · Pedidos
            </Link>
          </Button>
          <SectionTitle
            overline="Operaciones"
            title="Ejecución de Cocina"
            subtitle="Estado vivo por lote de plato. Misma fuente que la Hoja de Producción."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/production-sheet" search={{ date }}>
              <FileText className="mr-2 h-4 w-4" />
              Hoja de Producción
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refreshAll()}
            disabled={loading || consumptionLoading}
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", (loading || consumptionLoading) && "animate-spin")}
            />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="exec-date">Fecha</Label>
          <Input
            id="exec-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
        {board ? (
          <p className="pb-2 text-sm text-muted-foreground">
            {board.totals.dishCount} lotes · {board.totals.portionCount} raciones ·{" "}
            {board.totals.customizationCount} personalizados
          </p>
        ) : null}
      </div>

      {/* SECCIÓN FLOW-04 · CONSUMO DE INGREDIENTES */}
      <section
        data-testid="kitchen-consumption-section"
        className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Consumo de Ingredientes (FLOW-04)
              </h2>
              <Badge className={consumptionStatusTone(consumption?.status ?? null)}>
                {consumptionStatusLabel(consumption?.status ?? null)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Planificación (T1), aplicación en almacén (T2) y sellado definitivo (T3) para el día{" "}
              {date}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" data-testid="goto-inventory-button">
              <Link to="/admin/inventory">
                <Boxes className="mr-2 h-4 w-4" />
                Ver en Kárdex
              </Link>
            </Button>
          </div>
        </div>

        {!canOperateInventory ? (
          <div
            data-testid="consumption-rbac-notice"
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground"
          >
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              Modo sólo lectura. Se requiere el permiso{" "}
              <code className="font-mono font-semibold text-foreground">inventory.operate</code>{" "}
              para planificar, aplicar o sellar consumos de ingredientes.
            </span>
          </div>
        ) : null}

        {consumptionLoading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : consumptionError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {consumptionError}
          </div>
        ) : !consumption ? (
          <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              No hay consumo de ingredientes planificado para esta fecha de entrega ({date}).
            </p>
            {canOperateInventory ? (
              <Button
                size="sm"
                data-testid="plan-consumption-button"
                onClick={() => void handlePlan()}
                disabled={consumptionActionBusy}
              >
                {consumptionActionBusy ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Planificar consumo (T1)
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {/* KPI Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Líneas previstas</p>
                <p
                  className="text-lg font-bold tabular-nums text-foreground"
                  data-testid="kpi-lines-count"
                >
                  {lines.length}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Cantidad total</p>
                <p
                  className="text-lg font-bold tabular-nums text-foreground"
                  data-testid="kpi-total-qty"
                >
                  {formatQty(totalPlannedQty)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Estado del flujo</p>
                <p
                  className="text-sm font-semibold capitalize text-foreground"
                  data-testid="kpi-consumption-status"
                >
                  {consumption.status}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Disponibilidad</p>
                {consumption.status === "planned" ? (
                  stockMap === null ? (
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Stock no disponible
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1 text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => void loadConsumption()}
                        disabled={consumptionLoading}
                        title="Reintentar comprobación de existencias"
                      >
                        <RefreshCw
                          className={cn("h-3 w-3", consumptionLoading && "animate-spin")}
                        />
                      </Button>
                    </div>
                  ) : hasIncompatibleUnits ? (
                    <span
                      data-testid="kpi-unverifiable-units"
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> Unidad no verificable
                    </span>
                  ) : hasInsufficientStock ? (
                    <span
                      data-testid="kpi-insufficient-stock"
                      className="text-xs font-semibold text-destructive flex items-center gap-1 mt-1"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> Faltan {insufficientLines.length}{" "}
                      ing.
                    </span>
                  ) : (
                    <span
                      data-testid="kpi-sufficient-stock"
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Stock suficiente
                    </span>
                  )
                ) : (
                  <span className="text-xs font-medium text-muted-foreground mt-1 block">
                    {consumption.status === "applied" ? "Stock descontado" : "Cerrado"}
                  </span>
                )}
              </div>
            </div>

            {/* Warning if stock fetch failed (Fail Closed) */}
            {stockError ? (
              <div
                data-testid="stock-fetch-error-alert"
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    No se pudieron comprobar las existencias en almacén ({stockError}). La
                    validación definitiva se ejecutará en PostgreSQL al intentar aplicar.
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-amber-500/40 hover:bg-amber-500/20"
                  onClick={() => void loadConsumption()}
                  disabled={consumptionLoading}
                >
                  <RefreshCw className={cn("mr-1 h-3 w-3", consumptionLoading && "animate-spin")} />
                  Reintentar existencias
                </Button>
              </div>
            ) : null}

            {/* Warning if incompatible units */}
            {hasIncompatibleUnits ? (
              <div
                data-testid="incompatible-units-alert"
                className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Atención: Se han detectado ingredientes con unidades no convertibles directamente
                  con el almacén (
                  {incompatibleLines
                    .map(
                      (i) =>
                        `${i.line.name}: receta ${i.line.unit} vs almacén ${i.stockItem?.unit}`,
                    )
                    .join(", ")}
                  ). La disponibilidad no es verificable automáticamente antes de aplicar.
                </span>
              </div>
            ) : null}

            {/* Warning if insufficient stock */}
            {hasInsufficientStock ? (
              <div
                data-testid="insufficient-stock-alert"
                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                <span>
                  Atención: Se han detectado ingredientes con existencias inferiores a la cantidad
                  necesaria. La base de datos rechazará la aplicación de consumo si el stock fuese a
                  quedar en negativo.
                </span>
              </div>
            ) : null}

            {/* Ingredients table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table data-testid="consumption-lines-table">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Ingrediente</TableHead>
                    <TableHead className="text-right">Cantidad Planificada</TableHead>
                    <TableHead className="text-right">Stock en Almacén</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linesAnalysis.map((item) => {
                    const {
                      line,
                      stockKnown,
                      isDeficit,
                      isIncompatible,
                      displayText,
                      availableInLineUnit,
                    } = item;

                    return (
                      <TableRow
                        key={line.ingredientId}
                        data-testid={`consumption-line-${line.ingredientId}`}
                      >
                        <TableCell className="font-medium text-foreground">{line.name}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-foreground">
                          {formatQty(line.qty)} {line.unit}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono tabular-nums",
                            !stockKnown
                              ? "text-amber-600 dark:text-amber-400 italic text-xs"
                              : isIncompatible
                                ? "text-amber-700 dark:text-amber-300 font-medium"
                                : isDeficit
                                  ? "text-destructive font-semibold"
                                  : "text-muted-foreground",
                          )}
                        >
                          {displayText}
                        </TableCell>
                        <TableCell className="text-right">
                          {consumption.status === "planned" ? (
                            !stockKnown ? (
                              <Badge
                                variant="outline"
                                className="border-amber-500/40 text-amber-700 bg-amber-500/10 text-xs"
                              >
                                Sin verificar
                              </Badge>
                            ) : isIncompatible ? (
                              <Badge
                                variant="outline"
                                data-testid="badge-unit-incompatible"
                                className="border-amber-500/40 text-amber-700 bg-amber-500/10 text-xs"
                              >
                                Unidad no convertible
                              </Badge>
                            ) : isDeficit ? (
                              <Badge variant="destructive" className="text-xs">
                                Faltan{" "}
                                {availableInLineUnit !== null
                                  ? formatQty(line.qty - availableInLineUnit)
                                  : ""}{" "}
                                {line.unit}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/40 text-emerald-700 bg-emerald-500/10 text-xs"
                              >
                                En almacén
                              </Badge>
                            )
                          ) : consumption.status === "applied" ? (
                            <Badge
                              variant="outline"
                              className="border-sky-500/40 text-sky-700 bg-sky-500/10 text-xs"
                            >
                              Descontado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/40 text-emerald-700 bg-emerald-500/10 text-xs"
                            >
                              Sellado
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {consumption.status === "planned"
                  ? "Consumo planificado. Al aplicar (T2), se registrarán salidas en kárdex descontando existencias."
                  : consumption.status === "applied"
                    ? "Consumo aplicado. Al sellar (T3), el lote quedará cerrado de forma definitiva."
                    : "Consumo sellado de forma definitiva."}
              </p>

              <div className="flex items-center gap-2">
                {canOperateInventory && consumption.status === "planned" ? (
                  <Button
                    size="sm"
                    data-testid="apply-consumption-button"
                    onClick={() => setConfirmApplyOpen(true)}
                    disabled={consumptionActionBusy}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {consumptionActionBusy ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Aplicar consumo (T2)
                  </Button>
                ) : null}

                {canOperateInventory && consumption.status === "applied" ? (
                  <Button
                    size="sm"
                    data-testid="seal-consumption-button"
                    onClick={() => setConfirmSealOpen(true)}
                    disabled={consumptionActionBusy}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {consumptionActionBusy ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    Sellar consumo (T3)
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* MODALES DE CONFIRMACIÓN */}
      <AlertDialog open={confirmApplyOpen} onOpenChange={setConfirmApplyOpen}>
        <AlertDialogContent data-testid="confirm-apply-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" />
              ¿Confirmar aplicación de consumo de ingredientes?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <span>
                Esta acción (T2) descontará formalmente las cantidades planificadas del stock del
                almacén registrando movimientos de salida de inventario para la fecha{" "}
                <strong className="text-foreground">{date}</strong>.
              </span>
              {hasInsufficientStock && (
                <span className="block flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Aviso: Se ha detectado stock insuficiente para algunos ingredientes. La base de
                    datos rechazará la operación si algún stock resultante fuese negativo.
                  </span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={consumptionActionBusy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-apply-dialog-action"
              disabled={consumptionActionBusy}
              onClick={(e) => {
                e.preventDefault();
                void handleApply();
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {consumptionActionBusy ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirmar y Aplicar en Almacén
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmSealOpen} onOpenChange={setConfirmSealOpen}>
        <AlertDialogContent data-testid="confirm-seal-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-600" />
              ¿Confirmar sellado definitivo del consumo?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              Esta acción (T3) marca el consumo de la fecha{" "}
              <strong className="text-foreground">{date}</strong> como sellado y definitivo (estado
              terminal). No alterará el stock del almacén ni se podrán realizar más cambios sobre
              este plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={consumptionActionBusy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-seal-dialog-action"
              disabled={consumptionActionBusy}
              onClick={(e) => {
                e.preventDefault();
                void handleSeal();
              }}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {consumptionActionBusy ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Confirmar y Sellar (Terminal)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between pt-2">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          Lotes de Producción
        </h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : dishes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No hay producción en cola para esta fecha.
        </div>
      ) : (
        <div className="space-y-3">
          {dishes.map((dish) => {
            const primary = primaryKitchenBatchAction(dish.batchStatus);
            const next = nextKitchenBatchStatuses(dish.batchStatus);
            const relatedCustoms = customsByDish.get(operationalItemIdentity(dish)) ?? [];
            const busy = dish.dishId !== null && busyDishId === dish.dishId;

            return (
              <article
                key={operationalItemIdentity(dish)}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-tight">
                        {dish.dishName}
                        <CustomOperationalContext item={dish} />
                      </h2>
                      <Badge className={batchTone(dish.batchStatus)}>
                        {kitchenBatchStatusLabel(dish.batchStatus)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground tabular-nums">
                        {dish.totalQty}
                      </span>{" "}
                      raciones
                      {!isCustomOperationalItem(dish) && dish.prepMinutes != null ? (
                        <>
                          {" · "}
                          <Clock className="inline h-3.5 w-3.5" /> {dish.prepMinutes} min
                        </>
                      ) : null}
                    </p>
                    <OperationalAllergenDeclaration item={dish} />
                    {!isCustomOperationalItem(dish) &&
                    dish.allergenState !== "UNKNOWN" &&
                    dish.allergenState !== "HISTORICAL_UNAVAILABLE" &&
                    dish.allergens.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {dish.allergens.map((a) => (
                          <Badge key={a} variant="outline" className="gap-1 text-xs">
                            <Wheat className="h-3 w-3" />
                            {a}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {primary ? (
                      <Button
                        size="sm"
                        disabled={isCustomOperationalItem(dish) || busy}
                        onClick={() => void transition(dish, primary.to)}
                      >
                        {dish.batchStatus === "pending" ? (
                          <Play className="mr-2 h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        {primary.label}
                      </Button>
                    ) : (
                      <Badge className={batchTone("finished")}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Finalizado
                      </Badge>
                    )}
                    {next
                      .filter((s) => s !== primary?.to)
                      .map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant="outline"
                          disabled={isCustomOperationalItem(dish) || busy}
                          onClick={() => void transition(dish, s)}
                        >
                          {kitchenBatchStatusLabel(s)}
                        </Button>
                      ))}
                  </div>
                </div>

                <Accordion type="single" collapsible className="mt-3">
                  <AccordionItem value="clients" className="border-0">
                    <AccordionTrigger className="py-2 text-sm">
                      Clientes ({dish.customers.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="divide-y divide-border text-sm">
                        {dish.customers.map((c) => (
                          <li
                            key={`${c.orderId}-${c.orderItemId ?? c.customerId}`}
                            className="flex justify-between py-2"
                          >
                            <span>{c.customerName}</span>
                            <span className="font-mono tabular-nums">×{c.qty}</span>
                          </li>
                        ))}
                      </ul>
                      {relatedCustoms.length > 0 ? (
                        <div className="mt-3 rounded-lg border border-dashed p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Personalizados relacionados
                          </p>
                          <ul className="mt-2 space-y-2 text-sm">
                            {relatedCustoms.map((c) => (
                              <li key={`${c.orderId}-${c.observation}`}>
                                <span className="font-semibold">{c.customerName}</span>
                                {" · "}
                                {c.observation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </article>
            );
          })}

          {customs.length > 0 ? (
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold">Personalizados del día</h3>
              <ul className="mt-3 divide-y divide-border text-sm">
                {customs.map((c) => (
                  <li key={`${c.orderId}-${operationalItemIdentity(c)}`} className="py-3">
                    <p className="font-semibold">{c.customerName}</p>
                    <p>
                      {c.dishName} ×{c.qty}
                    </p>
                    <p className="text-muted-foreground">{c.observation}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
