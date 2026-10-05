import {
  operationalItemIdentity,
  isCustomOperationalItem,
} from "@/production-experience/operational-item-identity";
import {
  CustomOperationalContext,
  OperationalAllergenDeclaration,
} from "@/production-experience/operational-item-presentation";
/**
 * ADMIN · Producción · Batch
 * Capability: kitchen.operate  ·  Core Object: KitchenProductionBatch (dish × day)
 * Reads: ProductionReportService  ·  Writes: KitchenExecutionService.transitionBatch
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Clock, Wheat } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ProductionReportService,
  KitchenExecutionService,
  kitchenBatchStatusLabel,
  primaryKitchenBatchAction,
  nextKitchenBatchStatuses,
  type KitchenBatchStatus,
  type ProductionReportModel,
} from "@/modules/operations";
import { cn } from "@/lib/utils";

const ROLES_ALLOWED = ["saas_admin", "company_admin", "operations_manager", "kitchen"];

export const Route = createFileRoute("/_authenticated/admin/production/batch")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "production.operate");
  },
  component: ProductionBatchPage,
  head: () => ({ meta: [{ title: "YourMeal OS — Batch" }] }),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function ProductionBatchPage() {
  const { user, tenantId, roles } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [report, setReport] = useState<ProductionReportModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      setReport(await ProductionReportService.buildForDay(ctx, { deliveryDate: date }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar las tandas");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles, date]);

  useEffect(() => {
    void load();
  }, [load]);

  async function transition(dishId: string | null, to: KitchenBatchStatus) {
    if (
      !user ||
      !tenantId ||
      !dishId ||
      report?.standardDishes.some((item) => item.dishId === dishId && isCustomOperationalItem(item))
    )
      return;
    setBusy(dishId);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      await KitchenExecutionService.transitionBatch(ctx, {
        deliveryDate: date,
        dishId,
        toStatus: to,
      });
      toast.success(`Tanda → ${kitchenBatchStatusLabel(to)}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transición rechazada");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="batch-date">Fecha</Label>
          <Input
            id="batch-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : !report || report.standardDishes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No hay tandas de producción para esta fecha.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plato</TableHead>
                <TableHead className="text-right">Raciones</TableHead>
                <TableHead>Prep</TableHead>
                <TableHead>Alérgenos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.standardDishes.map((d) => {
                const primary = primaryKitchenBatchAction(d.batchStatus);
                const others = nextKitchenBatchStatuses(d.batchStatus).filter(
                  (s) => s !== primary?.to,
                );
                const isBusy = d.dishId !== null && busy === d.dishId;
                return (
                  <TableRow key={operationalItemIdentity(d)}>
                    <TableCell className="font-medium">
                      {d.dishName}
                      <CustomOperationalContext item={d} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{d.totalQty}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {!isCustomOperationalItem(d) && d.prepMinutes != null ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {d.prepMinutes} min
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {isCustomOperationalItem(d) ||
                      d.allergenState === "UNKNOWN" ||
                      d.allergenState === "HISTORICAL_UNAVAILABLE" ||
                      d.allergens.length === 0 ? (
                        <OperationalAllergenDeclaration item={d} />
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {d.allergens.map((a) => (
                            <Badge key={a} variant="outline" className="gap-1 text-xs">
                              <Wheat className="h-3 w-3" />
                              {a}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{kitchenBatchStatusLabel(d.batchStatus)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {primary ? (
                          <Button
                            size="sm"
                            disabled={isCustomOperationalItem(d) || isBusy}
                            onClick={() => void transition(d.dishId, primary.to)}
                          >
                            {primary.label}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Cerrada</span>
                        )}
                        {others.map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant="outline"
                            disabled={isCustomOperationalItem(d) || isBusy}
                            onClick={() => void transition(d.dishId, s)}
                          >
                            {kitchenBatchStatusLabel(s)}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
