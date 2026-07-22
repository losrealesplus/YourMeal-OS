import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AdminHeader, SectionTitle } from "@/components/admin";
import { cn } from "@/lib/utils";

/**
 * ADMIN · Producción (PM-003)
 * Objetivo operacional: Orquestar la producción del turno de principio a fin
 * Capability:            production.orchestrate
 * Core Object:           ProductionRun · Batch · PackagingLine · Label · Station
 *
 * Layout hub — sub-áreas: Planning · Batch · Packaging · Labels · Kitchen.
 */
export const Route = createFileRoute("/_authenticated/admin/production")({
  component: AdminProductionLayout,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Producción" },
      { name: "description", content: "Módulo de producción: planning, tandas, packaging, etiquetas y cocina." },
    ],
  }),
});

type Tab = { to: string; key: string; fallback: string; exact?: boolean };

const TABS: Tab[] = [
  { to: "/admin/production",           key: "production.planning",  fallback: "Planning",  exact: true },
  { to: "/admin/production/batch",     key: "production.batch",     fallback: "Batch" },
  { to: "/admin/production/packaging", key: "production.packaging", fallback: "Packaging" },
  { to: "/admin/production/labels",    key: "production.labels",    fallback: "Labels" },
  { to: "/admin/production/kitchen",   key: "production.kitchen",   fallback: "Kitchen" },
];

function AdminProductionLayout() {
  const { t } = useTranslation("admin");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline={t("production")}
        title={t("productionHubTitle", { defaultValue: "Producción" })}
        subtitle={t("productionHubSubtitle", { defaultValue: "Orquesta cada fase del turno: planificación, cocinado, empaquetado, etiquetado y estaciones." })}
      />
      <AdminHeader
        goal={t("productionGoal", { defaultValue: "Cumplir los pedidos del día con calidad y a tiempo" })}
        capability="production.orchestrate"
        object="ProductionRun · Batch · Label · Station"
      />

      <nav className="mb-6 flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-border">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "shrink-0 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest border-b-2 -mb-px transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t(tab.key, { defaultValue: tab.fallback })}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
