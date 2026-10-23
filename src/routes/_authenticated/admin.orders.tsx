import type { OperationalRollbackScope } from "@/modules/operations/domain/operational-status";
import { CanonicalOrderEditPanel } from "@/components/orders/canonical-order-edit-panel";
/**
 * Pedidos — Centro de Control Operacional y Temporal (CR-OPS-09A / Fase 1 CR-OPS-UX).
 * PR-034 / CR-OPS-09A / CR-OPS-UX Fase 1 (Quick Actions & 5-Tier Drawer).
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { SectionTitle } from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { OperationalTimeline } from "@/components/operations/operational-timeline";
import { DietaryBadges } from "@/components/operations/dietary-badges";
import {
  createOperationsRepository,
  type OperationalOrderListItem,
} from "@/modules/operations/infrastructure/operations-repository";
import {
  operationalStatusLabel,
  type OperationalOrderStatus,
  calculateTotalPortions,
  formatCreationDateTimeEs,
  formatMenuWeekEs,
  formatServiceDayEs,
  formatShortDateEs,
  getRollbackStatus,
  ROLLBACK_LABEL_ES,
  isOperationalRollbackEnabled,
  FEATURE_OPERATIONAL_ROLLBACK_ENABLED,
} from "@/modules/operations";

export { FEATURE_OPERATIONAL_ROLLBACK_ENABLED, isOperationalRollbackEnabled };

import {
  Plus,
  Calendar,
  UtensilsCrossed,
  AlertCircle,
  MapPin,
  User,
  FileText,
  Loader2,
  Check,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { UniversalOrderIntakeDrawer } from "@/components/orders/universal-order-intake-drawer";
import {
  BulkRollbackModal,
  executeRollbackOrders,
  type BulkExecutionResult,
} from "@/components/orders/bulk-order-actions";
import { useOrder } from "@/order/useOrder";
import {
  cancelOrderCommand,
  confirmOrderCommand,
  readyForDeliveryCommand,
  readyForKitchenCommand,
  scheduleProductionCommand,
  completeDeliveryCommand,
} from "@/order/OrderCommands";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "orders.read");
  },
  component: AdminOrdersPage,
  head: () => ({
    meta: [{ title: "YourMeal OS — Pedidos" }],
  }),
});

/**
 * Determina la etiqueta de la acción rápida según el estado operacional del pedido.
 */
export function getOperationalQuickActionLabel(status: OperationalOrderStatus): string | null {
  switch (status) {
    case "draft":
      return "Confirmar Pedido";
    case "confirmed":
      return "Iniciar Cocina";
    case "in_production":
      return "Marcar Preparado";
    case "prepared":
      return "Listo para Reparto";
    case "ready_for_delivery":
      return "Iniciar Reparto";
    case "out_for_delivery":
      return "Confirmar Entrega";
    default:
      return null;
  }
}

/**
 * Tabla Limpia de Pedidos con Quick Actions (Clean Actionable Table) — CR-OPS-UX Fase 1
 * Columnas: Cliente | Estado | Nº raciones | Fecha | Acción
 */
