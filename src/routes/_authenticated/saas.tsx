import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { assertSaasRoute } from "@/permissions/route-guards";

export const Route = createFileRoute("/_authenticated/saas")({
  beforeLoad: async ({ context }) => {
    const user = (context as { user?: { id: string } }).user;
    if (!user?.id) throw new Error("Missing auth context");
    const roles = await assertSaasRoute(user.id);
    return { roles };
  },
  component: SaasShell,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Platform Governance" },
      {
        name: "description",
        content:
          "Platform administration: tenants, company admins, roles, membership and provisioning audit.",
      },
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
    { to: "/saas", label: "Overview" },
    { to: "/saas/tenants", label: "Tenants" },
    { to: "/saas/company-admin", label: "Company Admins" },
    { to: "/saas/roles", label: "Roles" },
    { to: "/saas/membership", label: "Membership" },
    { to: "/saas/audit", label: "Audit" },
  ] as const;

  return (
    <div className="min-h-screen bg-secondary/40 flex">
      <aside className="hidden lg:flex w-60 shrink-0 bg-card border-r border-border flex-col">
        <div className="p-6 border-b border-border">
          <p className="meta-label">SaaS · Platform</p>
          <p className="font-extrabold tracking-tighter mt-1">YourMeal OS</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/saas" }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 [&.active]:bg-secondary [&.active]:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-1">
          <Link
            to="/admin"
            className="block text-xs text-muted-foreground hover:text-foreground px-3 py-2"
          >
            ← Back to tenant Ops Center
          </Link>
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
