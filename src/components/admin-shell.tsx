import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  ChefHat,
  Truck,
  Boxes,
  ClipboardList,
  MoreHorizontal,
  Building2,
  Settings,
  Palette,
  CalendarDays,
  BookOpen,
  Factory,
  ShoppingCart,
  Wallet,
  BarChart3,
  Megaphone,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { useState } from "react";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  visible: boolean;
};

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation(["admin", "common"]);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { roles } = useAuth();
  const { can } = useCan();
  const [moreOpen, setMoreOpen] = useState(false);

  const isOpsManager =
    roles.includes("operations_manager") ||
    roles.includes("saas_admin") ||
    roles.includes("company_admin");
  const showKitchen =
    can("kitchen.operate") || roles.includes("kitchen") || isOpsManager;
  const showDelivery =
    can("logistics.operate") ||
    roles.includes("delivery") ||
    roles.includes("logistics") ||
    isOpsManager;
  const showAllOps = isOpsManager || roles.includes("saas_admin");

  const primaryOps: NavItem[] = [
    {
      to: "/admin",
      label: "Operaciones",
      icon: LayoutDashboard,
      exact: true,
      visible: true,
    },
    {
      to: "/admin/kitchen",
      label: "Cocina",
      icon: ChefHat,
      visible: showKitchen,
    },
    {
      to: "/admin/delivery",
      label: "Reparto",
      icon: Truck,
      visible: showDelivery,
    },
    {
      to: "/admin/orders",
      label: "Pedidos",
      icon: ClipboardList,
      visible: can("orders.read") || showAllOps,
    },
    {
      to: "/admin/customers",
      label: t("admin:customers"),
      icon: Users,
      visible: can("customers.read") || showAllOps,
    },
    {
      to: "/admin/inventory",
      label: t("admin:inventory"),
      icon: Boxes,
      visible: can("inventory.operate") || showAllOps,
    },
  ];

  const moreItems: NavItem[] = [
    {
      to: "/admin/companies",
      label: "Clientes Empresa",
      icon: Building2,
      visible: can("company.manage"),
    },
    {
      to: "/admin/menus",
      label: t("admin:menus"),
      icon: CalendarDays,
      visible: can("menus.read") || showAllOps,
    },
    {
      to: "/admin/dishes",
      label: t("admin:dishes"),
      icon: BookOpen,
      visible: can("dishes.read") || showAllOps,
    },
    {
      to: "/admin/production",
      label: t("admin:production"),
      icon: Factory,
      visible: can("production.operate") || showAllOps,
    },
    {
      to: "/admin/purchasing",
      label: t("admin:purchasing"),
      icon: ShoppingCart,
      visible: can("purchasing.operate") || showAllOps,
    },
    {
      to: "/admin/routes",
      label: t("admin:routes"),
      icon: Truck,
      visible: can("logistics.operate") || showAllOps,
    },
    {
      to: "/admin/support",
      label: t("admin:support"),
      icon: LifeBuoy,
      visible: can("support.read") || showAllOps,
    },
    {
      to: "/admin/accounting",
      label: t("admin:accounting"),
      icon: Wallet,
      visible: can("accounting.operate") || showAllOps,
    },
    {
      to: "/admin/reports",
      label: t("admin:reports"),
      icon: BarChart3,
      visible: showAllOps,
    },
    {
      to: "/admin/promotions",
      label: t("admin:promotions"),
      icon: Megaphone,
      visible: showAllOps,
    },
    {
      to: "/admin/design-system",
      label: "Design System",
      icon: Palette,
      visible: showAllOps,
    },
    {
      to: "/admin/settings",
      label: t("admin:settings"),
      icon: Settings,
      visible: can("admin.settings"),
    },
  ];

  const visiblePrimary = primaryOps.filter((i) => i.visible);
  const visibleMore = moreItems.filter((i) => i.visible);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = item.exact
      ? pathname === item.to
      : pathname === item.to || pathname.startsWith(`${item.to}/`);
    const Icon = item.icon;
    return (
      <Link
        to={item.to}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
          active
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary/60",
        )}
      >
        {active && <span className="size-1.5 rounded-full bg-primary" />}
        <Icon className={cn("size-4", !active && "shrink-0")} />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/40 flex">
      <aside className="hidden lg:flex w-60 shrink-0 bg-card border-r border-border flex-col">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <div className="size-6 bg-foreground rounded" />
          <span className="font-extrabold tracking-tighter">YourMeal OS</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Operaciones
          </p>
          {visiblePrimary.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}

          {visibleMore.length > 0 && (
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60"
              >
                <MoreHorizontal className="size-4" />
                <span>Más</span>
              </button>
              {moreOpen && (
                <div className="mt-1 space-y-1 border-l border-border ml-4 pl-1">
                  {visibleMore.map((item) => (
                    <NavLink key={item.to} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}
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
            Centro de Operaciones
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
