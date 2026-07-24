import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useTranslation } from "react-i18next";
import { AdminHeader, SectionTitle } from "@/components/admin";
import { cn } from "@/lib/utils";

/**
 * ADMIN · Design System (PM-005)
 * Objetivo operacional: Mantener la coherencia visual y de interacción del producto
 * Capability:            platform.designSystem.govern
 * Core Object:           Token · Typography · Icon · State · Component · Motion
 */
export const Route = createFileRoute("/_authenticated/admin/design-system")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "admin.settings");
  },
  component: DesignSystemLayout,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Design System" },
      { name: "description", content: "Sistema de diseño: tokens, tipografía, iconografía, estados, componentes y animaciones." },
    ],
  }),
});

type Tab = { to: string; key: string; fallback: string; exact?: boolean };

const TABS: Tab[] = [
  { to: "/admin/design-system",              key: "ds.tokens",       fallback: "Tokens",       exact: true },
  { to: "/admin/design-system/typography",   key: "ds.typography",   fallback: "Tipografía" },
  { to: "/admin/design-system/iconography",  key: "ds.iconography",  fallback: "Iconografía" },
  { to: "/admin/design-system/states",       key: "ds.states",       fallback: "Estados" },
  { to: "/admin/design-system/components",   key: "ds.components",   fallback: "Componentes" },
  { to: "/admin/design-system/motion",       key: "ds.motion",       fallback: "Animaciones" },
];

function DesignSystemLayout() {
  const { t } = useTranslation("admin");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline={t("designSystem", { defaultValue: "Design System" })}
        title={t("dsHubTitle", { defaultValue: "Stainless industrial precision" })}
        subtitle={t("dsHubSubtitle", { defaultValue: "Fuente única de verdad para tokens, tipografía, iconografía, estados, componentes y animaciones." })}
      />
      <AdminHeader
        goal={t("dsGoal", { defaultValue: "Mantener coherencia visual y de interacción del producto" })}
        capability="platform.designSystem.govern"
        object="Token · Typography · Icon · State · Component · Motion"
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
