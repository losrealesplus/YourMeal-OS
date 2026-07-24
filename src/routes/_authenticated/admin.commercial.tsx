/**
 * ADMIN · Dashboard Comercial — cada KPI responde una pregunta y justifica una acción.
 * @see docs/20-evidence-framework/09-operational-visibility-principle.md
 */
import { createFileRoute, Link } from "@tanstack/react-router";
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
        content: "Métricas accionables con datos reales de EatClean.",
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
        subtitle="Cada métrica responde una pregunta y sugiere una acción. Datos reales del tenant."
      />
      <AdminHeader
        goal="Decidir qué contactar, promocionar o reforzar hoy"
        capability="customers.read"
        object="Order · Customer · Company"
      />

      {loading || !metrics ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Cargando métricas…
        </p>
      ) : (
        <>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Acciones prioritarias
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <KpiCard
              label="Inactivos (¿recuperar?)"
              value={String(metrics.inactiveCustomers)}
              hint="Acción → campaña / contacto en Atención al Cliente"
              trend={metrics.inactiveCustomers > 0 ? "down" : "flat"}
            />
            <KpiCard
              label="Empresas sin pedidos"
              value={String(metrics.companiesWithoutOrders)}
              hint="Acción → contactar responsable comercial"
              trend={metrics.companiesWithoutOrders > 0 ? "down" : "flat"}
            />
            <KpiCard
              label="Día de menor volumen"
              value={metrics.troughPurchaseDay ?? "—"}
              hint="Acción → promoción o menú especial ese día"
            />
            <KpiCard
              label="Nuevos (¿activar?)"
              value={String(metrics.newCustomers)}
              hint="Acción → onboarding / primer pedido"
              trend={metrics.newCustomers > 0 ? "up" : "flat"}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              to="/admin/support"
              className="h-10 rounded-xl bg-foreground text-background px-4 text-xs font-bold uppercase tracking-widest inline-flex items-center hover:opacity-90"
            >
              Ir a Atención al Cliente
            </Link>
            <Link
              to="/admin/customers"
              className="h-10 rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-widest inline-flex items-center hover:bg-secondary/60"
            >
              Ver directorio
            </Link>
            <Link
              to="/admin/companies"
              className="h-10 rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-widest inline-flex items-center hover:bg-secondary/60"
            >
              Empresas
            </Link>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Contexto (con pregunta)
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <KpiCard
              label="Base total"
              value={String(metrics.totalCustomers)}
              hint="Pregunta → ¿crece la base o solo el ticket?"
            />
            <KpiCard
              label="Activos"
              value={String(metrics.activeCustomers)}
              hint="Pregunta → ¿quién pide de forma sostenida?"
            />
            <KpiCard
              label="Recurrentes"
              value={String(metrics.recurringCustomers)}
              hint="Pregunta → ¿a quién fidelizar primero?"
            />
            <KpiCard
              label="Empresas activas"
              value={String(metrics.activeCompanies)}
              hint="Pregunta → ¿el canal B2B aporta demanda?"
            />
            <KpiCard
              label="Empleados vinculados"
              value={String(metrics.linkedEmployees)}
              hint="Pregunta → ¿el Company Code convierte?"
            />
            <KpiCard
              label="Pedidos (7d)"
              value={String(metrics.weeklyOrders)}
              hint="Pregunta → ¿la semana operativa aguanta?"
            />
            <KpiCard
              label="Pedidos (30d)"
              value={String(metrics.monthlyOrders)}
              hint="Pregunta → ¿tendencia vs semana?"
            />
            <KpiCard
              label="Ticket medio (30d)"
              value={fmt.currency(metrics.averageTicket, { currency: "EUR" })}
              hint="Pregunta → ¿subir ticket o frecuencia?"
            />
            <KpiCard
              label="Frecuencia media"
              value={
                metrics.purchaseFrequencyDays != null
                  ? `${metrics.purchaseFrequencyDays}d`
                  : "—"
              }
              hint="Pregunta → ¿cada cuánto vuelve el cliente?"
            />
            <KpiCard
              label="Día de mayor compra"
              value={metrics.peakPurchaseDay ?? "—"}
              hint="Pregunta → ¿reforzar capacidad ese día?"
            />
            <KpiCard
              label="Hora pico (UTC)"
              value={
                metrics.peakPurchaseHour != null
                  ? `${String(metrics.peakPurchaseHour).padStart(2, "0")}:00`
                  : "—"
              }
              hint="Pregunta → ¿cuándo abrir soporte / cocina?"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            <PanelCard>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-2">
                Menús más vendidos
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Acción → priorizar stock y producción de estos platos.
              </p>
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
            <PanelCard>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-2">
                Top empresas
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Acción → cuidar cuentas; revisar las que no aparecen aquí.
              </p>
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
          </div>

          <PanelCard>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-2">
              Top clientes
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Acción → reconocimiento / retención personalizada vía Atención al
              Cliente.
            </p>
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
        </>
      )}
    </div>
  );
}
