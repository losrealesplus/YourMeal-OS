/**
 * ADMIN · Dashboard Comercial — métricas de negocio con datos reales.
 * No es el Centro de Operaciones (atención del día); responde preguntas comerciales.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AdminHeader,
  KpiCard,
  PanelCard,
  SectionTitle,
} from "@/components/admin";
import { useFmt } from "@/i18n/localization-provider";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import {
  CustomerDirectoryService,
  type CommercialDashboardMetrics,
} from "@/modules/customer-directory";

export const Route = createFileRoute("/_authenticated/admin/commercial")({
  component: AdminCommercialPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Dashboard Comercial" },
      {
        name: "description",
        content: "Métricas comerciales reales de EatClean.",
      },
    ],
  }),
});

function AdminCommercialPage() {
  const fmt = useFmt();
  const { user, tenantId, roles } = useAuth();
  const [metrics, setMetrics] = useState<CommercialDashboardMetrics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !tenantId) return;
      setLoading(true);
      try {
        const ctx = await createServiceContext({
          supabase,
          userId: user.id,
          tenantId,
          roles,
        });
        const data = await CustomerDirectoryService.commercialDashboard(ctx);
        if (!cancelled) setMetrics(data);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, tenantId, roles]);

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline="Administración"
        title="Dashboard Comercial"
        subtitle="Preguntas de negocio respondidas con pedidos, clientes y empresas reales."
      />
      <AdminHeader
        goal="Entender la demanda comercial del tenant"
        capability="customers.read"
        object="Order · Customer · Company"
      />

      {loading || !metrics ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Cargando métricas…
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <KpiCard label="Clientes totales" value={String(metrics.totalCustomers)} />
            <KpiCard label="Clientes activos" value={String(metrics.activeCustomers)} />
            <KpiCard label="Clientes nuevos" value={String(metrics.newCustomers)} />
            <KpiCard label="Inactivos" value={String(metrics.inactiveCustomers)} />
            <KpiCard label="Empresas" value={String(metrics.companies)} />
            <KpiCard label="Empresas activas" value={String(metrics.activeCompanies)} />
            <KpiCard label="Empleados vinculados" value={String(metrics.linkedEmployees)} />
            <KpiCard label="Recurrentes" value={String(metrics.recurringCustomers)} />
            <KpiCard label="Pedidos (7d)" value={String(metrics.weeklyOrders)} />
            <KpiCard label="Pedidos (30d)" value={String(metrics.monthlyOrders)} />
            <KpiCard
              label="Ticket medio (30d)"
              value={fmt.currency(metrics.averageTicket, { currency: "EUR" })}
            />
            <KpiCard
              label="Frecuencia media"
              value={
                metrics.purchaseFrequencyDays != null
                  ? `${metrics.purchaseFrequencyDays}d`
                  : "—"
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            <PanelCard>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-3">
                Pico de compra
              </h3>
              <p className="text-sm text-muted-foreground">
                Día de mayor compra:{" "}
                <span className="font-semibold text-foreground">
                  {metrics.peakPurchaseDay ?? "Sin datos"}
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Hora de mayor compra (UTC):{" "}
                <span className="font-semibold text-foreground">
                  {metrics.peakPurchaseHour != null
                    ? `${String(metrics.peakPurchaseHour).padStart(2, "0")}:00`
                    : "Sin datos"}
                </span>
              </p>
            </PanelCard>
            <PanelCard>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-3">
                Menús más vendidos
              </h3>
              {metrics.topMenus.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin pedidos aún.</p>
              ) : (
                <ul className="space-y-2">
                  {metrics.topMenus.map((m) => (
                    <li
                      key={m.name}
                      className="flex justify-between text-sm gap-4"
                    >
                      <span className="truncate">{m.name}</span>
                      <span className="font-mono tabular-nums shrink-0">
                        {m.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PanelCard>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-3">
                Top empresas
              </h3>
              {metrics.topCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin empresas.</p>
              ) : (
                <ul className="space-y-2">
                  {metrics.topCompanies.map((c) => (
                    <li
                      key={c.id}
                      className="flex justify-between text-sm gap-4"
                    >
                      <span className="truncate">
                        {c.name}{" "}
                        <span className="text-muted-foreground">
                          ({c.orderCount} ped.)
                        </span>
                      </span>
                      <span className="font-mono tabular-nums shrink-0">
                        {fmt.currency(c.total, { currency: "EUR" })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
            <PanelCard>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-3">
                Top clientes
              </h3>
              {metrics.topCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin clientes.</p>
              ) : (
                <ul className="space-y-2">
                  {metrics.topCustomers.map((c) => (
                    <li
                      key={c.id}
                      className="flex justify-between text-sm gap-4"
                    >
                      <span className="truncate">
                        {c.name}{" "}
                        <span className="text-muted-foreground">
                          ({c.orderCount} ped.)
                        </span>
                      </span>
                      <span className="font-mono tabular-nums shrink-0">
                        {fmt.currency(c.total, { currency: "EUR" })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
          </div>
        </>
      )}
    </div>
  );
}
