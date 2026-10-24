import { rollbackOrderStatusCommand } from "@/order/OrderCommands";
import type { OrderCommandResult } from "@/order/OrderContext";
import type { OperationalRollbackScope } from "@/modules/operations/domain/operational-status";
import React, { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ShieldAlert,
} from "lucide-react";
import type { OperationalOrderListItem } from "@/modules/operations";
import {
  type OperationalOrderStatus,
  operationalStatusLabel,
  ROLLBACK_TRANSITIONS,
  isOperationalRollbackEnabled,
} from "@/modules/operations/domain/operational-status";

export function calculateOrderPortions(order: OperationalOrderListItem): number {
  if (!order.items || !Array.isArray(order.items)) return 0;
  return order.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
}

/**
 * Determina si un pedido es multijornada o incluye fechas distintas a la jornada de operación actual.
 */
export function isOrderMultiDay(
  order: OperationalOrderListItem,
  currentOperatingDate?: string | null,
): boolean {
  if (order.temporalScopeKnown === false) {
    return true; // Excluir por seguridad si el alcance temporal no se pudo verificar fehacientemente
  }
  if (order.isMultiDay) return true;
  const dates =
    order.allDeliveryDates && order.allDeliveryDates.length > 0
      ? order.allDeliveryDates
      : order.deliveryDates ?? [];
  if (dates.length > 1) return true;
  if (currentOperatingDate && dates.some((d) => d !== currentOperatingDate)) {
    return true;
  }
  return false;
}

/** Unknown scope cannot be overridden by consent to known multi-day changes. */
export function getTemporalScopeOmissionReason(
  order: OperationalOrderListItem,
  currentOperatingDate: string | null | undefined,
  includeMultiDay: boolean,
): string | null {
  if (order.temporalScopeKnown === false) {
    return "Omitido por seguridad (alcance temporal no determinable)";
  }
  if (isOrderMultiDay(order, currentOperatingDate) && !includeMultiDay) {
    return "Omitido por seguridad (multijornada: contiene raciones en otras fechas)";
  }
  return null;
}

