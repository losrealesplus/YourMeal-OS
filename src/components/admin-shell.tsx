/**
 * Admin shell — Centro de Operaciones.
 * Combines main Ops Center chrome with PR-034 Cocina / Reparto navigation.
 */
import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutGrid,
  ClipboardList,
  Users,
  Boxes,
  MoreHorizontal,
  Factory,
  Truck,
  Wallet,
  CalendarDays,
  BookOpen,
  ShoppingCart,
  LifeBuoy,
  Megaphone,
  BarChart3,
  Settings,
  Palette,
  X,
  Building2,
  ChefHat,
  LineChart,
  Shield,
  ScrollText,
  FlaskConical,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { signOut } from "@/auth";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { usePilotAdminModuleFlags } from "@/hooks/use-pilot-admin-module-flags";
import { PILOT_ADMIN_MODULE_FLAGS } from "@/lib/pilot-feature-flags";
import { isOperationsAdmin } from "@/lib/operations-workspaces";
import { TenantBrandScope } from "@/components/tenant/tenant-brand-scope";
import { TenantLogo } from "@/components/tenant/tenant-logo";

type NavItem = {
  to: string;
  labelKey: string;
  icon: typeof LayoutGrid;
  exact?: boolean;
  visible: boolean;
};

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation(["admin", "common"]);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { roles, profile, user } = useAuth();
  const { can } = useCan();
  const [moreOpen, setMoreOpen] = useState(false);

  const admin = isOperationsAdmin(roles);
  const { flags: moduleFlags } = usePilotAdminModuleFlags();
  const showKitchen =
    can("kitchen.operate") ||
    roles.includes("kitchen") ||
    admin;
  const showDelivery =
    can("logistics.operate") ||
    roles.includes("delivery") ||
    roles.includes("logistics") ||
    admin;
  const showAllOps = admin || roles.includes("saas_admin");
  const showAdminMgmt =
    can("customers.read") ||
    can("company.manage") ||
    can("admin.settings") ||
    admin;

  const primary: NavItem[] = [
    {
      to: "/admin",
      labelKey: "ops.nav.operations",
      icon: LayoutGrid,
      exact: true,
      visible: true,
    },
    {
      to: "/admin/kitchen",
      labelKey: "ops.nav.kitchen",
      icon: ChefHat,
      visible: showKitchen,
    },
    {
      to: "/admin/delivery",
      labelKey: "ops.nav.delivery",
      icon: Truck,
      visible: showDelivery,
    },
    {
      to: "/admin/orders",
      labelKey: "ops.nav.orders",
      icon: ClipboardList,
      visible: can("orders.read") || showAllOps,
    },
    {
      to: "/admin/customers",
      labelKey: "ops.nav.customers",
      icon: Users,
      visible: can("customers.read") || showAllOps,
    },
    {
      to: "/admin/inventory",
      labelKey: "ops.nav.inventory",
      icon: Boxes,
      visible:
        (can("inventory.operate") || showAllOps) &&
        moduleFlags[PILOT_ADMIN_MODULE_FLAGS.inventory],
    },
  ].filter((i) => i.visible);

  const moreItems: NavItem[] = [
    {
      to: "/admin/customer-workspace",
      labelKey: "ops.nav.customerWorkspace",
      icon: FlaskConical,
      visible: can("customers.read") || showAllOps,
    },
    {
      to: "/admin/order-workspace",
      labelKey: "ops.nav.orderWorkspace",
      icon: ClipboardList,
      visible: can("orders.read") || showAllOps,
    },
    {
      to: "/admin/production-workspace",
      labelKey: "ops.nav.productionWorkspace",
      icon: FlaskConical,
      visible: can("kitchen.operate") || showAllOps,
    },
    {
      to: "/admin/commercial",
      labelKey: "commercial",
      icon: LineChart,
      visible: showAdminMgmt,
    },
    {
      to: "/admin/companies",
      labelKey: "ops.nav.companyClients",
      icon: Building2,
      visible: can("company.manage") || admin,
    },
    {
      to: "/admin/support",
      labelKey: "support",
      icon: LifeBuoy,
      visible: can("support.read") || showAllOps,
    },
    {
      to: "/admin/users",
      labelKey: "users",
      icon: Shield,
      visible: admin,
    },
    {
      to: "/admin/branding",
      labelKey: "branding",
      icon: Palette,
      visible: can("brand.manage") || admin,
    },
    {
      to: "/admin/audit",
      labelKey: "audit",
      icon: ScrollText,
      visible: admin,
    },
    {
      to: "/admin/routes",
      labelKey: "routes",
      icon: Truck,
      visible:
        (can("logistics.operate") || showAllOps) &&
        moduleFlags[PILOT_ADMIN_MODULE_FLAGS.routes],
    },
    {
      to: "/admin/menus",
      labelKey: "menus",
      icon: CalendarDays,
      // OP-001: dishes/menus are bootstrap-critical — no FF gate.
      visible: can("menus.read") || showAllOps,
    },
    {
      to: "/admin/dishes",
      labelKey: "dishes",
      icon: BookOpen,
      visible: can("dishes.read") || showAllOps,
    },
    {
      to: "/admin/purchasing",
      labelKey: "purchasing",
      icon: ShoppingCart,
      visible:
        (can("purchasing.operate") || showAllOps) &&
        moduleFlags[PILOT_ADMIN_MODULE_FLAGS.purchasing],
    },
    {
      to: "/admin/accounting",
      labelKey: "accounting",
      icon: Wallet,
      visible:
        (can("accounting.operate") || showAllOps) &&
        moduleFlags[PILOT_ADMIN_MODULE_FLAGS.accounting],
    },
    {
      to: "/admin/reports",
      labelKey: "reports",
      icon: BarChart3,
      visible: showAllOps && moduleFlags[PILOT_ADMIN_MODULE_FLAGS.reports],
    },
    {
      to: "/admin/promotions",
      labelKey: "promotions",
      icon: Megaphone,
      visible: showAllOps && moduleFlags[PILOT_ADMIN_MODULE_FLAGS.promotions],
    },
    {
      to: "/admin/production",
      labelKey: "production",
      icon: Factory,
      visible:
        (can("production.operate") || showAllOps) &&
        moduleFlags[PILOT_ADMIN_MODULE_FLAGS.production],
    },
    {
      to: "/admin/settings",
      labelKey: "settings",
      icon: Settings,
      visible: can("admin.settings") || admin,
    },
    {
      to: "/admin/design-system",
      labelKey: "designSystem",
      icon: Palette,
      visible: admin && moduleFlags[PILOT_ADMIN_MODULE_FLAGS.designSystem],
    },
  ].filter((i) => i.visible);

  const firstName =
    profile?.fullName?.trim().split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    "";

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  function isActive(to: string, exact?: boolean) {
    if (exact) return pathname === to || pathname === `${to}/`;
    if (to === "/admin") return pathname === "/admin" || pathname === "/admin/";
    return pathname === to || pathname.startsWith(`${to}/`);
  }

  function NavLink({ item, dense }: { item: NavItem; dense?: boolean }) {
    const active = isActive(item.to, item.exact);
    const Icon = item.icon;
    const label = t(`admin:${item.labelKey}` as "admin:ops.nav.operations", {
      defaultValue:
        item.labelKey === "ops.nav.kitchen"
          ? "Cocina"
          : item.labelKey === "ops.nav.delivery"
            ? "Reparto"
            : item.labelKey === "ops.nav.customerWorkspace"
              ? "Customer Workspace"
              : item.labelKey === "ops.nav.orderWorkspace"
                ? "Order Workspace"
                : item.labelKey === "ops.nav.productionWorkspace"
                  ? "Production Workspace"
              : item.labelKey === "ops.nav.companyClients"
              ? "Clientes Empresa"
              : item.labelKey === "commercial"
                ? "Dashboard Comercial"
                : item.labelKey === "users"
                  ? "Usuarios"
                  : item.labelKey === "branding"
                    ? "Branding"
                    : item.labelKey === "audit"
                      ? "Auditoría"
                      : item.labelKey === "support"
                        ? "Atención al Cliente"
                        : undefined,
    });
    return (
      <Link
        to={item.to}
        onClick={() => setMoreOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-xl text-sm font-medium transition-colors",
          dense ? "px-3 py-2.5" : "px-3 py-2",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        <span>{label}</span>
      </Link>
    );
  }

  // Mobile: Operaciones + up to 3 workspaces + Más
  const mobilePrimary = primary.slice(0, 4);

  return (
    <TenantBrandScope className="min-h-screen bg-[color:var(--tenant-cream,#F7F5F1)] font-[family-name:var(--font-tenant-body,Open_Sans,sans-serif)] text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border/70 bg-card/90 lg:flex">
          <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-5">
            <TenantLogo height={36} />
            <div>
              <p className="font-display text-sm font-bold tracking-tight text-foreground">
                {t("admin:ops.shellTitle")}
              </p>
              {firstName ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("admin:ops.shellHello", { name: firstName })}
                </p>
              ) : null}
            </div>
          </div>

          <nav
            className="flex-1 space-y-1 overflow-y-auto p-3"
            aria-label={t("admin:ops.shellTitle")}
          >
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Operaciones
            </p>
            {primary.map((item) => (
              <NavLink key={`${item.to}-${item.labelKey}`} item={item} />
            ))}
            {moreItems.length > 0 && (
              <div className="my-3 border-t border-border/60 pt-3">
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("admin:ops.nav.more")}
                </p>
                {moreItems.map((item) => (
                  <NavLink
                    key={`${item.to}-${item.labelKey}`}
                    item={item}
                    dense
                  />
                ))}
              </div>
            )}
          </nav>

          <div className="border-t border-border/70 p-3">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t("admin:ops.teamLabel")}
              </p>
              <p className="mt-1 text-xs font-semibold text-foreground">
                {t("common:tenant")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 w-full rounded-lg px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
            >
              {t("common:signOut")}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
          <header className="flex h-14 items-center justify-between border-b border-border/70 bg-card/80 px-4 backdrop-blur-sm lg:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <TenantLogo height={28} />
              <span className="font-display text-sm font-bold">
                {t("admin:ops.shellTitle")}
              </span>
            </div>
            <h2 className="hidden text-sm font-semibold tracking-tight text-foreground lg:block">
              {t("admin:ops.headerToday")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("admin:ops.headerFocus")}
            </p>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-md lg:hidden"
        aria-label={t("admin:ops.shellTitle")}
      >
        <ul
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${mobilePrimary.length + 1}, minmax(0, 1fr))`,
          }}
        >
          {mobilePrimary.map((item) => {
            const active = isActive(item.to, item.exact);
            const Icon = item.icon;
            return (
              <li key={`m-${item.to}-${item.labelKey}`}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  <span className="truncate">
                    {t(`admin:${item.labelKey}` as "admin:ops.nav.operations", {
                      defaultValue:
                        item.labelKey === "ops.nav.kitchen"
                          ? "Cocina"
                          : item.labelKey === "ops.nav.delivery"
                            ? "Reparto"
                            : undefined,
                    })}
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={cn(
                "flex w-full flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold",
                moreOpen ? "text-primary" : "text-muted-foreground",
              )}
            >
              <MoreHorizontal className="size-5" strokeWidth={1.75} aria-hidden />
              <span>{t("admin:ops.nav.more")}</span>
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/30"
            aria-label={t("admin:ops.closeMore")}
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-base font-semibold">
                {t("admin:ops.nav.more")}
              </p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="space-y-1">
              {primary
                .slice(mobilePrimary.length)
                .concat(moreItems)
                .map((item) => (
                  <NavLink
                    key={`sheet-${item.to}-${item.labelKey}`}
                    item={item}
                    dense
                  />
                ))}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 w-full rounded-xl border border-border px-3 py-2.5 text-left text-sm text-muted-foreground"
            >
              {t("common:signOut")}
            </button>
          </div>
        </div>
      ) : null}
    </TenantBrandScope>
  );
}
