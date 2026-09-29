/**
 * Pedidos — Centro de Control Operacional y Temporal (CR-OPS-09A).
 * PR-034 / CR-OPS-09A
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
import { OperationalTimeline } from "@/components/operations/operational-timeline";
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
  Info,
} from "lucide-react";
import { UniversalOrderIntakeDrawer } from "@/components/orders/universal-order-intake-drawer";

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
 * Tabla Limpia de Pedidos (Clean Table) — CR-OPS-09A
 * Columnas: Cliente | Estado | Nº raciones | Fecha | Acción
 */
export function OrdersTable({
  orders,
  onSelectDetail,
}: {
  orders: OperationalOrderListItem[];
  onSelectDetail: (order: OperationalOrderListItem) => void;
}) {
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
            return (
              <TableRow key={o.id}>
                <TableCell className="font-medium">
                  <div>{o.customerName ?? "Cliente Particular"}</div>
                  {o.companyName && (
                    <div className="text-xs text-muted-foreground">
                      {o.companyName}
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
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectDetail(o)}
                  >
                    Detalle
                  </Button>
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
 * Centro de Control Operacional del Pedido (Order Operational Control Center) — CR-OPS-09A
 */
export function OrderDetailView({
  detail,
}: {
  detail: OperationalOrderListItem;
}) {
  return (
    <div className="space-y-6">
      {/* Cabecera Operativa */}
      <DialogHeader className="space-y-2">
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
            <span className="text-muted-foreground">
              {`${calculateTotalPortions(detail.items)} raciones`}
            </span>
            <span className="font-semibold text-foreground text-base">
              {`${detail.total.toFixed(2)} €`}
            </span>
          </div>
        </div>

        <div>
          <DialogTitle className="text-base font-semibold">
            {detail.customerName ?? "Cliente Particular"}
            {detail.companyName && (
              <span className="font-normal text-muted-foreground ml-2">
                · {detail.companyName}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Centro de control operacional del pedido
          </DialogDescription>
        </div>
      </DialogHeader>

      {/* Tarjeta de Contexto Temporal & Comercial */}
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

      {/* Desglose de Platos del Pedido */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UtensilsCrossed className="h-4 w-4 text-primary" />
            {`Platos del Pedido (${detail.items.length})`}
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
                      <div>{it.dishName ?? "Plato no especificado"}</div>
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
                className="rounded-lg border bg-card p-3 space-y-2 shadow-xs"
              >
                <div className="font-medium text-sm text-foreground leading-snug">
                  {it.dishName ?? "Plato no especificado"}
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

      {/* Datos de Entrega y Contacto */}
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
            {detail.siteName && (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  {detail.siteAddress
                    ? `${detail.siteName} · ${detail.siteAddress}`
                    : detail.siteName}
                </span>
              </p>
            )}
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

      {/* Timeline Operacional */}
      <div className="rounded-lg border p-4 bg-muted/20 space-y-4">
        <OperationalTimeline status={detail.status} />

        {/* Contenedor preparado para futuras acciones (CR-OPS-09B) */}
        <div className="pt-3 border-t flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 text-muted-foreground/80 mt-0.5" />
          <span>
            Acciones de ciclo de vida (Confirmar, Cocina, Reparto, Cancelar) se
            activarán en <strong className="text-foreground">CR-OPS-09B</strong>{" "}
            conforme a la gobernanza soberana.
          </span>
        </div>
      </div>
    </div>
  );
}

export function AdminOrdersPage() {
  const { user, tenantId, roles } = useAuth();
  const [orders, setOrders] = useState<OperationalOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OperationalOrderListItem | null>(null);
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
            subtitle="Vista de pedidos operativos con timeline y captura universal."
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
        <OrdersTable orders={orders} onSelectDetail={(o) => setDetail(o)} />
      )}

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
          {detail && <OrderDetailView detail={detail} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminOrdersPage;
