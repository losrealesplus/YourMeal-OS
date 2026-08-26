/**
 * OPERATIONAL-004.5 · Production Workspace Demo
 *
 * Capability Demo — not the definitive Production module.
 * Proves FOUNDATION LAW 003 + LAW 004 for Operational Planning:
 *   screen orchestrates interaction; ProductionFacade owns planning behaviour.
 *   Operational Experience consumes Production Capability.
 *
 * Allowed: useProduction · useIdentity · admin chrome · React · command/query helpers.
 * Forbidden: supabase · repositories · ProductionReport/KitchenExecution services · ServiceContext.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useState, useEffectEvent } from "react";
import { toast } from "sonner";
import {
  AdminHeader,
  SectionTitle,
  StatusChip,
} from "@/components/admin";
import { useProduction } from "@/production/useProduction";
import { useIdentity } from "@/identity/useIdentity";
import {
  closeBatchCommand,
  generateProductionBatchCommand,
  generateProductionPlanCommand,
  markBatchReadyCommand,
} from "@/production/ProductionCommands";
import {
  getProductionLoadQuery,
  getProductionPlanQuery,
  getProductionQueueQuery,
} from "@/production/ProductionQueries";
import type {
  ProductionBatch,
  ProductionContext,
  ProductionLoad,
} from "@/production/ProductionContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute(
  "/_authenticated/admin/production-workspace",
)({
  beforeLoad: ({ context }) => {
    // Pilot caps: kitchen.operate gates EP-002B; production.operate for hub.
    assertCapabilityFromContext(context, "kitchen.operate");
  },
  component: ProductionWorkspaceDemoPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Production Workspace (Demo)" },
      {
        name: "description",
        content:
          "Capability Demo: operational planning via ProductionFacade only (LAW 003 · 004).",
      },
    ],
  }),
});

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function batchTone(
  status: string,
): "positive" | "warning" | "danger" | "neutral" {
  if (status === "done") return "positive";
  if (status === "blocked" || status === "cancelled") return "danger";
  if (status === "released" || status === "in_progress") return "warning";
  return "neutral";
}

function ProductionWorkspaceDemoPage() {
  const production = useProduction();
  const identity = useIdentity();
  const [dayDate, setDayDate] = useState(todayIso);
  const [context, setContext] = useState<ProductionContext | null>(null);
  const [load, setLoad] = useState<ProductionLoad | null>(null);
  const [selected, setSelected] = useState<ProductionBatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const canPlan =
    identity.permissions.capabilities.includes("kitchen.operate") ||
    identity.permissions.capabilities.includes("production.operate");

  const refresh = useEffectEvent(async () => {
    if (!production.isReady) return;
    setLoading(true);
    try {
      const [plan, loadResult] = await Promise.all([
        production.getProductionPlan(
          getProductionPlanQuery({ dayDate }),
        ),
        production.getProductionLoad(
          getProductionLoadQuery({ dayDate }),
        ),
      ]);
      if (!plan.ok || !plan.context) {
        toast.error(plan.errors[0]?.message ?? "GetProductionPlan failed");
        setContext(null);
        setSelected(null);
      } else {
        setContext(plan.context);
        if (selected) {
          const next = plan.context.queue.batches.find((b) => b.id === selected.id);
          setSelected(next ?? null);
        }
      }
      if (loadResult.ok) setLoad(loadResult.load);
      else setLoad(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void refresh();
    }, 150);
    return () => window.clearTimeout(handle);
  }, [dayDate, production.isReady]);

  const onGeneratePlan = useCallback(async () => {
    if (!production.isReady || !canPlan) return;
    setBusy(true);
    try {
      const result = await production.generateProductionPlan(
        generateProductionPlanCommand({ dayDate }),
      );
      if (!result.ok) {
        toast.error(result.errors[0]?.message ?? "GenerateProductionPlan failed");
        return;
      }
      toast.success(
        `GenerateProductionPlan · ${result.planId} · ${result.context?.summary.batchCount ?? 0} batches`,
      );
      setContext(result.context);
      setLoad(result.load);
    } finally {
      setBusy(false);
    }
  }, [production, dayDate, canPlan]);

  async function onQueueOnly() {
    setBusy(true);
    try {
      const result = await production.getProductionQueue(
        getProductionQueueQuery({ dayDate }),
      );
      if (!result.ok || !result.context) {
        toast.error(result.errors[0]?.message ?? "GetProductionQueue failed");
        return;
      }
      setContext(result.context);
      toast.success(`GetProductionQueue · ${result.context.queue.batches.length}`);
    } finally {
      setBusy(false);
    }
  }

  async function onProbeGenerateBatch() {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await production.execute(
        generateProductionBatchCommand({
          dayDate,
          dishId: selected.dishId,
        }),
      );
      toast.message("GenerateProductionBatch", {
        description: `Expected honesty: ${result.errors[0]?.code ?? "UNKNOWN"}`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function onMarkReady() {
    if (!selected || selected.constraints.isCustom) return;
    setBusy(true);
    try {
      const result = await production.markBatchReady(
        markBatchReadyCommand({ dayDate, dishId: selected.dishId }),
      );
      if (!result.ok) {
        toast.message("MarkBatchReady", {
          description: `${result.errors[0]?.code}: ${result.errors[0]?.message ?? ""}`,
        });
        return;
      }
      toast.success(`MarkBatchReady → ${result.status}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onCloseBatch() {
    if (!selected || selected.constraints.isCustom) return;
    setBusy(true);
    try {
      const result = await production.closeBatch(
        closeBatchCommand({ dayDate, dishId: selected.dishId }),
      );
      if (!result.ok) {
        toast.message("CloseBatch", {
          description: `${result.errors[0]?.code}: ${result.errors[0]?.message ?? ""}`,
        });
        return;
      }
      toast.success(`CloseBatch → ${result.status}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const batches = context?.queue.batches ?? [];

  return (
    <div className="animate-fade-in max-w-5xl space-y-6">
      <SectionTitle
        overline="Operaciones"
        title="Planificación de Producción"
        subtitle="Cálculo de lotes y asignación de platos por día de producción."
      />

      <AdminHeader
        goal="Probar planificación operativa vía Facade (Work — no Orders CRUD)"
        capability="kitchen.operate / production.operate"
        object="ProductionPlan · ProductionQueue · ProductionLoad · Batch"
      />

      <div className="mb-6 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm">
        <p className="font-semibold text-foreground">
          Screen → useProduction() → ProductionFacade → Report / Kitchen lots / OrderFacade
        </p>
        <p className="mt-1 text-muted-foreground">
          Production never cooks. Kitchen executes. This demo only consumes planning.
        </p>
        <p className="mt-1 text-muted-foreground">
          Tenant: {identity.tenant?.slug ?? "—"} · Operator:{" "}
          {identity.currentUser?.fullName ?? identity.session.userId ?? "—"} ·
          Ready: {production.isReady ? "yes" : "no"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Legacy hub:{" "}
          <Link
            to="/admin/production"
            className="underline underline-offset-2 hover:text-foreground"
          >
            /admin/production
          </Link>{" "}
          · Order demo:{" "}
          <Link
            to="/admin/order-workspace"
            className="underline underline-offset-2 hover:text-foreground"
          >
            /admin/order-workspace
          </Link>
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Operational day
          <input
            type="date"
            value={dayDate}
            onChange={(e) => setDayDate(e.target.value)}
            className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm font-sans normal-case tracking-normal"
          />
        </label>
        <button
          type="button"
          disabled={!production.isReady || busy || !canPlan}
          onClick={() => void onGeneratePlan()}
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
        >
          GenerateProductionPlan
        </button>
        <button
          type="button"
          disabled={!production.isReady || busy}
          onClick={() => void onQueueOnly()}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          GetProductionQueue
        </button>
        <button
          type="button"
          disabled={!production.isReady || busy}
          onClick={() => void refresh()}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          GetProductionPlan / Load
        </button>
      </div>

      {load ? (
        <p className="mb-4 text-xs text-muted-foreground">
          GetProductionLoad · portions{" "}
          <span className="font-semibold text-foreground">{load.portionCount}</span>
          {" · "}
          batches{" "}
          <span className="font-semibold text-foreground">{load.batchCount}</span>
          {" · "}
          custom{" "}
          <span className="font-semibold text-foreground">
            {load.customLineCount}
          </span>
          {load.estimatedPrepMinutes != null ? (
            <>
              {" · "}
              prep min{" "}
              <span className="font-semibold text-foreground">
                {load.estimatedPrepMinutes}
              </span>
            </>
          ) : null}
        </p>
      ) : null}

      {context ? (
        <p className="mb-4 text-xs text-muted-foreground">
          Plan {context.summary.id} · status{" "}
          <span className="font-semibold text-foreground">
            {context.summary.status}
          </span>
          {" · "}
          source orders {context.sourceOrders.orderIds.length}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            ProductionQueue · day {dayDate}
          </p>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Cargando…
            </p>
          ) : batches.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin trabajo planificado — GenerateProductionPlan
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {batches.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(b)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/40",
                      selected?.id === b.id && "bg-muted/50",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {b.dishName}
                        {b.constraints.isCustom ? " · custom" : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {b.portionCount} raciones · orders {b.orderIds.length}
                      </p>
                    </div>
                    <StatusChip tone={batchTone(b.status)} label={b.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Batch · planning actions
          </p>
          {!selected ? (
            <p className="rounded-md border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
              Selecciona un lote de trabajo
            </p>
          ) : (
            <div className="space-y-3 rounded-md border border-border p-4">
              <div>
                <h3 className="text-lg font-semibold">{selected.dishName}</h3>
                <p className="text-xs text-muted-foreground">{selected.id}</p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-semibold">{selected.status}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Portions</dt>
                  <dd className="font-semibold">{selected.portionCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Released</dt>
                  <dd className="font-semibold">
                    {selected.readiness.releasedToKitchen ? "yes" : "no"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Custom</dt>
                  <dd className="font-semibold">
                    {selected.constraints.isCustom ? "yes" : "no"}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 border-t border-dashed border-border pt-2">
                <button
                  type="button"
                  disabled={busy || selected.constraints.isCustom || !canPlan}
                  onClick={() => void onMarkReady()}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  MarkBatchReady
                </button>
                <button
                  type="button"
                  disabled={busy || selected.constraints.isCustom || !canPlan}
                  onClick={() => void onCloseBatch()}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  CloseBatch
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onProbeGenerateBatch()}
                  className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-40"
                >
                  GenerateProductionBatch (expect UNIMPLEMENTED)
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
