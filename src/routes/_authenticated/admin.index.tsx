import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AdminHeader, KpiCard, PanelCard, SectionTitle } from "@/components/admin";
import { MOCK_ADMIN_KPIS, MOCK_TIMELINE } from "@/lib/mock-admin";

/**
 * ADMIN · Dashboard
 * Objetivo operacional: Vista panorámica de la cocina para el turno actual
 * Capability:            operations.overview
 * Core Object:           Tenant + Order + ProductionRun
 * Fuente:                Operational Model — Command Center
 * PRODUCT_RULES.md
 */
export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Panel operacional" },
      { name: "description", content: "Vista panorámica de la cocina para el turno actual." },
    ],
  }),
});

function AdminDashboard() {
  const { t } = useTranslation("admin");

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline={t("operationalOverview")}
        title={t("dashboard")}
        subtitle={t("dashboardSubtitle", { defaultValue: "Estado en vivo de pedidos, cocina, inventario y compras." })}
      />
      <AdminHeader
        goal={t("dashboardGoal", { defaultValue: "Dar visibilidad completa del turno operativo" })}
        capability="operations.overview"
        object="Tenant · Order · ProductionRun"
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4">
        {MOCK_ADMIN_KPIS.map((k) => (
          <KpiCard
            key={k.key}
            label={t(k.key)}
            value={k.value}
            delta={k.delta}
            trend={k.trend}
            hint={t("vsYesterday", { defaultValue: "vs yesterday" })}
          />
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <PanelCard title={t("liveProduction")} action={<span className="text-[10px] font-mono uppercase tracking-widest text-primary">● Live</span>}>
          <ol className="space-y-2">
            {MOCK_TIMELINE.map((item) => (
              <li key={item.hour} className="flex items-center gap-4 py-2">
                <span className="font-mono text-[11px] font-bold w-14 shrink-0 text-muted-foreground">{item.hour}</span>
                <span className="h-6 w-px bg-border" aria-hidden />
                <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
                <span className="font-mono text-xs font-bold tabular-nums">{item.qty}</span>
              </li>
            ))}
          </ol>
        </PanelCard>

        <PanelCard title={t("inventoryAlerts")}>
          <ul className="space-y-3">
            {[
              { name: "Aguacate", need: "12 kg", tone: "warn" as const },
              { name: "Quinoa",   need: "6 kg",  tone: "warn" as const },
              { name: "Salmón",   need: "8 kg",  tone: "danger" as const },
            ].map((a) => (
              <li key={a.name} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={a.tone === "danger" ? "size-2 rounded-full bg-destructive" : "size-2 rounded-full bg-[oklch(0.68_0.16_75)]"} />
                  <span className="font-medium text-sm">{a.name}</span>
                </div>
                <span className="font-mono text-xs font-bold text-muted-foreground">{a.need}</span>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>
    </div>
  );
}
