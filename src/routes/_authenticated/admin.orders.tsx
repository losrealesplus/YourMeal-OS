import { CanonicalOrderEditPanel } from "@/components/orders/canonical-order-edit-panel";
/**
 * Pedidos — Centro de Control Operacional y Temporal (CR-OPS-09A / Fase 1 CR-OPS-UX).
 * PR-034 / CR-OPS-09A / CR-OPS-UX Fase 1 (Quick Actions & 5-Tier Drawer).
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useState } from "react";
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
} from "@/modules/operations";

import {
  Plus,
  Calendar,
  UtensilsCrossed,
  AlertCircle,
  MapPin,
  User,
  FileText,
  Loader2,
} from "lucide-react";
import { UniversalOrderIntakeDrawer } from "@/components/orders/universal-order-intake-drawer";
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
}: {
  orders: OperationalOrderListItem[];
  onSelectDetail: (order: OperationalOrderListItem) => void;
  onOrderUpdated?: () => void;
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
              <TableRow key={o.id}>
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
                colSpan={5}
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
  const [busy, setBusy] = useState(false);

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
    </div>
  );
}

export function AdminOrdersPage() {
  const { user, tenantId, roles } = useAuth();
  const [orders, setOrders] = useState<OperationalOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OperationalOrderListItem | null>(null);
  const [detailLocked, setDetailLocked] = useState(false);
  const [intakeDrawerOpen, setIntakeDrawerOpen] = useState(false);

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

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <OrdersTable
          orders={orders}
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
    </div>
  );
}

export default AdminOrdersPage;
