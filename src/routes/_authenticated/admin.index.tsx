/**
 * Centro de Operaciones — punto de entrada diario.
 * PR-034: qué necesita atención hoy (trabajo operativo, no dashboard KPI).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import {
  Boxes,
  ChefHat,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { usePilotAdminModuleFlags } from "@/hooks/use-pilot-admin-module-flags";
import { PILOT_ADMIN_MODULE_FLAGS } from "@/lib/pilot-feature-flags";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { OperationsService } from "@/modules/operations";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
    .in("kind", ["incident", "complaint"]);
  if (error) throw error;
  return count ?? 0;
}

function OpsCenterHome() {
  const { user, tenantId, roles, profile } = useAuth();
  const { can } = useCan();
  const { flags: moduleFlags } = usePilotAdminModuleFlags();
  const [kitchenCount, setKitchenCount] = useState<number | null>(null);
  const [deliveryCount, setDeliveryCount] = useState<number | null>(null);
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [clientsCount, setClientsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const date = todayISO();
  const hour = new Date().getHours();
  const name = firstName(profile?.fullName);
  const greeting = greetingForHour(hour);

  const showKitchen =
    can("kitchen.operate") ||
    roles.includes("operations_manager") ||
    roles.includes("company_admin") ||
    can("saas.manage");
  const showDelivery =
    can("logistics.operate") ||
    roles.includes("operations_manager") ||
    can("saas.manage");
  const showInventory =
    (can("inventory.operate") ||
      roles.includes("operations_manager") ||
      can("saas.manage")) &&
    moduleFlags[PILOT_ADMIN_MODULE_FLAGS.inventory];
  const showClients =
    can("customers.read") ||
    can("support.read") ||
    roles.includes("operations_manager") ||
    can("saas.manage");

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

        if (showKitchen && can("orders.read")) {
          tasks.push(
            OperationsService.kitchenPendingCount(ctx, date).then((n) => {
              if (!cancelled) setKitchenCount(n);
            }),
          );
        }
        if (showDelivery && can("orders.read")) {
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
    can,
    date,
    showKitchen,
    showDelivery,
    showInventory,
    showClients,
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
      to: can("support.read") ? "/admin/support" : "/admin/customers",
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
    <div className="relative mx-auto max-w-2xl animate-fade-in">
      {/* Atmosphere — soft wash, not a flat void */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 -top-8 h-56 bg-[radial-gradient(ellipse_at_top,_oklch(0.96_0.02_85)_0%,_transparent_70%)]"
      />

      <header className="relative space-y-2 pb-8 pt-2">
        <p
          className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          style={{ animation: "ops-home-in 0.45s ease-out both" }}
        >
          {greeting}
          {name ? (
            <>
              , <span className="text-foreground/90">{name}</span>
            </>
          ) : null}
        </p>
        <p
          className="text-base text-muted-foreground sm:text-lg"
          style={{ animation: "ops-home-in 0.45s ease-out 0.08s both" }}
        >
          ¿Qué necesita atención hoy?
        </p>
        {!loading && !needsAttention && items.length > 0 && (
          <p
            className="pt-1 text-sm text-muted-foreground"
            style={{ animation: "ops-home-in 0.45s ease-out 0.12s both" }}
          >
            Nada urgente por ahora. Entra a un área si quieres revisar.
          </p>
        )}
      </header>

      <section
        className="relative divide-y divide-border border-y border-border"
        aria-label="Áreas que necesitan atención"
      >
        {items.length === 0 ? (
          <p className="py-10 text-sm text-muted-foreground">
            Tu rol no tiene áreas operativas asignadas en este centro.
          </p>
        ) : (
          items.map((item, index) => (
            <AttentionRow
              key={item.id}
              item={item}
              loading={loading}
              style={{
                animation: `ops-home-in 0.4s ease-out ${0.1 + index * 0.06}s both`,
              }}
            />
          ))
        )}
      </section>

      <style>{`
        @keyframes ops-home-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function AttentionRow({
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
    <div
      style={style}
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 py-6",
        hasWork ? "bg-transparent" : "opacity-90",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            hasWork ? "bg-foreground text-background" : "bg-secondary text-foreground",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{item.title}</h2>
          {loading ? (
            <Skeleton className="mt-1.5 h-4 w-36" />
          ) : (
            <p
              className={cn(
                "mt-1 text-sm",
                hasWork ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {item.count === null
                ? "Sin lectura"
                : item.countLabel(item.count)}
            </p>
          )}
        </div>
      </div>

      <Button asChild size="sm" variant={hasWork ? "default" : "outline"}>
        <Link to={item.to}>Entrar</Link>
      </Button>
    </div>
  );
}
