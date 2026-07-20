import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/saas")({
  component: SaasShell,
  head: () => ({
    meta: [
      { title: "YourMeal OS — SaaS Admin" },
      { name: "description", content: "Platform administration for YourMeal OS." },
    ],
  }),
});

function SaasShell() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const items = [
    { to: "/saas", label: "Companies", exact: true },
    { to: "/saas/licenses", label: "Licenses", exact: false },
    { to: "/saas/domains", label: "Domains", exact: false },
    { to: "/saas/branding", label: "Branding", exact: false },
    { to: "/saas/analytics", label: "Analytics", exact: false },
    { to: "/saas/settings", label: "Global Settings", exact: false },
  ] as const;

  return (
    <div className="min-h-screen bg-secondary/40 flex">
      <aside className="hidden lg:flex w-60 shrink-0 bg-card border-r border-border flex-col">
        <div className="p-6 border-b border-border">
          <p className="meta-label">SaaS</p>
          <p className="font-extrabold tracking-tighter mt-1">YourMeal OS</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={handleSignOut}
            className="w-full text-xs text-muted-foreground hover:text-foreground text-left px-3 py-2"
          >
            {t("signOut")}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
