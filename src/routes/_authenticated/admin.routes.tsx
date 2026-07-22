import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AdminHeader, SectionTitle } from "@/components/admin";
import { cn } from "@/lib/utils";

/**
 * ADMIN · Delivery (PM-004)
 * Objetivo operacional: Entregar los pedidos del día en su ventana horaria
 * Capability:            delivery.orchestrate
 * Core Object:           Route · Stop · Delivery · DeliveryAttempt · Incident
 *
 * Layout hub — sub-áreas: Route · Stops · Deliveries · Attempt · Incidencias.
 */
export const Route = createFileRoute("/_authenticated/admin/routes")({
  component: AdminDeliveryLayout,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Delivery" },
      { name: "description", content: "Módulo de delivery: rutas, paradas, entregas, intentos e incidencias." },
    ],
  }),
});

type Tab = { to: string; key: string; fallback: string; exact?: boolean };

const TABS: Tab[] = [
  { to: "/admin/routes",             key: "delivery.route",       fallback: "Route",       exact: true },
  { to: "/admin/routes/stops",       key: "delivery.stops",       fallback: "Stops"       },
  { to: "/admin/routes/deliveries",  key: "delivery.deliveries",  fallback: "Deliveries"  },
  { to: "/admin/routes/attempt",     key: "delivery.attempt",     fallback: "Attempt"     },
  { to: "/admin/routes/incidents",   key: "delivery.incidents",   fallback: "Incidencias" },
];

function AdminDeliveryLayout() {
  const { t } = useTranslation("admin");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline={t("routes")}
        title={t("deliveryHubTitle", { defaultValue: "Delivery" })}
        subtitle={t("deliveryHubSubtitle", { defaultValue: "Orquesta la última milla: rutas, paradas, entregas, intentos e incidencias." })}
      />
      <AdminHeader
        goal={t("deliveryGoal", { defaultValue: "Entregar cada pedido en su ventana horaria" })}
        capability="delivery.orchestrate"
        object="Route · Stop · Delivery · DeliveryAttempt · Incident"
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
