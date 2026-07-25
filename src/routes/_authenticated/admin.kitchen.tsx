/**
 * Workspace Cocina — pedidos reales, filtros y transición de estado.
 * PR-034 · Operations Workspace Activation
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useState } from "react";
import { ChefHat, RefreshCw } from "lucide-react";
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
import { BootstrapReadinessBanner } from "@/components/tenant/bootstrap-readiness-banner";
import {
  OperationsService,
  kitchenNextStatuses,
  operationalStatusLabel,
  type OperationalOrderListItem,
  type OperationalStatus,
} from "@/modules/operations";

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

function KitchenWorkspacePage() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
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
                <TableRow key={o.id}>
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
                  {detail.notes && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Observaciones</dt>
                      <dd>{detail.notes}</dd>
                    </div>
                  )}
                </dl>

                <div>
                  <p className="mb-2 font-medium">Platos</p>
                  <ul className="space-y-1 rounded-md border p-3">
                    {detail.items.map((it) => (
                      <li key={it.id} className="flex justify-between gap-2">
                        <span>
                          {it.dishName ?? "Plato"}
                          <span className="block text-xs text-muted-foreground">
                            {it.dayDate}
                            {it.notes ? ` · ${it.notes}` : ""}
                          </span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          ×{it.qty}
                        </span>
                      </li>
                    ))}
                    {detail.items.length === 0 && (
                      <li className="text-muted-foreground">Sin ítems</li>
                    )}
                  </ul>
                </div>

                <OperationalTimeline status={detail.status} />

                <div className="flex flex-wrap gap-2">
                  {kitchenNextStatuses(detail.status).map((next) => (
                    <Button
                      key={next}
                      size="sm"
                      disabled={busyId === detail.id}
                      onClick={() => void advance(detail, next)}
                    >
                      → {operationalStatusLabel(next)}
                    </Button>
                  ))}
                  {kitchenNextStatuses(detail.status).length === 0 && (
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
    </div>
  );
}