export function OrdersTable({
  orders,
  onSelectDetail,
  onOrderUpdated,
  selectedOrderIds = new Set(),
  onToggleSelectOrder,
  onToggleSelectAll,
}: {
  orders: OperationalOrderListItem[];
  onSelectDetail: (order: OperationalOrderListItem) => void;
  onOrderUpdated?: () => void;
  selectedOrderIds?: Set<string>;
  onToggleSelectOrder?: (orderId: string) => void;
  onToggleSelectAll?: () => void;
}) {
  const orderApi = useOrder();
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const handleQuickAdvance = async (order: OperationalOrderListItem) => {
    setBusyOrderId(order.id);
    try {
      let res;
      if (order.status === "draft") {
        res = await orderApi.confirmOrder(confirmOrderCommand({ orderId: order.id }));
      } else if (order.status === "confirmed") {
        res = await orderApi.scheduleProduction(scheduleProductionCommand({ orderId: order.id }));
      } else if (order.status === "in_production") {
        res = await orderApi.readyForKitchen(readyForKitchenCommand({ orderId: order.id }));
      } else if (order.status === "prepared") {
        res = await orderApi.readyForDelivery(readyForDeliveryCommand({ orderId: order.id }));
      } else if (order.status === "ready_for_delivery" || order.status === "out_for_delivery") {
        res = await orderApi.completeDelivery(completeDeliveryCommand({ orderId: order.id }));
      }
      if (res) {
        if (!res.ok) {
          toast.error(res.errors[0]?.message ?? "Error al actualizar estado del pedido.");
        } else {
          toast.success(`Pedido #${order.id.slice(0, 8)} actualizado.`);
          onOrderUpdated?.();
        }
      }
    } catch (e: any) {
      toast.error(e.message ?? "Error al procesar acción operacional.");
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {onToggleSelectAll && (
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={
                    orders.length > 0 && selectedOrderIds.size === orders.length
                      ? true
                      : selectedOrderIds.size > 0
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={onToggleSelectAll}
                  aria-label="Seleccionar todos los pedidos visibles"
                />
              </TableHead>
            )}
            <TableHead>Cliente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Nº raciones</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => {
            const portions = calculateTotalPortions(o.items);
            const primaryDate = o.deliveryDates[0] ?? o.weekStart;
            const quickActionLabel = getOperationalQuickActionLabel(o.status);

            return (
              <TableRow
                key={o.id}
                className={selectedOrderIds.has(o.id) ? "bg-muted/40" : undefined}
              >
                {onToggleSelectOrder && (
                  <TableCell
                    className="w-12 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedOrderIds.has(o.id)}
                      onCheckedChange={() => onToggleSelectOrder(o.id)}
                      aria-label={`Seleccionar pedido ${o.id}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  <div>{o.customerName ?? "Cliente Particular"}</div>
                  {o.companyName && (
                    <div className="text-xs text-muted-foreground">
                      {o.companyName}
                    </div>
                  )}
                  {o.dietarySnapshot && (
                    <div className="mt-1">
                      <DietaryBadges snapshot={o.dietarySnapshot} compact />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {operationalStatusLabel(o.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {portions}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatShortDateEs(primaryDate)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    {quickActionLabel && (
                      <Button
                        size="sm"
                        disabled={busyOrderId === o.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleQuickAdvance(o);
                        }}
                        className="h-8 gap-1.5 px-3 text-xs font-semibold shadow-2xs"
                      >
                        {busyOrderId === o.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : null}
                        {quickActionLabel}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => onSelectDetail(o)}
                    >
                      Detalle
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {orders.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={onToggleSelectAll ? 6 : 5}
                className="text-center text-muted-foreground py-8"
              >
                Sin pedidos operativos.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Centro de Control Operacional del Pedido (Order Operational Control Center) — CR-OPS-UX Fase 1
 * Arquitectura de 5 Niveles Operativos:
 * Tier 1: Identidad & Métricas Clave
 * Tier 2: Barra de Acción Hero Pinned (CR-OPS-09B)
 * Tier 3: Contenido Culinario & Modificaciones
 * Tier 4: Logística, Ubicación y Notas
 * Tier 5: Auditoría y Contexto Temporal Limpio
 */
export function OrderDetailView({
  detail,
  onOrderUpdated,
  onEditorLock,
}: {
  detail: OperationalOrderListItem;
  onOrderUpdated?: () => void;
  onEditorLock?: (locked: boolean) => void;
}) {
  const orderApi = useOrder();
  const [editorLocked, setEditorLocked] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [rollbackNeedsRefresh, setRollbackNeedsRefresh] = useState(false);
  const [busy, setBusy] = useState(false);

  const rollbackStatus = getRollbackStatus(detail.status);
  const rollbackLabel = rollbackStatus ? ROLLBACK_LABEL_ES[detail.status] : null;
  const isV2Canonical = detail.writeContractVersion === 2;
  const canRollback = Boolean(
    isOperationalRollbackEnabled() && rollbackStatus && !isV2Canonical,
  );

  const canCancel = [
    "draft",
    "confirmed",
    "in_production",
    "prepared",
    "ready_for_delivery",
  ].includes(detail.status);

  const getMainActionLabel = (status: OperationalOrderStatus) => {
    switch (status) {
      case "draft":
        return "Confirmar Pedido";
      case "confirmed":
        return "Iniciar Preparación (Cocina)";
      case "in_production":
        return "Marcar Preparado";
      case "prepared":
        return "Listo para Reparto";
      case "ready_for_delivery":
        return "Iniciar Reparto";
      case "out_for_delivery":
        return "Confirmar Entrega";
      default:
        return null;
    }
  };

  const mainActionLabel = getMainActionLabel(detail.status);

  const handleMainAction = async () => {
    setBusy(true);
    try {
      let res;
      if (detail.status === "draft") {
        res = await orderApi.confirmOrder(confirmOrderCommand({ orderId: detail.id }));
      } else if (detail.status === "confirmed") {
        res = await orderApi.scheduleProduction(scheduleProductionCommand({ orderId: detail.id }));
      } else if (detail.status === "in_production") {
        res = await orderApi.readyForKitchen(readyForKitchenCommand({ orderId: detail.id }));
      } else if (detail.status === "prepared") {
        res = await orderApi.readyForDelivery(readyForDeliveryCommand({ orderId: detail.id }));
      } else if (detail.status === "ready_for_delivery" || detail.status === "out_for_delivery") {
        res = await orderApi.completeDelivery(completeDeliveryCommand({ orderId: detail.id }));
      }
      if (res) {
        if (!res.ok) {
          toast.error(res.errors[0]?.message ?? "Error al actualizar estado del pedido.");
        } else {
          toast.success("Estado del pedido actualizado.");
          onOrderUpdated?.();
        }
      }
    } catch (e: any) {
      toast.error(e.message ?? "Error al procesar acción operacional.");
    } finally {
      setBusy(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("El motivo de cancelación es obligatorio.");
      return;
    }
    setBusy(true);
    try {
      const res = await orderApi.cancelOrder(
        cancelOrderCommand({ orderId: detail.id, reason: cancelReason.trim() }),
      );
      if (!res.ok) {
        toast.error(res.errors[0]?.message ?? "Error al cancelar el pedido.");
      } else {
        toast.success("Pedido cancelado correctamente.");
        setCancelDialogOpen(false);
        onOrderUpdated?.();
      }
    } catch (e: any) {
      toast.error(e.message ?? "Error inesperado al cancelar pedido.");
    } finally {
      setBusy(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* ── Tier 1: Identidad Operativa & Métricas ───────────────────────────── */}
      <div className="space-y-2 border-b pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-foreground">
              {`#${detail.id.slice(0, 8)}`}
            </span>
            <Badge variant="secondary">
              {operationalStatusLabel(detail.status)}
            </Badge>
            <Badge variant="outline">
              {detail.demandChannel === "company"
                ? "B2B Corporativo"
                : "B2C Particular"}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground font-medium">
              {`${calculateTotalPortions(detail.items)} raciones`}
            </span>
            <span className="font-semibold text-foreground text-base">
              {`${detail.total.toFixed(2)} €`}
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">
            {detail.customerName ?? "Cliente Particular"}
            {detail.companyName && (
              <span className="font-normal text-muted-foreground ml-2">
                · {detail.companyName}
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground">
            Centro de control operacional del pedido
          </p>
        </div>
      </div>

      {/* ── Tier 2: Barra de Acción Hero & Timeline (CR-OPS-09B) ─────────────── */}
      <div className="rounded-xl border bg-muted/40 p-4 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
            Acciones Operacionales (CR-OPS-09B)
          </div>
          {detail.status === "cancelled" && (
            <Badge variant="destructive">Pedido Cancelado</Badge>
          )}
          {detail.status === "delivered" && (
            <Badge variant="outline" className="border-green-600 text-green-600">
              Pedido Entregado
            </Badge>
          )}
        </div>

        <OperationalTimeline status={detail.status} />

        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/40">
          {mainActionLabel && (
            <Button
              onClick={handleMainAction}
              disabled={busy || editorLocked}
              className="gap-2 font-semibold shadow-xs"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mainActionLabel}
            </Button>
          )}

          {isOperationalRollbackEnabled() && rollbackLabel && rollbackStatus && (
            <Button
              variant="outline"
              onClick={() => {
                if (isV2Canonical) return;
                setRollbackDialogOpen(true);
              }}
              disabled={busy || editorLocked || isV2Canonical}
              title={
                isV2Canonical
                  ? "Los pedidos canónicos v2 no admiten retroceso de estado operacional directo"
                  : undefined
              }
              className="gap-1.5 text-xs font-semibold"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {rollbackLabel}
              {isV2Canonical && (
                <span className="text-[10px] text-muted-foreground ml-1">(No disp. v2)</span>
              )}
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(true)}
              disabled={busy || editorLocked}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 text-xs"
            >
              Cancelar Pedido
            </Button>
          )}
        </div>
      </div>

      {(detail.writeContractVersion === 2 ||
        detail.items.some((item) => item.line?.kind === "custom")) && (
        <CanonicalOrderEditPanel
          key={detail.id}
          orderId={detail.id}
          channel={detail.demandChannel}
          onSuccess={onOrderUpdated}
          onLockChange={(next) => {
            setEditorLocked(next);
            onEditorLock?.(next);
          }}
        />
      )}

      {/* ── Tier 3: Desglose de Platos del Pedido ────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UtensilsCrossed className="h-4 w-4 text-primary" />
            {`${detail.items.some((item) => item.line?.kind === "custom") ? "Artículos" : "Platos"} del Pedido (${detail.items.length})`}
          </div>
          <span className="text-xs text-muted-foreground">
            Snapshot financiero inmutable
          </span>
        </div>

        {/* Tabla para Desktop y Tablet (sm+) */}
        <div className="hidden sm:block rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-xs">
                <TableHead>Plato</TableHead>
                <TableHead>Día de Servicio</TableHead>
                <TableHead className="text-right">Raciones</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.items.map((it) => {
                const subtotal =
                  it.unitPrice != null ? it.unitPrice * it.qty : null;
                return (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">
                      <div>
                        {it.dishName ?? "Plato no especificado"}
                        {it.line?.kind === "custom" && (
                          <span className="block text-xs text-muted-foreground">
                            Personalizado · UNKNOWN (alérgenos desconocidos) · NOT_AVAILABLE (receta
                            no disponible)
                          </span>
                        )}
                      </div>
                      {it.notes && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{it.notes}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatShortDateEs(it.dayDate)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                      {it.qty}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground whitespace-nowrap">
                      {it.unitPrice != null
                        ? `${it.unitPrice.toFixed(2)} €`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium whitespace-nowrap">
                      {subtotal != null ? `${subtotal.toFixed(2)} €` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {detail.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-4"
                  >
                    Sin platos asignados a este pedido.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="font-semibold text-sm">
                <TableCell colSpan={2}>Total Pedido</TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap">
                  {calculateTotalPortions(detail.items)}
                </TableCell>
                <TableCell />
                <TableCell className="text-right font-mono text-base whitespace-nowrap">
                  {detail.total.toFixed(2)} €
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Vista en Tarjetas Compactas para Móvil (< sm) */}
        <div className="space-y-2.5 sm:hidden">
          {detail.items.map((it) => {
            const subtotal =
              it.unitPrice != null ? it.unitPrice * it.qty : null;
            return (
              <div
                key={it.id}
                className="rounded-lg border bg-card p-3 space-y-2 shadow-2xs"
              >
                <div className="font-medium text-sm text-foreground leading-snug">
                  {it.dishName ?? "Plato no especificado"}
                  {it.line?.kind === "custom" && (
                    <span className="block text-xs text-muted-foreground">
                      Personalizado · UNKNOWN (alérgenos desconocidos) · NOT_AVAILABLE (receta no
                      disponible)
                    </span>
                  )}
                </div>
                {it.notes && (
                  <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{it.notes}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t">
                  <span className="font-medium">
                    {formatShortDateEs(it.dayDate)}
                  </span>
                  <div className="font-mono text-xs text-foreground flex items-center gap-1.5 whitespace-nowrap">
                    <span className="font-medium">
                      {it.qty} {it.qty === 1 ? "ración" : "raciones"}
                    </span>
                    {it.unitPrice != null && (
                      <span className="text-muted-foreground">
                        ({it.unitPrice.toFixed(2)} €)
                      </span>
                    )}
                    <span className="font-bold text-primary">
                      → {subtotal != null ? `${subtotal.toFixed(2)} €` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {detail.items.length === 0 && (
            <div className="rounded-lg border p-4 text-center text-xs text-muted-foreground">
              Sin platos asignados a este pedido.
            </div>
          )}
          {/* Resumen total en móvil */}
          <div className="rounded-lg border bg-muted/40 p-3 flex items-center justify-between text-sm font-semibold">
            <span>
              Total Pedido ({calculateTotalPortions(detail.items)}{" "}
              {calculateTotalPortions(detail.items) === 1
                ? "ración"
                : "raciones"}
              )
            </span>
            <span className="font-mono text-base font-bold text-foreground">
              {detail.total.toFixed(2)} €
            </span>
          </div>
        </div>
      </div>

      {/* ── CR-CUST-01: Perfil Dietético & Alérgenos Inmutable del Pedido ─────── */}
      {detail.dietarySnapshot && (
        <DietaryBadges snapshot={detail.dietarySnapshot} />
      )}

      {/* ── Tier 4: Datos de Entrega y Contacto ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border p-4 bg-card space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <User className="h-3.5 w-3.5 text-primary" />
            Datos de Contacto y Ubicación
          </div>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {detail.customerEmail ?? "Sin email registrado"}
            </p>
            {detail.siteName ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  {detail.siteAddress
                    ? `${detail.siteName} · ${detail.siteAddress}`
                    : detail.siteName}
                </span>
              </p>
            ) : detail.deliveryAddress ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  {detail.deliveryAddress.label ? `${detail.deliveryAddress.label}: ` : ""}
                  {detail.deliveryAddress.street}
                  {detail.deliveryAddress.city ? `, ${detail.deliveryAddress.city}` : ""}
                  {detail.deliveryAddress.zip ? ` (${detail.deliveryAddress.zip})` : ""}
                </span>
              </p>
            ) : null}
            {detail.deliveryGroupName && (
              <p className="text-xs text-muted-foreground">
                {`Grupo de entrega: ${detail.deliveryGroupName}`}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border p-4 bg-card space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <FileText className="h-3.5 w-3.5 text-primary" />
            Instrucciones / Notas de Entrega
          </div>
          <p className="text-sm text-muted-foreground italic">
            {detail.notes
              ? detail.notes
              : "Sin observaciones o notas de entrega adicionales."}
          </p>
        </div>
      </div>

      {/* ── Tier 5: Contexto Temporal y Comercial (Auditoría) ───────────────── */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          Contexto Temporal y Comercial
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Semana del Menú
            </p>
            <p className="font-medium text-foreground mt-0.5">
              {formatMenuWeekEs(detail.weekStart)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Fecha Prevista de Entrega
            </p>
            <p className="font-medium text-foreground mt-0.5">
              {detail.deliveryDates.length > 0
                ? detail.deliveryDates.map(formatServiceDayEs).join(", ")
                : formatServiceDayEs(detail.weekStart)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Fecha de Creación
            </p>
            <p className="font-medium text-foreground mt-0.5">
              {formatCreationDateTimeEs(detail.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Fecha de Confirmación
            </p>
            <p className="font-medium text-foreground mt-0.5">
              {detail.status === "draft"
                ? "Pendiente de confirmación"
                : "No registrada en modelo (sin columna en DB)"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Última Actualización
            </p>
            <p className="font-medium text-foreground mt-0.5 text-muted-foreground/80 italic text-xs">
              No disponible (sin columna updated_at en modelo)
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Menú de Origen
            </p>
            <p className="font-medium text-foreground mt-0.5">
              Menú Semanal Publicado
            </p>
          </div>
        </div>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Pedido #{detail.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              Esta acción marcará el pedido como cancelado y registrará un evento inmutable en el registro de auditoría.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-foreground">
              Motivo de cancelación (obligatorio)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Indique el motivo de la cancelación..."
              className="w-full rounded-md border border-input bg-background p-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={busy || editorLocked}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={busy || !cancelReason.trim()}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Cancelación
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BulkRollbackModal
        open={rollbackDialogOpen} onOpenChange={(open) => {
          setRollbackDialogOpen(open);
          if (!open && rollbackNeedsRefresh) { setRollbackNeedsRefresh(false); onOrderUpdated?.(); }
        }}
        selectedOrders={[detail]} busy={busy || editorLocked}
        onExecute={async (orders, reason, scope) => {
          setBusy(true);
          try {
            const result = await executeRollbackOrders(orders, reason, scope, orderApi);
            setRollbackNeedsRefresh(result.succeeded.length > 0 || result.failed.length > 0);
            return result;
          } finally { setBusy(false); }
        }}
      />
    </div>
  );
}

export function AdminOrdersPage() {
  const { user, tenantId, roles } = useAuth();
  const orderApi = useOrder();
  const [orders, setOrders] = useState<OperationalOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OperationalOrderListItem | null>(null);
  const [detailLocked, setDetailLocked] = useState(false);
  const [intakeDrawerOpen, setIntakeDrawerOpen] = useState(false);

  // Bulk actions state (CR-OPS-UX Block 2)
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkAdvanceOpen, setBulkAdvanceOpen] = useState(false);
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false);
  const [bulkCancelReason, setBulkCancelReason] = useState("");
  const [bulkRollbackOpen, setBulkRollbackOpen] = useState(false);

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
      const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
      const statuses: OperationalOrderStatus[] = [
        "draft",
        "confirmed",
        "in_production",
        "prepared",
        "ready_for_delivery",
        "out_for_delivery",
        "delivered",
        "delivery_issue",
      ];
      setOrders(await repo.listOrders({ statuses }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar pedidos");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedOrders = useMemo(
    () => orders.filter((o) => selectedOrderIds.has(o.id)),
    [orders, selectedOrderIds],
  );

  const selectedPortions = useMemo(
    () => selectedOrders.reduce((sum: number, o: OperationalOrderListItem) => sum + calculateTotalPortions(o.items), 0),
    [selectedOrders],
  );

  const bulkAdvanceBreakdown = useMemo(() => {
    let draftCount = 0;
    let draftPortions = 0;
    let confirmedCount = 0;
    let confirmedPortions = 0;
    let inProductionCount = 0;
    let inProductionPortions = 0;
    let preparedCount = 0;
    let preparedPortions = 0;
    let omittedCount = 0;
    let omittedPortions = 0;

    for (const o of selectedOrders) {
      const portions = calculateTotalPortions(o.items);
      if (o.status === "draft") {
        draftCount++;
        draftPortions += portions;
      } else if (o.status === "confirmed") {
        confirmedCount++;
        confirmedPortions += portions;
      } else if (o.status === "in_production") {
        inProductionCount++;
        inProductionPortions += portions;
      } else if (o.status === "prepared") {
        preparedCount++;
        preparedPortions += portions;
      } else {
        // ready_for_delivery, out_for_delivery, delivered, cancelled, delivery_issue
        omittedCount++;
        omittedPortions += portions;
      }
    }

    const eligibleCount =
      draftCount + confirmedCount + inProductionCount + preparedCount;
    const eligiblePortions =
      draftPortions + confirmedPortions + inProductionPortions + preparedPortions;

    return {
      draftCount,
      draftPortions,
      confirmedCount,
      confirmedPortions,
      inProductionCount,
      inProductionPortions,
      preparedCount,
      preparedPortions,
      omittedCount,
      omittedPortions,
      eligibleCount,
      eligiblePortions,
    };
  }, [selectedOrders]);

  const handleToggleSelectAll = () => {
    if (selectedOrderIds.size === orders.length && orders.length > 0) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(orders.map((o) => o.id)));
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenBulkAdvanceModal = () => {
    if (selectedOrders.length === 0) return;
    if (bulkAdvanceBreakdown.eligibleCount === 0) {
      toast.warning(
        "Ninguno de los pedidos seleccionados es elegible para avance operacional (Cocina / Packing).",
      );
      return;
    }
    setBulkAdvanceOpen(true);
  };

  const executeBulkAdvanceAll = async () => {
    if (selectedOrders.length === 0) return;
    setBulkBusy(true);
    let successCount = 0;
    let omittedCount = 0;
    let errorCount = 0;

    for (const o of selectedOrders) {
      try {
        let res;
        if (o.status === "draft") {
          res = await orderApi.confirmOrder(confirmOrderCommand({ orderId: o.id }));
        } else if (o.status === "confirmed") {
          res = await orderApi.scheduleProduction(scheduleProductionCommand({ orderId: o.id }));
        } else if (o.status === "in_production") {
          res = await orderApi.readyForKitchen(readyForKitchenCommand({ orderId: o.id }));
        } else if (o.status === "prepared") {
          res = await orderApi.readyForDelivery(readyForDeliveryCommand({ orderId: o.id }));
        } else {
          // Strictly exclude transitions to delivered (delivery requires physical evidence)
          omittedCount++;
          continue;
        }

        if (res && res.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setBulkBusy(false);
    setBulkAdvanceOpen(false);
    toast.success(
      `✓ ${successCount} actualizados · ⚠️ ${omittedCount} omitidos · ${errorCount} fallidos`,
    );
    setSelectedOrderIds(new Set());
    void load();
  };

  const handleBulkConfirm = async () => {
    const eligible = selectedOrders.filter((o: OperationalOrderListItem) => o.status === "draft");
    const omitted = selectedOrders.length - eligible.length;
    if (eligible.length === 0) {
      toast.warning("Ninguno de los pedidos seleccionados está en estado Borrador.");
      return;
    }

    setBulkBusy(true);
    let successCount = 0;
    let errorCount = 0;

    for (const o of eligible) {
      try {
        const res = await orderApi.confirmOrder(confirmOrderCommand({ orderId: o.id }));
        if (res.ok) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
    }

    setBulkBusy(false);
    toast.success(
      `✓ ${successCount} confirmados · ⚠️ ${omitted} omitidos · ${errorCount} fallidos`,
    );
    setSelectedOrderIds(new Set());
    void load();
  };

  const handleBulkStartKitchen = async () => {
    const eligible = selectedOrders.filter((o: OperationalOrderListItem) => o.status === "confirmed");
    const omitted = selectedOrders.length - eligible.length;
    if (eligible.length === 0) {
      toast.warning("Ninguno de los pedidos seleccionados está en estado Confirmado.");
      return;
    }

    setBulkBusy(true);
    let successCount = 0;
    let errorCount = 0;

    for (const o of eligible) {
      try {
        const res = await orderApi.scheduleProduction(scheduleProductionCommand({ orderId: o.id }));
        if (res.ok) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
    }

    setBulkBusy(false);
    toast.success(
      `✓ ${successCount} en preparación · ⚠️ ${omitted} omitidos · ${errorCount} fallidos`,
    );
    setSelectedOrderIds(new Set());
    void load();
  };

  const handleBulkMarkPrepared = async () => {
    const eligible = selectedOrders.filter((o: OperationalOrderListItem) => o.status === "in_production");
    const omitted = selectedOrders.length - eligible.length;
    if (eligible.length === 0) {
      toast.warning("Ninguno de los pedidos seleccionados está En preparación.");
      return;
    }

    setBulkBusy(true);
    let successCount = 0;
    let errorCount = 0;

    for (const o of eligible) {
      try {
        const res = await orderApi.readyForKitchen(readyForKitchenCommand({ orderId: o.id }));
        if (res.ok) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
    }

    setBulkBusy(false);
    toast.success(
      `✓ ${successCount} marcados preparados · ⚠️ ${omitted} omitidos · ${errorCount} fallidos`,
    );
    setSelectedOrderIds(new Set());
    void load();
  };

  const handleBulkCancelSubmit = async () => {
    if (!bulkCancelReason.trim()) {
      toast.error("El motivo de cancelación masiva es obligatorio.");
      return;
    }

    const cancelableStatuses = new Set([
      "draft",
      "confirmed",
      "in_production",
      "prepared",
      "ready_for_delivery",
    ]);

    const eligible = selectedOrders.filter((o: OperationalOrderListItem) => cancelableStatuses.has(o.status));
    const omitted = selectedOrders.length - eligible.length;
    if (eligible.length === 0) {
      toast.warning("Ninguno de los pedidos seleccionados puede ser cancelado.");
      return;
    }

    setBulkBusy(true);
    let successCount = 0;
    let errorCount = 0;

    for (const o of eligible) {
      try {
        const res = await orderApi.cancelOrder(
          cancelOrderCommand({ orderId: o.id, reason: bulkCancelReason.trim() }),
        );
        if (res.ok) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
    }

    setBulkBusy(false);
    setBulkCancelOpen(false);
    setBulkCancelReason("");
    toast.success(
      `✓ ${successCount} cancelados · ⚠️ ${omitted} omitidos · ${errorCount} fallidos`,
    );
    setSelectedOrderIds(new Set());
    void load();
  };

  const executeBulkRollback = async (
    eligibleOrders: OperationalOrderListItem[], reason: string,
    scope: Pick<OperationalRollbackScope, "allowMultiDay" | "operatingDate">,
  ): Promise<BulkExecutionResult> => {
    setBulkBusy(true);
    try {
      const result = await executeRollbackOrders(eligibleOrders, reason, scope, orderApi);
      void load();
      return result;
    } finally { setBulkBusy(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <SectionTitle
            overline="Operaciones"
            title="Pedidos"
            subtitle="Vista de pedidos operativos con timeline, quick actions y captura universal."
          />
        </div>
        <Button onClick={() => setIntakeDrawerOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          + Nuevo Pedido
        </Button>
      </div>

      <UniversalOrderIntakeDrawer
        open={intakeDrawerOpen}
        onOpenChange={setIntakeDrawerOpen}
        onSuccess={() => void load()}
      />

      {/* Barra de Acciones Masivas (CR-OPS-UX Block 2) */}
      {selectedOrderIds.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-card/95 p-3.5 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-xs font-semibold px-2.5 py-1">
              {selectedOrderIds.size}{" "}
              {selectedOrderIds.size === 1
                ? "pedido seleccionado"
                : "pedidos seleccionados"}
            </Badge>
            <span className="text-sm font-medium text-foreground">
              · {selectedPortions}{" "}
              {selectedPortions === 1 ? "ración total" : "raciones totales"} afectadas
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={handleOpenBulkAdvanceModal}
              disabled={bulkBusy}
              className="gap-1.5 text-xs font-semibold shadow-xs"
            >
              {bulkBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Avanzar todos los elegibles
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkRollbackOpen(true)}
              disabled={bulkBusy}
              className="gap-1.5 text-xs font-semibold border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/10"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Retroceder estado
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkBusy}
                  className="gap-1 text-xs"
                >
                  Acción Masiva <ChevronDown className="h-3.5 w-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem onClick={handleBulkConfirm}>
                  Confirmar seleccionados (draft)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkStartKitchen}>
                  Iniciar cocina (confirmed)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkMarkPrepared}>
                  Marcar preparados (in_production)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setBulkRollbackOpen(true)}
                  className="text-amber-800 dark:text-amber-300"
                >
                  Retroceder seleccionados...
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setBulkCancelOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  Cancelar seleccionados...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOrderIds(new Set())}
              disabled={bulkBusy}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Deseleccionar
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <OrdersTable
          orders={orders}
          selectedOrderIds={selectedOrderIds}
          onToggleSelectOrder={handleToggleSelectOrder}
          onToggleSelectAll={handleToggleSelectAll}
          onSelectDetail={(o) => setDetail(o)}
          onOrderUpdated={() => void load()}
        />
      )}

      {/* Drawer lateral ergonómico para Ficha de Pedido (CR-OPS-UX Fase 1) */}
      <Sheet
        open={!!detail}
        onOpenChange={(open) => {
          if (!open && !detailLocked) setDetail(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-6">
          <SheetHeader className="sr-only">
            <SheetTitle>Ficha de Pedido</SheetTitle>
            <SheetDescription>
              Centro de control operacional del pedido
            </SheetDescription>
          </SheetHeader>
          {detail && (
            <OrderDetailView
              detail={detail}
              onEditorLock={setDetailLocked}
              onOrderUpdated={() => {
                setDetail(null);
                void load();
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de Cancelación Masiva */}
      <Dialog open={bulkCancelOpen} onOpenChange={setBulkCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Cancelar {selectedOrderIds.size} pedidos seleccionados
            </DialogTitle>
            <DialogDescription>
              Esta acción cancelará los pedidos seleccionados que se encuentren en estados
              cancelables (excluye pedidos en reparto o entregados). Requiere motivo
              obligatorio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-foreground">
              Motivo de cancelación masiva (obligatorio)
            </label>
            <textarea
              value={bulkCancelReason}
              onChange={(e) => setBulkCancelReason(e.target.value)}
              placeholder="Indique el motivo de la cancelación masiva..."
              className="w-full rounded-md border border-input bg-background p-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setBulkCancelOpen(false)}
              disabled={bulkBusy}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkCancelSubmit}
              disabled={bulkBusy || !bulkCancelReason.trim()}
            >
              {bulkBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Cancelación Masiva
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Avance Masivo (Cocina / Packing) */}
      <Dialog open={bulkAdvanceOpen} onOpenChange={setBulkAdvanceOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmar Avance Masivo de Pedidos</DialogTitle>
            <DialogDescription>
              Se avanzarán al siguiente estado operacional los pedidos seleccionados elegibles.
              Las transiciones a reparto final y entrega están estrictamente excluidas de las acciones masivas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
              <div className="flex justify-between items-center font-semibold text-foreground border-b pb-1.5">
                <span>Resumen de selección</span>
                <span>
                  {selectedOrders.length} {selectedOrders.length === 1 ? "pedido" : "pedidos"} ({selectedPortions} {selectedPortions === 1 ? "ración" : "raciones"})
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {bulkAdvanceBreakdown.draftCount > 0 && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Borrador → Confirmado
                    </span>
                    <span>
                      {bulkAdvanceBreakdown.draftCount} pedidos ({bulkAdvanceBreakdown.draftPortions} rac.)
                    </span>
                  </div>
                )}

                {bulkAdvanceBreakdown.confirmedCount > 0 && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Confirmado → En Preparación (Cocina)
                    </span>
                    <span>
                      {bulkAdvanceBreakdown.confirmedCount} pedidos ({bulkAdvanceBreakdown.confirmedPortions} rac.)
                    </span>
                  </div>
                )}

                {bulkAdvanceBreakdown.inProductionCount > 0 && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      En Preparación → Preparado
                    </span>
                    <span>
                      {bulkAdvanceBreakdown.inProductionCount} pedidos ({bulkAdvanceBreakdown.inProductionPortions} rac.)
                    </span>
                  </div>
                )}

                {bulkAdvanceBreakdown.preparedCount > 0 && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Preparado → Listo para Reparto
                    </span>
                    <span>
                      {bulkAdvanceBreakdown.preparedCount} pedidos ({bulkAdvanceBreakdown.preparedPortions} rac.)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {bulkAdvanceBreakdown.omittedCount > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-semibold mb-0.5">
                  ⚠️ {bulkAdvanceBreakdown.omittedCount}{" "}
                  {bulkAdvanceBreakdown.omittedCount === 1 ? "pedido omitido" : "pedidos omitidos"}
                </p>
                <p>
                  Los pedidos en reparto, entregados o cancelados no se modifican masivamente.
                  La entrega de pedidos requiere confirmación individual con evidencia física.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => setBulkAdvanceOpen(false)}
              disabled={bulkBusy}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={executeBulkAdvanceAll}
              disabled={bulkBusy || bulkAdvanceBreakdown.eligibleCount === 0}
              className="gap-2 font-semibold"
            >
              {bulkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirmar Avance ({bulkAdvanceBreakdown.eligibleCount} {bulkAdvanceBreakdown.eligibleCount === 1 ? "elegible" : "elegibles"})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Retroceso Masivo Seguro */}
      <BulkRollbackModal
        open={bulkRollbackOpen}
        onOpenChange={(open) => { setBulkRollbackOpen(open); if (!open) setSelectedOrderIds(new Set()); }}
        selectedOrders={selectedOrders}
        onExecute={executeBulkRollback}
        busy={bulkBusy}
      />
    </div>
  );
}

export default AdminOrdersPage;
