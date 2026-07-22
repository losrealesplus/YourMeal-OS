import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  LifeBuoy,
  CalendarDays,
  BookOpen,
  Factory,
  ShoppingCart,
  Boxes,
  Truck,
  Wallet,
  BarChart3,
  Megaphone,
  Settings,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation(["admin", "common"]);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const items = [
    { to: "/admin", label: t("admin:dashboard"), icon: LayoutDashboard, exact: true },
    { to: "/admin/customers", label: t("admin:customers"), icon: Users, exact: false },
    { to: "/admin/support", label: t("admin:support"), icon: LifeBuoy, exact: false },
    { to: "/admin/menus", label: t("admin:menus"), icon: CalendarDays, exact: false },
    { to: "/admin/dishes", label: t("admin:dishes"), icon: BookOpen, exact: false },
    { to: "/admin/production", label: t("admin:production"), icon: Factory, exact: false },
    { to: "/admin/purchasing", label: t("admin:purchasing"), icon: ShoppingCart, exact: false },
    { to: "/admin/inventory", label: t("admin:inventory"), icon: Boxes, exact: false },
    { to: "/admin/routes", label: t("admin:routes"), icon: Truck, exact: false },
    { to: "/admin/accounting", label: t("admin:accounting"), icon: Wallet, exact: false },
    { to: "/admin/reports", label: t("admin:reports"), icon: BarChart3, exact: false },
    { to: "/admin/promotions", label: t("admin:promotions"), icon: Megaphone, exact: false },
    { to: "/admin/design-system", label: t("admin:designSystem", { defaultValue: "Design System" }), icon: Palette, exact: false },
    { to: "/admin/settings", label: t("admin:settings"), icon: Settings, exact: false },
  ] as const;

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-secondary/40 flex">
      <aside className="hidden lg:flex w-60 shrink-0 bg-card border-r border-border flex-col">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <div className="size-6 bg-foreground rounded" />
          <span className="font-extrabold tracking-tighter">YourMeal OS</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60",
                )}
              >
                {active && <span className="size-1.5 rounded-full bg-primary" />}
                <Icon className={cn("size-4", !active && "shrink-0")} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="bg-secondary/60 p-3 rounded-lg border border-border">
            <p className="meta-label mb-1">{t("admin:currentTenant")}</p>
            <p className="text-[11px] font-bold">{t("common:tenant")}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground text-left px-3 py-2"
          >
            {t("common:signOut")}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b border-border px-4 lg:px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight">
            {t("admin:operationalOverview")}
          </h2>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              {t("common:systemOptimal")}
            </span>
            <div className="size-8 bg-secondary rounded-lg" />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
