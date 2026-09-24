/**
 * Centro de Operaciones — punto de entrada diario.
 * PR-034: qué necesita atención hoy + EP-002A.1.1 departamentos por RBAC.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import {
  Boxes,
  ChefHat,
  ClipboardList,
  LineChart,
  Settings,
  Shield,
  ScrollText,
  Truck,
  Users,
  Wallet,
  LifeBuoy,
  Plus,
  FileText,
  CalendarDays,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { usePilotAdminModuleFlags } from "@/hooks/use-pilot-admin-module-flags";
import { PILOT_ADMIN_MODULE_FLAGS } from "@/lib/pilot-feature-flags";
import {
  departmentsForRoles,
  type OperationsDepartmentId,
} from "@/lib/operations-departments";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { OperationsService } from "@/modules/operations";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SaasOpsEntry } from "@/components/tenant/saas-ops-entry";
import { BootstrapReadinessBanner } from "@/components/tenant/bootstrap-readiness-banner";
import { MonthlyOperationsCalendar } from "@/components/operations/monthly-operations-calendar";
import { UniversalOrderIntakeDrawer } from "@/components/orders/universal-order-intake-drawer";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: OpsCenterHome,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Centro de Operaciones" },
      {
        name: "description",
        content: "Qué necesita atención hoy en la operación.",
      },
    ],
  }),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function greetingForHour(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

function firstName(fullName: string | null | undefined): string | null {
  if (!fullName?.trim()) return null;
  return fullName.trim().split(/\s+/)[0] ?? null;
}

const DEPARTMENT_ICONS: Record<OperationsDepartmentId, LucideIcon> = {
  dashboard: ClipboardList,
  kitchen: ChefHat,
  delivery: Truck,
  stock: Boxes,
  customers: Users,
  support: LifeBuoy,
  commercial: LineChart,
  finance: Wallet,
  administration: Shield,
  settings: Settings,
  audit: ScrollText,
};

type AttentionItem = {
  id: string;
  to: string;
  title: string;
  icon: LucideIcon;
  count: number | null;
  countLabel: (n: number) => string;
  visible: boolean;
};

async function countInventoryAlerts(tenantId: string): Promise<number> {
  const db = supabase as any;
  const { data, error } = await db
    .from("ingredients")
    .select("stock, min_stock")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);
  if (error) throw error;
  const rows = (data ?? []) as { stock: number; min_stock: number }[];
  return rows.filter((r) => Number(r.stock) <= Number(r.min_stock)).length;
}

async function countClientIncidents(tenantId: string): Promise<number> {
  const { count, error } = await supabase
    .from("support_notes")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .in("kind", ["incident", "complaint"])
    .eq("status", "open")
    .is("deleted_at", null);
  if (error) throw error;
  return count ?? 0;
}

function OpsCenterHome() {
  const { t } = useTranslation("admin");
  const { user, tenantId, roles, profile } = useAuth();
  const { can } = useCan();
  const { flags: moduleFlags } = usePilotAdminModuleFlags();
  const [activeTab, setActiveTab] = useState<"hoy" | "planificacion">("hoy");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeDate, setIntakeDate] = useState<string | undefined>(undefined);
  const [calendarKey, setCalendarKey] = useState(0);

  const [kitchenCount, setKitchenCount] = useState<number | null>(null);
  const [deliveryCount, setDeliveryCount] = useState<number | null>(null);
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [clientsCount, setClientsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const date = todayISO();
  const hour = new Date().getHours();
  const name = firstName(profile?.fullName);
  const greeting = greetingForHour(hour);

  const departments = useMemo(
    () =>
      departmentsForRoles(roles, moduleFlags).filter((d) => d.id !== "dashboard"),
    [roles, moduleFlags],
  );

  const showKitchen = useMemo(
    () =>
      can("kitchen.operate") ||
      roles.includes("operations_manager") ||
      roles.includes("company_admin") ||
      can("saas.manage"),
    [can, roles],
  );
  const showDelivery = useMemo(
    () =>
      can("logistics.operate") ||
      roles.includes("operations_manager") ||
      roles.includes("company_admin") ||
      can("saas.manage"),
    [can, roles],
  );
  const showInventory = useMemo(
    () =>
      (can("inventory.operate") ||
        roles.includes("operations_manager") ||
        can("saas.manage")) &&
      moduleFlags[PILOT_ADMIN_MODULE_FLAGS.inventory],
    [can, roles, moduleFlags],
  );
  const showClients = useMemo(
    () =>
      can("customers.read") ||
      can("support.read") ||
      roles.includes("operations_manager") ||
      can("saas.manage"),
    [can, roles],
  );
  const canReadOrders = useMemo(() => can("orders.read"), [can]);
  const canWriteOrders = useMemo(
    () => can("orders.write") || can("orders.manage") || roles.includes("company_admin") || roles.includes("operations_manager"),
    [can, roles],
  );
  const canReadSupport = useMemo(() => can("support.read"), [can]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user || !tenantId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const ctx = await createServiceContext({
          supabase,
          userId: user.id,
          tenantId,
          roles,
        });

        const tasks: Promise<void>[] = [];

        if (showKitchen && canReadOrders) {
          tasks.push(
            OperationsService.kitchenPendingCount(ctx, date).then((n) => {
              if (!cancelled) setKitchenCount(n);
            }),
          );
        }
        if (showDelivery && canReadOrders) {
          tasks.push(
            OperationsService.deliveryPendingCount(ctx, date).then((n) => {
              if (!cancelled) setDeliveryCount(n);
            }),
          );
        }
        if (showInventory) {
          tasks.push(
            countInventoryAlerts(tenantId).then((n) => {
              if (!cancelled) setInventoryCount(n);
            }),
          );
        }
        if (showClients) {
          tasks.push(
            countClientIncidents(tenantId).then((n) => {
              if (!cancelled) setClientsCount(n);
            }),
          );
        }

        await Promise.allSettled(tasks);
      } catch {
        /* per-item nulls stay */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    user,
    tenantId,
    roles,
    date,
    showKitchen,
    showDelivery,
    showInventory,
    showClients,
    canReadOrders,
    calendarKey,
  ]);

  const items: AttentionItem[] = [
    {
      id: "kitchen",
      to: "/admin/kitchen",
      title: "Cocina",
      icon: ChefHat,
      count: kitchenCount,
      countLabel: (n: number) =>
        n === 1 ? "1 pedido pendiente" : `${n} pedidos pendientes`,
      visible: showKitchen,
    },
    {
      id: "delivery",
      to: "/admin/delivery",
      title: "Reparto",
      icon: Truck,
      count: deliveryCount,
      countLabel: (n: number) =>
        n === 1 ? "1 entrega programada" : `${n} entregas programadas`,
      visible: showDelivery,
    },
    {
      id: "inventory",
      to: "/admin/inventory",
      title: "Inventario",
      icon: Boxes,
      count: inventoryCount,
      countLabel: (n: number) => (n === 1 ? "1 alerta" : `${n} alertas`),
      visible: showInventory,
    },
    {
      id: "clients",
      to: canReadSupport ? "/admin/support" : "/admin/customers",
      title: "Clientes",
      icon: Users,
      count: clientsCount,
      countLabel: (n: number) => (n === 1 ? "1 incidencia" : `${n} incidencias`),
      visible: showClients,
    },
  ].filter((i) => i.visible);

  const needsAttention = items.some(
    (i) => typeof i.count === "number" && i.count > 0,
  );

  return (
    <div className="relative mx-auto max-w-5xl space-y-6 animate-fade-in pb-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 -top-8 h-56 bg-[radial-gradient(ellipse_at_top,_oklch(0.96_0.02_85)_0%,_transparent_70%)]"
      />

      <BootstrapReadinessBanner className="relative mb-4" />

      {/* 1. Header & Quick Actions Bar */}
      <header className="relative flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6 pt-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              YourMeal OS
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {new Intl.DateTimeFormat("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </span>
          </div>
          <h1
            className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
            style={{ animation: "ops-home-in 0.45s ease-out both" }}
          >
            {greeting}
            {name ? (
              <>
                , <span className="text-primary">{name}</span>
              </>
            ) : null}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Centro de Operaciones: supervisa el día a día, planifica la demanda y toma acciones inmediatas.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {canWriteOrders && (
            <Button
              onClick={() => {
                setIntakeDate(undefined);
                setIntakeOpen(true);
              }}
              className="gap-1.5 font-bold shadow-sm"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Nuevo Pedido
            </Button>
          )}

          {showKitchen && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/admin/production-sheet" search={{ date }}>
                <FileText className="h-4 w-4" />
                Hoja de Producción
              </Link>
            </Button>
          )}

          {showClients && (
            <Button asChild variant="secondary" size="sm" className="gap-1.5">
              <Link to="/admin/customers">
                <Users className="h-4 w-4" />
                Clientes
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* 2. Main Tab Navigation (Hoy / Planificación Mensual) */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "hoy" | "planificacion")}
        className="space-y-6"
      >
        <div className="flex items-center justify-between border-b border-border/80 pb-2">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="hoy" className="gap-2 font-bold px-4">
              <Activity className="h-4 w-4" />
              Agenda de Hoy
            </TabsTrigger>
            <TabsTrigger value="planificacion" className="gap-2 font-bold px-4">
              <CalendarDays className="h-4 w-4" />
              Planificación Mensual
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: AGENDA DE HOY */}
        <TabsContent value="hoy" className="space-y-8 animate-fade-in">
          <section aria-label="Áreas que necesitan atención">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  Estado Operativo del Día
                </h2>
                <p className="text-xs text-muted-foreground">
                  Resumen de carga en cocina, entregas pendientes y alertas inmediatas.
                </p>
              </div>
              {!loading && !needsAttention && items.length > 0 && (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ Todo al día
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {items.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                  Tu rol no tiene áreas operativas asignadas en este centro.
                </p>
              ) : (
                items.map((item, index) => (
                  <AttentionCard
                    key={item.id}
                    item={item}
                    loading={loading}
                    style={{
                      animation: `ops-home-in 0.4s ease-out ${0.1 + index * 0.05}s both`,
                    }}
                  />
                ))
              )}
            </div>
          </section>

          {departments.length > 0 ? (
            <section className="relative mt-8" aria-label={t("departmentsTitle")}>
              <div className="mb-3">
                <h2 className="text-base font-bold tracking-tight">
                  Espacios de Trabajo
                </h2>
                <p className="text-xs text-muted-foreground">
                  Acceso directo a las consolas especializadas de cada departamento.
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {departments.map((dept) => {
                  const Icon = DEPARTMENT_ICONS[dept.id];
                  const label = t(dept.labelKey as "ops.nav.kitchen");
                  return (
                    <Link
                      key={dept.id}
                      to={dept.path}
                      className="group flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-xs transition-all hover:border-primary/40 hover:bg-muted/30"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("ops.enterWorkspace")}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}
        </TabsContent>

        {/* TAB 2: PLANIFICACIÓN MENSUAL */}
        <TabsContent value="planificacion" className="space-y-4 animate-fade-in">
          <div className="mb-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Planificación Mensual de Operaciones
            </h2>
            <p className="text-xs text-muted-foreground">
              Volumen de raciones, pedidos y clientes programados. Haz clic en cualquier día para crear un pedido o ver su producción.
            </p>
          </div>

          <MonthlyOperationsCalendar
            key={`hub-calendar-${calendarKey}`}
            onSelectDate={(selectedDate) => {
              setIntakeDate(selectedDate);
              setIntakeOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Universal Order Intake Drawer */}
      <UniversalOrderIntakeDrawer
        open={intakeOpen}
        onOpenChange={setIntakeOpen}
        initialDayDate={intakeDate}
        onSuccess={() => {
          setCalendarKey((k) => k + 1);
        }}
      />

      <div className="relative mt-12 flex justify-center pb-2">
        <SaasOpsEntry />
      </div>

      <style>{`
        @keyframes ops-home-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function AttentionCard({
  item,
  loading,
  style,
}: {
  item: AttentionItem;
  loading: boolean;
  style?: CSSProperties;
}) {
  const Icon = item.icon;
  const hasWork = typeof item.count === "number" && item.count > 0;

  return (
    <Link
      to={item.to}
      style={style}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border p-4 transition-all hover:shadow-md",
        hasWork
          ? "border-primary/30 bg-primary/5 hover:border-primary/50"
          : "border-border/80 bg-card hover:border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
            hasWork
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-foreground group-hover:bg-muted",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {hasWork && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
            Activo
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {item.title}
        </p>
        {loading ? (
          <Skeleton className="mt-1.5 h-6 w-24" />
        ) : (
          <p
            className={cn(
              "mt-1 text-base font-extrabold tracking-tight",
              hasWork ? "text-foreground" : "text-muted-foreground/80",
            )}
          >
            {item.count === null ? "0" : item.countLabel(item.count)}
          </p>
        )}
      </div>
    </Link>
  );
}
