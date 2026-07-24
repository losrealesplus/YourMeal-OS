/**
 * ADMIN · Delivery · Paradas
 * Capability: logistics.operate  ·  Core Object: Stop (route_stop)
 * Reads/writes: RouteService.listStopsByDate · addStop · removeStop · markStopDelivered
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Trash2, CheckCircle2, Plus } from "lucide-react";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  RouteService,
  type RouteRow,
  type StopRow,
} from "@/modules/delivery";
import { OperationsService, operationalStatusLabel } from "@/modules/operations";
import { cn } from "@/lib/utils";

const ROLES_ALLOWED = ["saas_admin", "company_admin", "operations_manager", "logistics", "delivery"];

export const Route = createFileRoute("/_authenticated/admin/routes/stops")({
  validateSearch: (s: Record<string, unknown>) => ({
    date: typeof s.date === "string" ? s.date : undefined,
    routeId: typeof s.routeId === "string" ? s.routeId : undefined,
  }),
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "logistics.operate");
  },
  component: StopsPage,
  head: () => ({ meta: [{ title: "YourMeal OS — Paradas" }] }),
});

function todayISO() { return new Date().toISOString().slice(0, 10); }

function StopsPage() {
  const { user, tenantId, roles } = useAuth();
  const search = Route.useSearch();
  const [date, setDate] = useState(search.date ?? todayISO());
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [routeId, setRouteId] = useState<string>(search.routeId ?? "all");
  const [stops, setStops] = useState<StopRow[]>([]);
  const [candidates, setCandidates] = useState<{ id: string; label: string }[]>([]);
  const [pickOrderId, setPickOrderId] = useState<string>("");
  const [pickRouteId, setPickRouteId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      const [rs, ss, ready] = await Promise.all([
        RouteService.listByDate(ctx, date),
        RouteService.listStopsByDate(ctx, date),
        OperationsService.listDeliveryOrders(ctx, { deliveryDate: date }),
      ]);
      setRoutes(rs);
      setStops(ss);
      const usedOrderIds = new Set(ss.map((s) => s.orderId).filter(Boolean) as string[]);
      setCandidates(
        ready
          .filter((o) => o.status === "ready_for_delivery" && !usedOrderIds.has(o.id))
          .map((o) => ({
            id: o.id,
            label: `${o.customerName ?? "Cliente"} · ${o.siteName ?? o.companyName ?? "—"} · #${o.id.slice(0, 8)}`,
          })),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar las paradas");
      setStops([]); setRoutes([]); setCandidates([]);
    } finally { setLoading(false); }
  }, [user, tenantId, roles, date]);

  useEffect(() => { void load(); }, [load]);

  const visibleStops = useMemo(
    () => routeId === "all" ? stops : stops.filter((s) => s.routeId === routeId),
    [stops, routeId],
  );

  async function addStop() {
    if (!user || !tenantId || !pickRouteId || !pickOrderId) return;
    setBusy("add");
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      await RouteService.addStop(ctx, pickRouteId, { orderId: pickOrderId });
      toast.success("Parada añadida");
      setDialogOpen(false); setPickOrderId(""); setPickRouteId("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo añadir la parada");
    } finally { setBusy(null); }
  }

  async function removeStop(id: string) {
    if (!user || !tenantId) return;
    setBusy(id);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      await RouteService.removeStop(ctx, id);
      toast.success("Parada eliminada");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally { setBusy(null); }
  }

  async function markDelivered(id: string) {
    if (!user || !tenantId) return;
    setBusy(id);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      await RouteService.markStopDelivered(ctx, id);
      toast.success("Parada marcada como entregada");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo marcar");
    } finally { setBusy(null); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="stops-date">Fecha</Label>
            <Input id="stops-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1.5">
            <Label>Ruta</Label>
            <Select value={routeId} onValueChange={setRouteId}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las rutas</SelectItem>
                {routes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>Ruta #{r.id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={routes.length === 0}>
                <Plus className="mr-2 h-4 w-4" />Añadir parada
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Añadir parada a una ruta</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Ruta destino</Label>
                  <Select value={pickRouteId} onValueChange={setPickRouteId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona ruta" /></SelectTrigger>
                    <SelectContent>
                      {routes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          Ruta #{r.id.slice(0, 8)} · {r.stopCount} paradas
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Pedido (ready for delivery, sin ruta)</Label>
                  <Select value={pickOrderId} onValueChange={setPickOrderId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona pedido" /></SelectTrigger>
                    <SelectContent>
                      {candidates.length === 0 ? (
                        <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                          No hay pedidos disponibles
                        </div>
                      ) : candidates.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => void addStop()} disabled={!pickRouteId || !pickOrderId || busy === "add"}>
                    Añadir
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : visibleStops.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Sin paradas para esta selección.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ruta</TableHead>
                <TableHead>#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Sede / Dirección</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleStops.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">#{s.routeId.slice(0, 8)}</TableCell>
                  <TableCell className="tabular-nums">{s.sequence}</TableCell>
                  <TableCell>{s.order?.customerName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {s.order?.siteName ?? "—"}
                    {s.order?.siteAddress ? <div>{s.order.siteAddress}</div> : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {s.orderId ? `#${s.orderId.slice(0, 8)}` : "—"}
                  </TableCell>
                  <TableCell>
                    {s.deliveredAt ? (
                      <Badge variant="secondary">Entregada</Badge>
                    ) : s.order ? (
                      <Badge variant="outline">{operationalStatusLabel(s.order.status)}</Badge>
                    ) : (
                      <Badge variant="outline">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!s.deliveredAt ? (
                        <Button size="sm" variant="ghost" disabled={busy === s.id}
                          onClick={() => void markDelivered(s.id)}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" disabled={busy === s.id}
                        onClick={() => void removeStop(s.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
