/**
 * EP-002B.2 — Kitchen Execution workspace.
 * Same data as Hoja de Producción; lot-level status mutations via KitchenExecutionService.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Play,
  RefreshCw,
  Wheat,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionTitle } from "@/components/admin";
import {
  KitchenExecutionService,
  kitchenBatchStatusLabel,
  nextKitchenBatchStatuses,
  primaryKitchenBatchAction,
  type KitchenBatchStatus,
  type ProductionDishBlock,
  type ProductionReportModel,
} from "@/modules/operations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/kitchen-execution")({
  validateSearch: (search: Record<string, unknown>): { date?: string } => ({
    date: typeof search.date === "string" ? search.date : undefined,
  }),
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "kitchen.operate");
  },
  component: KitchenExecutionPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Ejecución de Cocina" },
      {
        name: "description",
        content: "Workspace vivo de producción por plato.",
      },
    ],
  }),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function batchTone(status: KitchenBatchStatus): string {
  switch (status) {
    case "pending":
      return "bg-secondary text-secondary-foreground";
    case "preparing":
      return "bg-amber-500/15 text-amber-800";
    case "plating":
      return "bg-sky-500/15 text-sky-800";
    case "finished":
      return "bg-emerald-500/15 text-emerald-800";
  }
}

function KitchenExecutionPage() {
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const search = Route.useSearch();
  const [date, setDate] = useState(search.date ?? todayISO());
  const [board, setBoard] = useState<ProductionReportModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyDishId, setBusyDishId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      const model = await KitchenExecutionService.getDayBoard(ctx, {
        deliveryDate: date,
      });
      setBoard(model);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo cargar la ejecución",
      );
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles, date]);

  useEffect(() => {
    void load();
  }, [load]);

  async function transition(dish: ProductionDishBlock, to: KitchenBatchStatus) {
    if (!user || !tenantId) return;
    setBusyDishId(dish.dishId);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await KitchenExecutionService.transitionBatch(ctx, {
        deliveryDate: date,
        dishId: dish.dishId,
        toStatus: to,
      });
      toast.success(
        `${dish.dishName} → ${kitchenBatchStatusLabel(to)}`,
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transición rechazada");
    } finally {
      setBusyDishId(null);
    }
  }

  if (!can("kitchen.operate")) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No tienes permiso de cocina.{" "}
        <Link to="/admin" className="text-primary underline-offset-4 hover:underline">
          Volver
        </Link>
      </div>
    );
  }

  const dishes = board?.standardDishes ?? [];
  const customs = board?.customizations ?? [];
  const customsByDish = new Map<string, typeof customs>();
  for (const c of customs) {
    const list = customsByDish.get(c.dishId) ?? [];
    list.push(c);
    customsByDish.set(c.dishId, list);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/admin/kitchen">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cocina · Pedidos
            </Link>
          </Button>
          <SectionTitle
            overline="Operaciones"
            title="Ejecución de Cocina"
            subtitle="Estado vivo por lote de plato. Misma fuente que la Hoja de Producción."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/production-sheet" search={{ date }}>
              <FileText className="mr-2 h-4 w-4" />
              Hoja de Producción
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
            />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="exec-date">Fecha</Label>
          <Input
            id="exec-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
        {board ? (
          <p className="pb-2 text-sm text-muted-foreground">
            {board.totals.dishCount} lotes · {board.totals.portionCount} raciones
            · {board.totals.customizationCount} personalizados
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : dishes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No hay producción en cola para esta fecha.
        </div>
      ) : (
        <div className="space-y-3">
          {dishes.map((dish) => {
            const primary = primaryKitchenBatchAction(dish.batchStatus);
            const next = nextKitchenBatchStatuses(dish.batchStatus);
            const relatedCustoms = customsByDish.get(dish.dishId) ?? [];
            const busy = busyDishId === dish.dishId;

            return (
              <article
                key={dish.dishId}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-tight">
                        {dish.dishName}
                      </h2>
                      <Badge className={batchTone(dish.batchStatus)}>
                        {kitchenBatchStatusLabel(dish.batchStatus)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground tabular-nums">
                        {dish.totalQty}
                      </span>{" "}
                      raciones
                      {dish.prepMinutes != null ? (
                        <>
                          {" · "}
                          <Clock className="inline h-3.5 w-3.5" />{" "}
                          {dish.prepMinutes} min
                        </>
                      ) : null}
                    </p>
                    {dish.allergens.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {dish.allergens.map((a) => (
                          <Badge key={a} variant="outline" className="gap-1 text-xs">
                            <Wheat className="h-3 w-3" />
                            {a}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {primary ? (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => void transition(dish, primary.to)}
                      >
                        {dish.batchStatus === "pending" ? (
                          <Play className="mr-2 h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        {primary.label}
                      </Button>
                    ) : (
                      <Badge className={batchTone("finished")}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Finalizado
                      </Badge>
                    )}
                    {next
                      .filter((s) => s !== primary?.to)
                      .map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void transition(dish, s)}
                        >
                          {kitchenBatchStatusLabel(s)}
                        </Button>
                      ))}
                  </div>
                </div>

                <Accordion type="single" collapsible className="mt-3">
                  <AccordionItem value="clients" className="border-0">
                    <AccordionTrigger className="py-2 text-sm">
                      Clientes ({dish.customers.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="divide-y divide-border text-sm">
                        {dish.customers.map((c) => (
                          <li
                            key={`${c.orderId}-${c.customerId}`}
                            className="flex justify-between py-2"
                          >
                            <span>{c.customerName}</span>
                            <span className="font-mono tabular-nums">×{c.qty}</span>
                          </li>
                        ))}
                      </ul>
                      {relatedCustoms.length > 0 ? (
                        <div className="mt-3 rounded-lg border border-dashed p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Personalizados relacionados
                          </p>
                          <ul className="mt-2 space-y-2 text-sm">
                            {relatedCustoms.map((c) => (
                              <li key={`${c.orderId}-${c.observation}`}>
                                <span className="font-semibold">
                                  {c.customerName}
                                </span>
                                {" · "}
                                {c.observation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </article>
            );
          })}

          {customs.length > 0 ? (
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold">Personalizados del día</h3>
              <ul className="mt-3 divide-y divide-border text-sm">
                {customs.map((c) => (
                  <li key={`${c.orderId}-${c.dishId}`} className="py-3">
                    <p className="font-semibold">{c.customerName}</p>
                    <p>
                      {c.dishName} ×{c.qty}
                    </p>
                    <p className="text-muted-foreground">{c.observation}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