export async function executeRollbackOrders(
  orders: OperationalOrderListItem[],
  reason: string,
  scope: Pick<OperationalRollbackScope, "allowMultiDay" | "operatingDate">,
  api: { rollbackOrderStatus: (command: ReturnType<typeof rollbackOrderStatusCommand>) => Promise<OrderCommandResult> },
): Promise<BulkExecutionResult> {
  const result: BulkExecutionResult = { succeeded: [], omitted: [], failed: [] };
  for (const order of orders) {
    const target = ROLLBACK_TRANSITIONS[order.status];
    const omitted = getTemporalScopeOmissionReason(order, scope.operatingDate, scope.allowMultiDay ?? false);
    if (order.writeContractVersion === 2 || !target || omitted) {
      result.omitted.push({ orderId: order.id, reason: omitted ?? "Contrato v2 o estado no reversible" });
      continue;
    }
    try {
      if (!isOperationalRollbackEnabled() || !reason.trim()) throw new Error("Retroceso desactivado o motivo vacío");
      const response = await api.rollbackOrderStatus(rollbackOrderStatusCommand({
        orderId: order.id, reason: reason.trim(), expectedStatus: order.status,
        expectedRevision: order.revision,
        expectedDeliveryDates: order.allDeliveryDates ?? order.deliveryDates,
        ...scope,
      }));
      if (!response.ok || response.status !== target) {
        throw new Error(response.errors[0]?.message ?? "No se confirmó el estado esperado tras el retroceso");
      }
      result.succeeded.push({ orderId: order.id, from: order.status, to: target });
    } catch (error) {
      result.failed.push({ orderId: order.id, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return result;
}

export function toggleOrderIdInSet(prev: Set<string>, orderId: string): Set<string> {
  const next = new Set(prev);
  if (next.has(orderId)) {
    next.delete(orderId);
  } else {
    next.add(orderId);
  }
  return next;
}

export function toggleAllOrdersInSet(
  prev: Set<string>,
  orders: OperationalOrderListItem[],
): Set<string> {
  if (orders.length === 0) return new Set();
  if (prev.size === orders.length) return new Set();
  return new Set(orders.map((o) => o.id));
}

export function filterVisibleOrderIds(
  prev: Set<string>,
  orders: OperationalOrderListItem[],
): Set<string> {
  if (prev.size === 0) return prev;
  const visibleIds = new Set(orders.map((o) => o.id));
  const next = new Set<string>();
  for (const id of prev) {
    if (visibleIds.has(id)) next.add(id);
  }
  return next.size === prev.size ? prev : next;
}

/**
 * Hook para gestionar la selección múltiple de pedidos en Cocina y Pedidos.
 * Reseta la selección automáticamente ante cambios de filtros o fecha.
 */
export function useBulkOrderSelection(
  orders: OperationalOrderListItem[],
  dependencies: unknown[] = [],
) {
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Limpiar selección cuando cambian los filtros o la lista de dependencias
  useEffect(() => {
    setSelectedOrderIds(new Set());
  }, dependencies);

  // Mantener solo IDs de pedidos que sigan visibles tras actualización
  useEffect(() => {
    setSelectedOrderIds((prev) => filterVisibleOrderIds(prev, orders));
  }, [orders]);

  const selectedOrders = useMemo(
    () => orders.filter((o) => selectedOrderIds.has(o.id)),
    [orders, selectedOrderIds],
  );

  const selectedPortions = useMemo(
    () => selectedOrders.reduce((sum, o) => sum + calculateOrderPortions(o), 0),
    [selectedOrders],
  );

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) => toggleOrderIdInSet(prev, orderId));
  };

  const toggleSelectAll = () => {
    setSelectedOrderIds((prev) => toggleAllOrdersInSet(prev, orders));
  };

  const clearSelection = () => {
    setSelectedOrderIds(new Set());
  };

  const isAllSelected = orders.length > 0 && selectedOrderIds.size === orders.length;
  const isPartiallySelected =
    selectedOrderIds.size > 0 && selectedOrderIds.size < orders.length;

  return {
    selectedOrderIds,
    setSelectedOrderIds,
    selectedOrders,
    selectedPortions,
    toggleSelectOrder,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
    isPartiallySelected,
  };
}

/**
 * Barra contextual flotante de acciones masivas.
 */
export function BulkActionBar({
  selectedCount,
  selectedPortions,
  onAdvance,
  onRollback,
  onClear,
  onCancelSelection,
  rollbackEnabled = isOperationalRollbackEnabled(),
  busy = false,
}: {
  selectedCount: number;
  selectedPortions: number;
  onAdvance: () => void;
  onRollback: () => void;
  onClear: () => void;
  onCancelSelection?: () => void;
  rollbackEnabled?: boolean;
  busy?: boolean;
}) {
  if (selectedCount === 0) return null;

  return (
    <div
      data-testid="bulk-action-bar"
      className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-card/95 p-3.5 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center gap-3">
        <Badge variant="default" className="text-xs font-semibold px-2.5 py-1">
          {selectedCount} {selectedCount === 1 ? "pedido seleccionado" : "pedidos seleccionados"}
        </Badge>
        <span className="text-sm font-medium text-foreground">
          · {selectedPortions} {selectedPortions === 1 ? "ración" : "raciones"}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="default"
          onClick={onAdvance}
          disabled={busy}
          className="gap-1.5 font-medium shadow-xs"
        >
          <ArrowRight className="h-4 w-4" />
          Avanzar estado
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onRollback}
          disabled={busy}
          title={
            !rollbackEnabled
              ? "Retroceso en base de datos pendiente de aplicar la migración transaccional"
              : undefined
          }
          className="gap-1.5 font-medium border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/10"
        >
          <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          Retroceder estado
          {!rollbackEnabled && (
            <span className="text-[10px] bg-amber-500/20 px-1 py-0.2 rounded text-amber-800 dark:text-amber-300 ml-1">
              Pend. migración
            </span>
          )}
        </Button>

        {onCancelSelection && (
          <Button
            size="sm"
            variant="outline"
            onClick={onCancelSelection}
            disabled={busy}
            className="text-destructive hover:bg-destructive/10"
          >
            Cancelar pedidos
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          disabled={busy}
          className="text-xs text-muted-foreground"
        >
          Deseleccionar
        </Button>
      </div>
    </div>
  );
}

export type BulkExecutionResult = {
  succeeded: Array<{ orderId: string; from: OperationalOrderStatus; to: OperationalOrderStatus }>;
  omitted: Array<{ orderId: string; reason: string }>;
  failed: Array<{ orderId: string; error: string }>;
};

/**
 * Modal de confirmación para Avance Masivo de estados.
 */
export function BulkAdvanceModal({
  open,
  onOpenChange,
  selectedOrders,
  onExecute,
  busy,
  currentOperatingDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: OperationalOrderListItem[];
  onExecute: (eligibleOrders: OperationalOrderListItem[]) => Promise<BulkExecutionResult | void>;
  busy: boolean;
  currentOperatingDate?: string | null;
}) {
  const [result, setResult] = useState<BulkExecutionResult | null>(null);
  const [includeMultiDay, setIncludeMultiDay] = useState(false);

  useEffect(() => {
    if (open) {
      setResult(null);
      setIncludeMultiDay(false);
    }
  }, [open]);

  const totalPortions = useMemo(
    () => selectedOrders.reduce((sum, o) => sum + calculateOrderPortions(o), 0),
    [selectedOrders],
  );

  const multiDayOrders = useMemo(
    () => selectedOrders.filter((o) => isOrderMultiDay(o, currentOperatingDate)),
    [selectedOrders, currentOperatingDate],
  );

  const multiDayOtherDates = useMemo(() => {
    const dates = new Set<string>();
    for (const o of multiDayOrders) {
      const list =
        o.allDeliveryDates && o.allDeliveryDates.length > 0
          ? o.allDeliveryDates
          : o.deliveryDates ?? [];
      for (const d of list) {
        if (!currentOperatingDate || d !== currentOperatingDate) {
          dates.add(d);
        }
      }
    }
    return Array.from(dates).sort();
  }, [multiDayOrders, currentOperatingDate]);

  const breakdown = useMemo(() => {
    const draft: OperationalOrderListItem[] = [];
    const confirmed: OperationalOrderListItem[] = [];
    const inProduction: OperationalOrderListItem[] = [];
    const prepared: OperationalOrderListItem[] = [];
    const omitted: Array<{ order: OperationalOrderListItem; reason: string }> = [];

    for (const o of selectedOrders) {
      const scopeOmission = getTemporalScopeOmissionReason(o, currentOperatingDate, includeMultiDay);
      if (scopeOmission) {
        omitted.push({ order: o, reason: scopeOmission });
        continue;
      }

      if (o.status === "draft") {
        draft.push(o);
      } else if (o.status === "confirmed") {
        confirmed.push(o);
      } else if (o.status === "in_production") {
        inProduction.push(o);
      } else if (o.status === "prepared") {
        prepared.push(o);
      } else {
        omitted.push({
          order: o,
          reason:
            o.status === "ready_for_delivery" || o.status === "out_for_delivery"
              ? "En fase de entrega (no se marca como entregado en masa)"
              : o.status === "delivered"
                ? "Ya entregado"
                : o.status === "cancelled"
                  ? "Cancelado"
                  : `Estado ${o.status} no admite avance operativo`,
        });
      }
    }

    const eligible = [...draft, ...confirmed, ...inProduction, ...prepared];
    const eligiblePortions = eligible.reduce((s, o) => s + calculateOrderPortions(o), 0);
    const omittedPortions = omitted.reduce((s, item) => s + calculateOrderPortions(item.order), 0);

    return {
      draft,
      confirmed,
      inProduction,
      prepared,
      omitted,
      eligible,
      eligiblePortions,
      omittedPortions,
    };
  }, [selectedOrders, includeMultiDay, currentOperatingDate]);

  const handleConfirm = async () => {
    if (breakdown.eligible.length === 0 || busy) return;
    const res = await onExecute(breakdown.eligible);
    if (res) {
      setResult(res);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Avanzar estado ({selectedOrders.length} {selectedOrders.length === 1 ? "pedido" : "pedidos"})
          </DialogTitle>
          <DialogDescription>
            Cada pedido avanzará exactamente <strong>un estado autorizado</strong> según su flujo
            operacional. Los pedidos no elegibles serán omitidos sin sufrir modificaciones.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
              <div className="font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Resultado de la ejecución
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {result.succeeded.length}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">Actualizados</div>
                </div>
                <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                    {result.omitted.length}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">Omitidos</div>
                </div>
                <div className="p-2 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                  <div className="text-lg font-bold text-red-700 dark:text-red-300">
                    {result.failed.length}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400">Fallidos</div>
                </div>
              </div>
            </div>

            {result.failed.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50/50 dark:bg-red-950/20 p-3 text-xs space-y-1.5">
                <div className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" />
                  Pedidos con error:
                </div>
                <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-400">
                  {result.failed.map((f) => (
                    <li key={f.orderId}>
                      <span className="font-mono font-medium">#{f.orderId.slice(0, 8)}</span>: {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {multiDayOrders.length > 0 ? (
              <div
                data-testid="multiday-safety-warning"
                className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-2"
              >
                <div className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  {`Atención: ${multiDayOrders.length} ${
                    multiDayOrders.length === 1
                      ? "pedido seleccionado es multijornada"
                      : "pedidos seleccionados son multijornada"
                  }`}
                </div>
                <p className="text-[11px] leading-relaxed">
                  Contiene entregas en varias fechas
                  {multiDayOtherDates.length > 0 ? ` (${multiDayOtherDates.join(", ")})` : ""}.
                  Avanzar su estado cambiará el pedido completo en todas sus fechas.
                  {!includeMultiDay ? " Por seguridad se ha omitido de este lote." : ""}
                </p>
                <label className="flex items-center gap-2 pt-1 cursor-pointer font-medium text-foreground select-none">
                  <Checkbox
                    checked={includeMultiDay}
                    onCheckedChange={(checked) => setIncludeMultiDay(Boolean(checked))}
                    id="bulk-advance-include-multiday"
                  />
                  <span className="text-xs">
                    Incluir pedidos multijornada (asumo la actualización de todas sus fechas asociadas)
                  </span>
                </label>
                <p>Los pedidos de alcance no confirmado permanecen excluidos aunque se marque esta casilla.</p>
              </div>
            ) : currentOperatingDate ? (
              <div
                data-testid="multiday-scope-validated"
                className="rounded-md border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Alcance validado: Todos los pedidos pertenecen exclusivamente a la jornada ({currentOperatingDate}).
                </span>
              </div>
            ) : null}

            <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
              <div className="flex justify-between items-center font-semibold text-foreground border-b pb-1.5">
                <span>Total seleccionado</span>
                <span>
                  {selectedOrders.length} pedidos ({totalPortions} raciones)
                </span>
              </div>

              <div className="space-y-2 text-xs pt-1">
                {breakdown.draft.length > 0 && (
                  <div className="flex justify-between items-center text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">Borrador</Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="secondary" className="text-[10px]">Confirmado</Badge>
                    </span>
                    <span className="font-medium">
                      {breakdown.draft.length} pedidos (
                      {breakdown.draft.reduce((s, o) => s + calculateOrderPortions(o), 0)} raciones)
                    </span>
                  </div>
                )}

                {breakdown.confirmed.length > 0 && (
                  <div className="flex justify-between items-center text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px]">Confirmado</Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="default" className="text-[10px]">En preparación</Badge>
                    </span>
                    <span className="font-medium">
                      {breakdown.confirmed.length} pedidos (
                      {breakdown.confirmed.reduce((s, o) => s + calculateOrderPortions(o), 0)} raciones)
                    </span>
                  </div>
                )}

                {breakdown.inProduction.length > 0 && (
                  <div className="flex justify-between items-center text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Badge variant="default" className="text-[10px]">En preparación</Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="default" className="text-[10px]">Preparado</Badge>
                    </span>
                    <span className="font-medium">
                      {breakdown.inProduction.length} pedidos (
                      {breakdown.inProduction.reduce((s, o) => s + calculateOrderPortions(o), 0)} raciones)
                    </span>
                  </div>
                )}

                {breakdown.prepared.length > 0 && (
                  <div className="flex justify-between items-center text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Badge variant="default" className="text-[10px]">Preparado</Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="secondary" className="text-[10px]">Listo para reparto</Badge>
                    </span>
                    <span className="font-medium">
                      {breakdown.prepared.length} pedidos (
                      {breakdown.prepared.reduce((s, o) => s + calculateOrderPortions(o), 0)} raciones)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {breakdown.omitted.length > 0 && (
              <div className="rounded-md border border-amber-200/80 bg-amber-50/60 dark:bg-amber-950/20 p-2.5 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {`${breakdown.omitted.length} ${
                    breakdown.omitted.length === 1 ? "pedido omitido" : "pedidos omitidos"
                  }:`}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  No pueden avanzar más o ya están en fase de entrega. No se marcarán pedidos como
                  entregados en operaciones masivas.
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {breakdown.omitted.slice(0, 3).map((item) => (
                    <li key={item.order.id}>
                      <span className="font-mono">#{item.order.id.slice(0, 8)}</span> ({item.reason})
                    </li>
                  ))}
                  {breakdown.omitted.length > 3 && (
                    <li className="list-none text-[10px] text-muted-foreground italic pl-3">
                      ... y {breakdown.omitted.length - 3} pedidos más.
                    </li>
                  )}
                </ul>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={handleConfirm}
                disabled={busy || breakdown.eligible.length === 0}
                className="gap-2 font-semibold"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {`Avanzar ${breakdown.eligible.length} ${breakdown.eligible.length === 1 ? "pedido elegible" : "pedidos elegibles"}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Modal de confirmación para Retroceso Masivo Seguro (Marcha atrás).
 */
export function BulkRollbackModal({
  open,
  onOpenChange,
  selectedOrders,
  onExecute,
  busy,
  rollbackEnabled = isOperationalRollbackEnabled(),
  currentOperatingDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: OperationalOrderListItem[];
  onExecute: (
    eligibleOrders: OperationalOrderListItem[],
    reason: string,
    scope: Pick<OperationalRollbackScope, "allowMultiDay" | "operatingDate">,
  ) => Promise<BulkExecutionResult | void>;
  busy: boolean;
  rollbackEnabled?: boolean;
  currentOperatingDate?: string | null;
}) {
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<BulkExecutionResult | null>(null);
  const [includeMultiDay, setIncludeMultiDay] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setResult(null);
      setIncludeMultiDay(false);
    }
  }, [open]);

  const multiDayOrders = useMemo(
    () => selectedOrders.filter((o) => isOrderMultiDay(o, currentOperatingDate)),
    [selectedOrders, currentOperatingDate],
  );

  const multiDayOtherDates = useMemo(() => {
    const dates = new Set<string>();
    for (const o of multiDayOrders) {
      const list =
        o.allDeliveryDates && o.allDeliveryDates.length > 0
          ? o.allDeliveryDates
          : o.deliveryDates ?? [];
      for (const d of list) {
        if (!currentOperatingDate || d !== currentOperatingDate) {
          dates.add(d);
        }
      }
    }
    return Array.from(dates).sort();
  }, [multiDayOrders, currentOperatingDate]);

  const breakdown = useMemo(() => {
    const readyToPrepared: OperationalOrderListItem[] = [];
    const preparedToProduction: OperationalOrderListItem[] = [];
    const productionToConfirmed: OperationalOrderListItem[] = [];
    const omitted: Array<{ order: OperationalOrderListItem; reason: string }> = [];

    for (const o of selectedOrders) {
      // Pedidos canónicos v2 no admiten retroceso de estado operacional directo
      if (o.writeContractVersion === 2) {
        omitted.push({
          order: o,
          reason: "Pedido canónico v2 (no admite retroceso de estado)",
        });
        continue;
      }

      const scopeOmission = getTemporalScopeOmissionReason(o, currentOperatingDate, includeMultiDay);
      if (scopeOmission) {
        omitted.push({ order: o, reason: scopeOmission });
        continue;
      }

      if (o.status === "ready_for_delivery") {
        readyToPrepared.push(o);
      } else if (o.status === "prepared") {
        preparedToProduction.push(o);
      } else if (o.status === "in_production") {
        productionToConfirmed.push(o);
      } else {
        omitted.push({
          order: o,
          reason:
            o.status === "confirmed" || o.status === "draft"
              ? "En estado inicial (no admite retroceso operacional)"
              : o.status === "out_for_delivery" || o.status === "delivered"
                ? "En reparto o entregado (no reversible)"
                : o.status === "cancelled"
                  ? "Cancelado"
                  : `Estado ${o.status} no admite retroceso`,
        });
      }
    }

    const eligible = [...readyToPrepared, ...preparedToProduction, ...productionToConfirmed];
    const eligiblePortions = eligible.reduce((s, o) => s + calculateOrderPortions(o), 0);

    return {
      readyToPrepared,
      preparedToProduction,
      productionToConfirmed,
      omitted,
      eligible,
      eligiblePortions,
    };
  }, [selectedOrders, includeMultiDay, currentOperatingDate]);

  const handleConfirm = async () => {
    if (!reason.trim() || breakdown.eligible.length === 0 || busy || !rollbackEnabled) return;
    const res = await onExecute(breakdown.eligible, reason.trim(), { allowMultiDay: includeMultiDay, operatingDate: currentOperatingDate ?? undefined });
    if (res) {
      setResult({ ...res, omitted: [
        ...breakdown.omitted.map(({ order, reason }) => ({ orderId: order.id, reason })), ...res.omitted,
      ] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <RotateCcw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Retroceder estado operacional ({selectedOrders.length} {selectedOrders.length === 1 ? "pedido" : "pedidos"})
          </DialogTitle>
          <DialogDescription>
            Devuelve pedidos de Cocina o Packing al estado inmediatamente anterior para subsanar
            incidencias operativas. Cada retroceso queda registrado de forma inmutable en la auditoría
            de PostgreSQL.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
              <div className="font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Resultado del retroceso
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {result.succeeded.length}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">Retrocedidos</div>
                </div>
                <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                    {result.omitted.length}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">Omitidos</div>
                </div>
                <div className="p-2 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                  <div className="text-lg font-bold text-red-700 dark:text-red-300">
                    {result.failed.length}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400">Fallidos</div>
                </div>
              </div>
            </div>

            {result.succeeded.length > 0 && (
              <ul className="text-xs space-y-1">
                {result.succeeded.map((item) => <li key={item.orderId}>
                  #{item.orderId.slice(0, 8)}: {operationalStatusLabel(item.from)} → {operationalStatusLabel(item.to)}
                </li>)}
              </ul>
            )}
            {result.omitted.length > 0 && (
              <ul className="text-xs space-y-1" aria-label="Pedidos omitidos">
                {result.omitted.map((item) => <li key={item.orderId}>
                  #{item.orderId.slice(0, 8)}: {item.reason}
                </li>)}
              </ul>
            )}
            {result.failed.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50/50 dark:bg-red-950/20 p-3 text-xs space-y-1.5">
                <div className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" />
                  Pedidos con error:
                </div>
                <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-400">
                  {result.failed.map((f) => (
                    <li key={f.orderId}>
                      <span className="font-mono font-medium">#{f.orderId.slice(0, 8)}</span>: {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {!rollbackEnabled && (
              <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Migración PostgreSQL pendiente de aplicar
                </div>
                <p className="text-[11px] leading-relaxed">
                  El procedimiento almacenado atómico <code>rollback_order_status_v1</code> ha sido
                  preparado en código. En producción, la ejecución de marcha atrás está protegida hasta
                  que se aplique la migración a Supabase.
                </p>
              </div>
            )}

            {multiDayOrders.length > 0 ? (
              <div
                data-testid="multiday-rollback-warning"
                className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-2"
              >
                <div className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  {`Atención: ${multiDayOrders.length} ${
                    multiDayOrders.length === 1
                      ? "pedido seleccionado es multijornada"
                      : "pedidos seleccionados son multijornada"
                  }`}
                </div>
                <p className="text-[11px] leading-relaxed">
                  Contiene entregas en varias fechas
                  {multiDayOtherDates.length > 0 ? ` (${multiDayOtherDates.join(", ")})` : ""}.
                  Retroceder su estado afectará al pedido completo en todas sus fechas.
                  {!includeMultiDay ? " Por seguridad se ha omitido de este lote." : ""}
                </p>
                <label className="flex items-center gap-2 pt-1 cursor-pointer font-medium text-foreground select-none">
                  <Checkbox
                    checked={includeMultiDay}
                    onCheckedChange={(checked) => setIncludeMultiDay(Boolean(checked))}
                    id="bulk-rollback-include-multiday"
                  />
                  <span className="text-xs">
                    Incluir pedidos multijornada (asumo la actualización de todas sus fechas asociadas)
                  </span>
                </label>
                <p>Los pedidos de alcance no confirmado permanecen excluidos aunque se marque esta casilla.</p>
              </div>
            ) : currentOperatingDate ? (
              <div
                data-testid="multiday-rollback-validated"
                className="rounded-md border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Alcance validado: Todos los pedidos pertenecen exclusivamente a la jornada ({currentOperatingDate}).
                </span>
              </div>
            ) : null}

            <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
              <div className="flex justify-between items-center font-semibold text-foreground border-b pb-1.5">
                <span>Resumen de retroceso</span>
                <span>
                  {breakdown.eligible.length} de {selectedOrders.length} pedidos elegibles (
                  {breakdown.eligiblePortions} raciones)
                </span>
              </div>

              <div className="space-y-2 text-xs pt-1">
                {breakdown.readyToPrepared.length > 0 && (
                  <div className="flex justify-between items-center text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px]">Listo para reparto</Badge>
                      <RotateCcw className="h-3 w-3 text-amber-600" />
                      <Badge variant="default" className="text-[10px]">Preparado</Badge>
                    </span>
                    <span className="font-medium">
                      {breakdown.readyToPrepared.length} pedidos (
                      {breakdown.readyToPrepared.reduce((s, o) => s + calculateOrderPortions(o), 0)} raciones)
                    </span>
                  </div>
                )}

                {breakdown.preparedToProduction.length > 0 && (
                  <div className="flex justify-between items-center text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Badge variant="default" className="text-[10px]">Preparado</Badge>
                      <RotateCcw className="h-3 w-3 text-amber-600" />
                      <Badge variant="default" className="text-[10px]">En preparación</Badge>
                    </span>
                    <span className="font-medium">
                      {breakdown.preparedToProduction.length} pedidos (
                      {breakdown.preparedToProduction.reduce((s, o) => s + calculateOrderPortions(o), 0)} raciones)
                    </span>
                  </div>
                )}

                {breakdown.productionToConfirmed.length > 0 && (
                  <div className="flex justify-between items-center text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Badge variant="default" className="text-[10px]">En preparación</Badge>
                      <RotateCcw className="h-3 w-3 text-amber-600" />
                      <Badge variant="secondary" className="text-[10px]">Confirmado</Badge>
                    </span>
                    <span className="font-medium">
                      {breakdown.productionToConfirmed.length} pedidos (
                      {breakdown.productionToConfirmed.reduce((s, o) => s + calculateOrderPortions(o), 0)} raciones)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {breakdown.omitted.length > 0 && (
              <div className="rounded-md border border-muted bg-muted/20 p-2.5 text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  {breakdown.omitted.length} pedidos omitidos (no reversibles):
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {breakdown.omitted.slice(0, 3).map((item) => (
                    <li key={item.order.id}>
                      <span className="font-mono">#{item.order.id.slice(0, 8)}</span> ({item.reason})
                    </li>
                  ))}
                  {breakdown.omitted.length > 3 && (
                    <li className="list-none text-[10px] text-muted-foreground italic pl-3">
                      ... y {breakdown.omitted.length - 3} pedidos más.
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Motivo del retroceso <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Indique la justificación operativa del retroceso (ej. corrección de conteo, reapertura de lote)..."
                className="text-xs min-h-[75px]"
                disabled={busy || !rollbackEnabled}
              />
              <p className="text-[10px] text-muted-foreground">
                Obligatorio. Quedará registrado de forma atómica en la tabla <code>audit_log</code>.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={handleConfirm}
                disabled={
                  busy ||
                  !rollbackEnabled ||
                  !reason.trim() ||
                  breakdown.eligible.length === 0
                }
                className="gap-2 font-semibold bg-amber-600 hover:bg-amber-700 text-white"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {`Confirmar Retroceso (${breakdown.eligible.length})`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
