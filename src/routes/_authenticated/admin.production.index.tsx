/**
 * ADMIN · Producción — Dashboard
 * Capability: production.orchestrate  ·  Core Object: ProductionRun (dish × day)
 * Reads: ProductionReportService.buildForDay (real orders, no simulation).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, ChefHat, Package, Tag, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ProductionReportService,
  kitchenBatchStatusLabel,
  KITCHEN_BATCH_STATUSES,
  type KitchenBatchStatus,
  type ProductionReportModel,
} from "@/modules/operations";
import { cn } from "@/lib/utils";

const ROLES_ALLOWED = ["saas_admin", "company_admin", "operations_manager", "kitchen"];

export const Route = createFileRoute("/_authenticated/admin/production/")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "production.operate");
  },
  component: ProductionDashboardPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Producción" },
      { name: "description", content: "Dashboard de producción del día a partir de pedidos reales." },
    ],
  }),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function ProductionDashboardPage() {
  const { user, tenantId, roles } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [report, setReport] = useState<ProductionReportModel | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      setReport(await ProductionReportService.buildForDay(ctx, { deliveryDate: date }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar la producción");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles, date]);

  useEffect(() => { void load(); }, [load]);

  const statusCounts = useMemo(() => {
    const counts: Record<KitchenBatchStatus, number> = {
      pending: 0, preparing: 0, plating: 0, finished: 0,
    };
    if (!report) return counts;
    for (const b of report.standardDishes) counts[b.batchStatus] += 1;
    return counts;
  }, [report]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="prod-date">Fecha de producción</Label>
          <Input id="prod-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Pedidos en cola" value={report?.totals.orderCount ?? 0} />
            <KpiCard label="Raciones" value={report?.totals.portionCount ?? 0} />
            <KpiCard label="Platos" value={report?.totals.dishCount ?? 0} />
            <KpiCard label="Personalizados" value={report?.totals.customizationCount ?? 0} />
          </div>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Estado de tandas (dish × día)
            </h2>
            <div className="flex flex-wrap gap-2">
              {KITCHEN_BATCH_STATUSES.map((s) => (
                <Badge key={s} variant="outline" className="text-sm">
                  {kitchenBatchStatusLabel(s)} · {statusCounts[s]}
                </Badge>
              ))}
              {report && report.standardDishes.length === 0 ? (
                <span className="text-sm text-muted-foreground">Sin pedidos en cola para esta fecha.</span>
              ) : null}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLink to="/admin/production/batch" icon={ClipboardList} title="Tandas" desc="Avanza el estado de cada plato." />
            <QuickLink to="/admin/production/kitchen" icon={ChefHat} title="Cocina" desc="Pedidos en preparación." />
            <QuickLink to="/admin/production/packaging" icon={Package} title="Packaging" desc="Bolsas por cliente / pedido." />
            <QuickLink to="/admin/production/labels" icon={Tag} title="Etiquetas" desc="Etiquetas por ración." />
          </section>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function QuickLink({
  to, icon: Icon, title, desc,
}: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link to={to} className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}
