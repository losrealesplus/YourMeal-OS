/**
 * OPERATIONAL-005 Phase 4 · Kitchen Workspace Demo
 *
 * Final isolated Capability Demo before Operational Flow Validation.
 * Proves FOUNDATION LAW 003 · 004 · 005 · 006 · 006-A for Kitchen Execution:
 *   screen orchestrates interaction; KitchenExecutionFacade owns execution behaviour.
 *   Operational Experience consumes Kitchen Capability.
 *
 * Allowed: useKitchenExecution · useIdentity · admin chrome · React · command/query helpers.
 * Forbidden: supabase · repositories · ProductionFacade · KitchenExecutionService · ServiceContext.
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
import { useKitchenExecution } from "@/kitchen/useKitchenExecution";
import { useIdentity } from "@/identity/useIdentity";
import {
  completeExecutionCommand,
  markExecutionReadyCommand,
  startExecutionCommand,
} from "@/kitchen/KitchenCommands";
import {
  getExecutionProgressQuery,
  getExecutionQueueQuery,
  getExecutionUnitsQuery,
} from "@/kitchen/KitchenQueries";
import type {
  ExecutionProgress,
  ExecutionUnit,
  KitchenContext,
} from "@/kitchen/KitchenContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute(
  "/_authenticated/admin/kitchen-workspace",
)({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "kitchen.operate");
  },
  component: KitchenWorkspaceDemoPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Kitchen Workspace (Demo)" },
      {
        name: "description",
        content:
          "Capability Demo: operational execution via KitchenExecutionFacade only (LAW 003–006-A).",
      },
    ],
  }),
});

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function unitTone(
  status: string,
): "positive" | "warning" | "danger" | "neutral" {
  if (status === "COMPLETED") return "positive";
  if (status === "BLOCKED") return "danger";
  if (status === "IN_PROGRESS" || status === "PAUSED") return "warning";
  return "neutral";
}

function KitchenWorkspaceDemoPage() {
  const kitchen = useKitchenExecution();
  const identity = useIdentity();
  const [dayDate, setDayDate] = useState(todayIso);
  const [context, setContext] = useState<KitchenContext | null>(null);
  const [selected, setSelected] = useState<ExecutionUnit | null>(null);
  const [progress, setProgress] = useState<ExecutionProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const canOperate =
    identity.permissions.capabilities.includes("kitchen.operate");

  const refresh = useEffectEvent(async () => {
    if (!kitchen.isReady) return;
    setLoading(true);
    try {
      const queue = await kitchen.getExecutionQueue(
        getExecutionQueueQuery({ dayDate }),
      );
      if (!queue.ok || !queue.context) {
        toast.error(queue.errors[0]?.message ?? "GetExecutionQueue failed");
        setContext(null);
        setSelected(null);
        setProgress(null);
      } else {
        setContext(queue.context);
        if (selected) {
          const next = queue.context.queue.units.find((u) => u.id === selected.id);
          setSelected(next ?? null);
        }
      }
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
  }, [dayDate, kitchen.isReady]);

  useEffect(() => {
    if (!selected || !kitchen.isReady) {
      setProgress(null);
      return;
    }
    void (async () => {
      const result = await kitchen.getExecutionProgress(
        getExecutionProgressQuery({ dayDate, unitId: selected.id }),
      );
      if (result.ok) setProgress(result.progress);
      else setProgress(null);
    })();
  }, [selected, dayDate, kitchen.isReady, kitchen]);

  const onLoadQueue = useCallback(async () => {
    if (!kitchen.isReady) return;
    setBusy(true);
    try {
      const result = await kitchen.getExecutionQueue(
        getExecutionQueueQuery({ dayDate }),
      );
      if (!result.ok || !result.context) {
        toast.error(result.errors[0]?.message ?? "GetExecutionQueue failed");
        return;
      }
      setContext(result.context);
      toast.success(
        `GetExecutionQueue · ${result.context.queue.units.length} ExecutionUnits`,
      );
    } finally {
      setBusy(false);
    }
  }, [kitchen, dayDate]);

  async function onLoadUnits() {
    setBusy(true);
    try {
      const result = await kitchen.getExecutionUnits(
        getExecutionUnitsQuery({ dayDate }),
      );
      if (!result.ok) {
        toast.error(result.errors[0]?.message ?? "GetExecutionUnits failed");
        return;
      }
      toast.success(`GetExecutionUnits · ${result.units.length}`);
      if (context) {
        setContext({
          ...context,
          queue: { dayDate, units: result.units },
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function onMarkReady() {
    if (!selected || !canOperate) return;
    setBusy(true);
    try {
      const result = await kitchen.markExecutionReady(
        markExecutionReadyCommand({ dayDate, unitId: selected.id }),
      );
      if (!result.ok) {
        toast.message("MarkExecutionReady", {
          description: `${result.errors[0]?.code}: ${result.errors[0]?.message ?? ""}`,
        });
        return;
      }
      toast.success(`MarkExecutionReady → ${result.status}`);
      if (result.context) setContext(result.context);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onComplete() {
    if (!selected || !canOperate) return;
    setBusy(true);
    try {
      const result = await kitchen.completeExecution(
        completeExecutionCommand({ dayDate, unitId: selected.id }),
      );
      if (!result.ok) {
        toast.message("CompleteExecution", {
          description: `${result.errors[0]?.code}: ${result.errors[0]?.message ?? ""}`,
        });
        return;
      }
      toast.success(`CompleteExecution → ${result.status}`);
      if (result.context) setContext(result.context);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onProbeStart() {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await kitchen.execute(
        startExecutionCommand({ dayDate, unitId: selected.id }),
      );
      toast.message("StartExecution", {
        description: `Expected honesty: ${result.errors[0]?.code ?? "UNKNOWN"}`,
      });
    } finally {
      setBusy(false);
    }
  }

  const units = context?.queue.units ?? [];

  return (
    <div className="animate-fade-in max-w-5xl space-y-6">
      <SectionTitle
        overline="Operaciones"
        title="Ejecución de Cocina"
        subtitle="Gestión de unidades de preparación y cola de cocinado."
      />

      <AdminHeader
        goal="Probar ejecución operativa vía Facade (ExecutionUnit — no Production plan · no Orders)"
        capability="kitchen.operate"
        object="ExecutionQueue · ExecutionUnit · ExecutionProgress"
      />

      <div className="mb-6 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm">
        <p className="font-semibold text-foreground">
          Screen → useKitchenExecution() → KitchenExecutionFacade → ProductionFacade
        </p>
        <p className="mt-1 text-muted-foreground">
          Kitchen never cooks. Kitchen never plans. Question: ¿Qué trabajo debe
          ejecutarse ahora?
        </p>
        <p className="mt-1 text-muted-foreground">
          Tenant: {identity.tenant?.slug ?? "—"} · Operator:{" "}
          {identity.currentUser?.fullName ?? identity.session.userId ?? "—"} ·
          Ready: {kitchen.isReady ? "yes" : "no"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Legacy:{" "}
          <Link
            to="/admin/kitchen-execution"
            className="underline underline-offset-2 hover:text-foreground"
          >
            /admin/kitchen-execution
          </Link>{" "}
          · Production demo:{" "}
          <Link
            to="/admin/production-workspace"
            className="underline underline-offset-2 hover:text-foreground"
          >
            /admin/production-workspace
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
          disabled={!kitchen.isReady || busy}
          onClick={() => void onLoadQueue()}
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
        >
          GetExecutionQueue
        </button>
        <button
          type="button"
          disabled={!kitchen.isReady || busy}
          onClick={() => void onLoadUnits()}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          GetExecutionUnits
        </button>
        <button
          type="button"
          disabled={!kitchen.isReady || busy}
          onClick={() => void refresh()}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          Refresh
        </button>
      </div>

      {context?.permissions ? (
        <p className="mb-4 text-xs text-muted-foreground">
          Permissions · readQueue{" "}
          <span className="font-semibold text-foreground">
            {context.permissions.canReadQueue ? "yes" : "no"}
          </span>
          {" · "}
          operate{" "}
          <span className="font-semibold text-foreground">
            {context.permissions.canOperate ? "yes" : "no"}
          </span>
          {loading ? " · loading…" : null}
        </p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h3 className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Execution Queue · ExecutionUnits
          </h3>
          {units.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
              No ExecutionUnits for this day. Load queue via Facade (Production
              plan must exist).
            </p>
          ) : (
            <ul className="space-y-2">
              {units.map((unit) => (
                <li key={unit.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(unit)}
                    className={cn(
                      "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      selected?.id === unit.id
                        ? "border-foreground bg-muted/50"
                        : "border-border hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        {unit.label}
                      </span>
                      <StatusChip
                        label={unit.status}
                        tone={unitTone(unit.status)}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {unit.id} · portions {unit.portionCount} · from{" "}
                      {unit.productionBatchId}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Selected ExecutionUnit
          </h3>
          {!selected ? (
            <p className="rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
              Select a unit to MarkExecutionReady / Complete / probe Start.
            </p>
          ) : (
            <div className="rounded-md border border-border px-3 py-3 text-sm">
              <p className="font-semibold text-foreground">{selected.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Status {selected.status}
                {progress
                  ? ` · Progress ${progress.percent ?? "—"}%`
                  : null}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !canOperate}
                  onClick={() => void onMarkReady()}
                  className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
                >
                  MarkExecutionReady
                </button>
                <button
                  type="button"
                  disabled={busy || !canOperate}
                  onClick={() => void onComplete()}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  CompleteExecution
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onProbeStart()}
                  className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40"
                >
                  StartExecution (expect UNIMPLEMENTED)
                </button>
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">
                LAW 006-A: this screen never asks “¿qué debemos producir?” —
                Production owns that. Kitchen only executes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
