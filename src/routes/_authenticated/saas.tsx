import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { signOut } from "@/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { assertSaasRoute } from "@/permissions/route-guards";
import { useAuth } from "@/hooks/use-auth";

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
  const { user, roles } = useAuth();
  const [hasTenantMembership, setHasTenantMembership] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user?.id) {
        if (!cancelled) setHasTenantMembership(false);
        return;
      }
      // Hybrid operators (staff + saas_admin) already have tenant home.
      const staffish = roles.some(
        (r) =>
          r === "company_admin" ||
          r === "operations_manager" ||
          r === "kitchen" ||
          r === "delivery",
      );
      if (staffish) {
        if (!cancelled) setHasTenantMembership(true);
        return;
      }
      const { data } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!cancelled) setHasTenantMembership(Boolean(data?.tenant_id));
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [user?.id, roles]);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await signOut();
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
          {hasTenantMembership ? (
            <Link
              to="/admin"
              className="block text-xs text-muted-foreground hover:text-foreground px-3 py-2"
            >
              ← Back to tenant Ops Center
            </Link>
          ) : null}
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
