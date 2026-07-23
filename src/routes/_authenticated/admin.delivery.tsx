/**
 * Workspace Reparto — pedidos listos / en ruta / incidencia.
 * PR-034 · Operations Workspace Activation
 */
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Truck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationalTimeline } from "@/components/operations/operational-timeline";
import { SectionTitle } from "@/components/admin";
import {
  OperationsService,
  deliveryNextStatuses,
  operationalStatusLabel,
  type OperationalOrderListItem,
  type OperationalStatus,
} from "@/modules/operations";

export const Route = createFileRoute("/_authenticated/admin/delivery")({
  beforeLoad: ({ context }) => {
    const roles = (context as { roles?: string[] }).roles ?? [];
    const allowed =
      roles.includes("saas_admin") ||
      roles.includes("operations_manager") ||
      roles.includes("delivery") ||
      roles.includes("logistics") ||
      roles.includes("driver");
    if (!allowed) {
      throw redirect({ to: "/admin" });
    }
  },
  component: DeliveryWorkspacePage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Reparto" },
      {
        name: "description",
        content: "Pedidos listos y en ruta (piloto EatClean).",
      },
    ],
  }),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function DeliveryWorkspacePage() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const [date, setDate] = useState(todayISO());
  const [companyId, setCompanyId] = useState<string>("all");
  const [deliveryGroupId, setDeliveryGroupId] = useState<string>("all");
  const [routeFilter, setRouteFilter] = useState<string>("all");
  const [orders, setOrders] = useState<OperationalOrderListItem[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OperationalOrderListItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadFilters = useCallback(async () => {
    const db = supabase as any;
    const [cRes, gRes] = await Promise.all([
      db.from("companies").select("id, name").is("deleted_at", null).order("name"),
      db
        .from("delivery_groups")
        .select("id, name")
        .is("deleted_at", null)
        .order("name"),
    ]);
    setCompanies((cRes.data as { id: string; name: string }[]) ?? []);
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
      const rows = await OperationsService.listDeliveryOrders(ctx, {
        deliveryDate: date,
        companyId: companyId === "all" ? null : companyId,
        deliveryGroupId: deliveryGroupId === "all" ? null : deliveryGroupId,
      });
      setOrders(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar reparto");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles, date, companyId, deliveryGroupId]);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    void load();
  }, [load]);

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
      await OperationsService.transitionDelivery(ctx, order.id, next);
      toast.success(`Pedido → ${operationalStatusLabel(next)}`);
      setDetail(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transición rechazada");
    } finally {
      setBusyId(null);
    }
  }

  if (!can("logistics.operate")) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No tienes permiso de reparto.{" "}
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
          title="Reparto"
          subtitle="Pedidos listos y en ruta. Sin optimización ni GPS — solo operación del día."
        />
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="delivery-date">Fecha</Label>
          <Input
            id="delivery-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Empresa</Label>
          <Select value={companyId} onValueChange={setCompanyId}>
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
        <div className="space-y-1.5">
          <Label>Ruta</Label>
          <Select value={routeFilter} onValueChange={setRouteFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Cuando exista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas (sin rutas aún)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Filtro de ruta cuando existan rutas operativas. Fuera de PR-034:
            optimización / mapas.
          </p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Truck className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No hay pedidos listos / en reparto para estos filtros.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Delivery Group</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Día</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">
                    {o.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-sm">{o.companyName ?? "—"}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm">
                    {o.siteAddress ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{o.siteName ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {o.deliveryGroupName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {o.customerName ?? "—"}
                    {o.customerEmail ? (
                      <span className="block text-xs text-muted-foreground">
                        {o.customerEmail}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {o.deliveryDates.join(", ") || date}
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

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Pedido {detail.id.slice(0, 8)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <dl className="grid grid-cols-2 gap-2">
                  <div>
                    <dt className="text-muted-foreground">Empresa</dt>
                    <dd>{detail.companyName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Sede</dt>
                    <dd>{detail.siteName ?? "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Dirección</dt>
                    <dd>{detail.siteAddress ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Delivery Group</dt>
                    <dd>{detail.deliveryGroupName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Contacto</dt>
                    <dd>
                      {detail.customerName ?? "—"}
                      {detail.customerEmail ? ` · ${detail.customerEmail}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Día previsto</dt>
                    <dd>{detail.deliveryDates.join(", ") || date}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Estado</dt>
                    <dd>
                      <Badge className="mt-1">
                        {operationalStatusLabel(detail.status)}
                      </Badge>
                    </dd>
                  </div>
                  {detail.notes && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Observaciones</dt>
                      <dd>{detail.notes}</dd>
                    </div>
                  )}
                </dl>

                <OperationalTimeline status={detail.status} />

                <div className="flex flex-wrap gap-2">
                  {deliveryNextStatuses(detail.status).map((next) => (
                    <Button
                      key={next}
                      size="sm"
                      variant={next === "delivery_issue" ? "destructive" : "default"}
                      disabled={busyId === detail.id}
                      onClick={() => void advance(detail, next)}
                    >
                      → {operationalStatusLabel(next)}
                    </Button>
                  ))}
                  {deliveryNextStatuses(detail.status).length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Pedido cerrado o sin transiciones de reparto.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
