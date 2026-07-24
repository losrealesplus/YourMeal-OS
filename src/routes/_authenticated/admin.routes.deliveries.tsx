/**
 * ADMIN · Delivery · Entregas
 * Capability: logistics.operate  ·  Core Object: Delivery (order en cola de reparto)
 * Reads: DeliveryService.listDayDeliveries  ·  Writes: OperationsService.transitionDelivery
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DeliveryService,
} from "@/modules/delivery";
import {
  OperationsService,
  deliveryNextStatuses,
  operationalStatusLabel,
  type OperationalOrderListItem,
  type OperationalStatus,
} from "@/modules/operations";
import { cn } from "@/lib/utils";

const ROLES_ALLOWED = ["saas_admin", "company_admin", "operations_manager", "logistics", "delivery"];

export const Route = createFileRoute("/_authenticated/admin/routes/deliveries")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "logistics.operate");
  },
  component: DeliveriesPage,
  head: () => ({ meta: [{ title: "YourMeal OS — Entregas" }] }),
});

function todayISO() { return new Date().toISOString().slice(0, 10); }

function DeliveriesPage() {
  const { user, tenantId, roles } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [orders, setOrders] = useState<OperationalOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      setOrders(await DeliveryService.listDayDeliveries(ctx, date));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar las entregas");
      setOrders([]);
    } finally { setLoading(false); }
  }, [user, tenantId, roles, date]);

  useEffect(() => { void load(); }, [load]);

  async function transition(orderId: string, to: OperationalStatus) {
    if (!user || !tenantId) return;
    setBusy(orderId);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      await OperationsService.transitionDelivery(ctx, orderId, to);
      toast.success(`Pedido → ${operationalStatusLabel(to)}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transición rechazada");
    } finally { setBusy(null); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="del-date">Fecha</Label>
          <Input id="del-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Truck className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No hay entregas en cola para esta fecha.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Delivery Group</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">#{o.id.slice(0, 8)}</TableCell>
                  <TableCell>{o.customerName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {o.siteName ?? "—"}
                    {o.siteAddress ? <div>{o.siteAddress}</div> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{o.deliveryGroupName ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{operationalStatusLabel(o.status)}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {deliveryNextStatuses(o.status).map((s) => (
                        <Button key={s} size="sm" variant="outline" disabled={busy === o.id}
                          onClick={() => void transition(o.id, s)}>
                          {operationalStatusLabel(s)}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
