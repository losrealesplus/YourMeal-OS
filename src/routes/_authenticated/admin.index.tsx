/**
 * Centro de Operaciones — home con tarjetas Cocina / Reparto (datos reales).
 * PR-034 · Operations Workspace Activation
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChefHat, Truck, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { OperationsService } from "@/modules/operations";
import { SectionTitle } from "@/components/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: OpsCenterHome,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Centro de Operaciones" },
      {
        name: "description",
        content: "Cocina y Reparto para la jornada operativa.",
      },
    ],
  }),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function OpsCenterHome() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const [kitchenCount, setKitchenCount] = useState<number | null>(null);
  const [deliveryCount, setDeliveryCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const date = todayISO();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user || !tenantId || !can("orders.read")) {
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
        const [k, d] = await Promise.all([
          can("kitchen.operate") || can("orders.read")
            ? OperationsService.kitchenPendingCount(ctx, date)
            : Promise.resolve(0),
          can("logistics.operate") || can("orders.read")
            ? OperationsService.deliveryPendingCount(ctx, date)
            : Promise.resolve(0),
        ]);
        if (!cancelled) {
          setKitchenCount(k);
          setDeliveryCount(d);
        }
      } catch {
        if (!cancelled) {
          setKitchenCount(null);
          setDeliveryCount(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, tenantId, roles, can, date]);

  return (
    <div className="animate-fade-in space-y-8">
      <SectionTitle
        overline="Centro de Operaciones"
        title="Jornada operativa"
        subtitle={`Pedidos reales del ${date}. Cocina → Reparto → Cierre.`}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {(can("kitchen.operate") || can("saas.manage") || roles.includes("operations_manager") || roles.includes("company_admin")) && (
          <WorkspaceCard
            to="/admin/kitchen"
            title="Cocina"
            icon={ChefHat}
            loading={loading}
            pending={kitchenCount}
            pendingLabel="Pedidos pendientes"
            statusHint={
              kitchenCount === null
                ? "Sin lectura"
                : kitchenCount === 0
                  ? "Cola vacía"
                  : "En curso"
            }
            description="Preparación: Pendiente → En preparación → Preparado → Listo"
          />
        )}
        {(can("logistics.operate") || can("saas.manage") || roles.includes("operations_manager")) && (
          <WorkspaceCard
            to="/admin/delivery"
            title="Reparto"
            icon={Truck}
            loading={loading}
            pending={deliveryCount}
            pendingLabel="Pedidos listos / en ruta"
            statusHint={
              deliveryCount === null
                ? "Sin lectura"
                : deliveryCount === 0
                  ? "Cola vacía"
                  : "En curso"
            }
            description="Entrega: Listo → En reparto → Entregado / Incidencia"
          />
        )}
      </div>

      {!can("kitchen.operate") && !can("logistics.operate") && (
        <p className="text-sm text-muted-foreground">
          Tu rol no tiene workspaces de Cocina ni Reparto. Usa el menú de
          Operaciones para Pedidos, Clientes o Inventario.
        </p>
      )}
    </div>
  );
}

function WorkspaceCard({
  to,
  title,
  icon: Icon,
  loading,
  pending,
  pendingLabel,
  statusHint,
  description,
}: {
  to: "/admin/kitchen" | "/admin/delivery";
  title: string;
  icon: typeof ChefHat;
  loading: boolean;
  pending: number | null;
  pendingLabel: string;
  statusHint: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group block rounded-xl border border-border bg-card p-6 transition-colors",
        "hover:border-foreground/20 hover:bg-secondary/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {pendingLabel}
          </p>
          {loading ? (
            <Skeleton className="mt-1 h-9 w-16" />
          ) : (
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {pending ?? "—"}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Estado general
          </p>
          <p className="mt-1 text-sm font-medium">{statusHint}</p>
          <p className="mt-2 text-xs text-primary">Acceso rápido →</p>
        </div>
      </div>
    </Link>
  );
}
