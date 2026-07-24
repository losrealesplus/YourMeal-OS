/**
 * ADMIN · Delivery · Rutas
 * Capability: logistics.operate  ·  Core Object: Route
 * Reads/writes: RouteService  ·  Audit: automático (create / status_change / update).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Plus, Truck, MapPin } from "lucide-react";
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
  RouteService,
  routeStatusLabel,
  nextRouteStatuses,
  type RouteRow,
  type RouteStatus,
} from "@/modules/delivery";
import { cn } from "@/lib/utils";

const ROLES_ALLOWED = ["saas_admin", "company_admin", "operations_manager", "logistics", "delivery"];

export const Route = createFileRoute("/_authenticated/admin/routes/")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "logistics.operate");
  },
  component: RoutesIndexPage,
  head: () => ({ meta: [{ title: "YourMeal OS — Rutas" }] }),
});

function todayISO() { return new Date().toISOString().slice(0, 10); }

function RoutesIndexPage() {
  const { user, tenantId, roles } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      setRoutes(await RouteService.listByDate(ctx, date));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar las rutas");
      setRoutes([]);
    } finally { setLoading(false); }
  }, [user, tenantId, roles, date]);

  useEffect(() => { void load(); }, [load]);

  async function createRoute() {
    if (!user || !tenantId) return;
    setBusy("create");
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      const r = await RouteService.create(ctx, { deliveryDate: date });
      toast.success(`Ruta creada #${r.id.slice(0, 8)}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear la ruta");
    } finally { setBusy(null); }
  }

  async function transition(routeId: string, to: RouteStatus) {
    if (!user || !tenantId) return;
    setBusy(routeId);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      await RouteService.setStatus(ctx, routeId, to);
      toast.success(`Ruta → ${routeStatusLabel(to)}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transición rechazada");
    } finally { setBusy(null); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="route-date">Fecha de reparto</Label>
          <Input id="route-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => void createRoute()} disabled={busy === "create"}>
            <Plus className="mr-2 h-4 w-4" />Nueva ruta
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : routes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Truck className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No hay rutas planificadas para esta fecha.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ruta</TableHead>
                <TableHead>Conductor</TableHead>
                <TableHead className="text-right">Paradas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">#{r.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.driverId ? <span className="font-mono text-xs">{r.driverId.slice(0, 8)}</span> : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="h-3 w-3" />{r.stopCount}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant="outline">{routeStatusLabel(r.status)}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/admin/routes/stops" search={{ date, routeId: r.id }}>Paradas</Link>
                      </Button>
                      {nextRouteStatuses(r.status).map((s) => (
                        <Button key={s} size="sm" variant="outline" disabled={busy === r.id}
                          onClick={() => void transition(r.id, s)}>
                          {routeStatusLabel(s)}
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
