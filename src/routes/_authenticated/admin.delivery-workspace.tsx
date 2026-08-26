/**
 * OPERATIONAL-006 Phase 4 · Delivery Workspace Demo
 *
 * Capability Demo — not the definitive Delivery / logistics product UI.
 * Proves FOUNDATION LAW 003 · 006 · 007 + PRODUCT LAW 001 for Delivery:
 *   screen orchestrates interaction; DeliveryFacade owns fulfillment behaviour.
 *   Operational Experience consumes Delivery Capability.
 *
 * Allowed: useDelivery · useIdentity · admin chrome · React · command/query helpers.
 * Forbidden: supabase · repositories · OrderFacade · KitchenExecutionFacade ·
 *            Delivery services · ServiceContext · GPS / maps SDKs.
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
import { useDelivery } from "@/delivery/useDelivery";
import { useIdentity } from "@/identity/useIdentity";
import {
  assignDeliveryCommand,
  closeDeliveryCommand,
  confirmDeliveryCommand,
  reportDeliveryExceptionCommand,
  startDeliveryCommand,
} from "@/delivery/DeliveryCommands";
import {
  getCompletedDeliveriesQuery,
  getDeliveryAssignmentsQuery,
  getDeliveryContextQuery,
  getDeliveryRoutesQuery,
  getDeliveryStopsQuery,
} from "@/delivery/DeliveryQueries";
import type {
  DeliveryAssignment,
  DeliveryConfirmation,
  DeliveryContext,
  DeliveryStop,
} from "@/delivery/DeliveryContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute(
  "/_authenticated/admin/delivery-workspace",
)({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "logistics.operate");
  },
  component: DeliveryWorkspaceDemoPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Delivery Workspace (Demo)" },
      {
        name: "description",
        content:
          "Capability Demo: controlled transfer of responsibility via DeliveryFacade only (LAW 003 · 006 · 007 · PRODUCT LAW 001).",
      },
    ],
  }),
});

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function statusTone(
  status: string,
): "positive" | "warning" | "danger" | "neutral" {
  if (status === "Delivered" || status === "Confirmed") return "positive";
  if (status === "InTransit" || status === "Assigned") return "warning";
  if (status === "Planned") return "neutral";
  return "danger";
}

function DeliveryWorkspaceDemoPage() {
  const delivery = useDelivery();
  const identity = useIdentity();
  const [dayDate, setDayDate] = useState(todayIso);
  const [context, setContext] = useState<DeliveryContext | null>(null);
  const [selected, setSelected] = useState<DeliveryAssignment | null>(null);
  const [lastConfirmation, setLastConfirmation] =
    useState<DeliveryConfirmation | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const canConfirm =
    identity.permissions.capabilities.includes("logistics.operate") ||
    identity.permissions.capabilities.includes("orders.write");

  const refresh = useEffectEvent(async () => {
    if (!delivery.isReady) return;
    setLoading(true);
    try {
      const result = await delivery.getDeliveryContext(
        getDeliveryContextQuery({ operationalDay: dayDate }),
      );
      if (!result.ok || !result.context) {
        toast.error(result.errors[0]?.message ?? "GetDeliveryContext failed");
        setContext(null);
        setSelected(null);
      } else {
        setContext(result.context);
        if (selected) {
          const next = result.context.assignments.find(
            (a) => a.id === selected.id,
          );
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
  }, [dayDate, delivery.isReady]);

  const onLoadContext = useCallback(async () => {
    if (!delivery.isReady) return;
    setBusy(true);
    try {
      const result = await delivery.getDeliveryContext(
        getDeliveryContextQuery({ operationalDay: dayDate }),
      );
      if (!result.ok || !result.context) {
        toast.error(result.errors[0]?.message ?? "GetDeliveryContext failed");
        return;
      }
      setContext(result.context);
      toast.success(
        `GetDeliveryContext · ${result.context.assignments.length} assignments`,
      );
    } finally {
      setBusy(false);
    }
  }, [delivery, dayDate]);

  async function onLoadAssignments() {
    setBusy(true);
    try {
      const result = await delivery.getDeliveryAssignments(
        getDeliveryAssignmentsQuery({ operationalDay: dayDate }),
      );
      if (!result.ok || !result.context) {
        toast.error(
          result.errors[0]?.message ?? "GetDeliveryAssignments failed",
        );
        return;
      }
      setContext(result.context);
      toast.success(
        `GetDeliveryAssignments · ${result.context.assignments.length}`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function onLoadStops() {
    setBusy(true);
    try {
      const result = await delivery.getDeliveryStops(
        getDeliveryStopsQuery({ operationalDay: dayDate }),
      );
      if (!result.ok || !result.context) {
        toast.error(result.errors[0]?.message ?? "GetDeliveryStops failed");
        return;
      }
      setContext(result.context);
      toast.success(`GetDeliveryStops · ${result.context.stops.length} stops`);
    } finally {
      setBusy(false);
    }
  }

  async function onLoadCompleted() {
    setBusy(true);
    try {
      const result = await delivery.getCompletedDeliveries(
        getCompletedDeliveriesQuery({ operationalDay: dayDate }),
      );
      if (!result.ok || !result.context) {
        toast.error(
          result.errors[0]?.message ?? "GetCompletedDeliveries failed",
        );
        return;
      }
      setContext(result.context);
      toast.success(
        `GetCompletedDeliveries · ${result.context.assignments.length}`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function onProbeRoutes() {
    setBusy(true);
    try {
      const result = await delivery.query(
        getDeliveryRoutesQuery({ operationalDay: dayDate }),
      );
      toast.message("GetDeliveryRoutes", {
        description: `Expected honesty: ${result.errors[0]?.code ?? "UNKNOWN"} — ${result.errors[0]?.message ?? ""}`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function onConfirm() {
    if (!selected || !canConfirm) return;
    setBusy(true);
    try {
      const result = await delivery.confirmDelivery(
        confirmDeliveryCommand({
          operationalDay: dayDate,
          assignmentId: selected.id,
          note: "Capability Demo confirmation",
        }),
      );
      if (!result.ok) {
        toast.message("ConfirmDelivery", {
          description: `${result.errors[0]?.code}: ${result.errors[0]?.message ?? ""}`,
        });
        return;
      }
      setLastConfirmation(result.confirmation);
      toast.success(`ConfirmDelivery → ${result.status}`);
      if (result.context) setContext(result.context);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onProbeAssign() {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await delivery.execute(
        assignDeliveryCommand({
          operationalDay: dayDate,
          commitmentRef: selected.commitmentRef,
        }),
      );
      toast.message("AssignDelivery", {
        description: `Expected honesty: ${result.errors[0]?.code ?? "UNKNOWN"}`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function onProbeStart() {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await delivery.execute(
        startDeliveryCommand({
          operationalDay: dayDate,
          assignmentId: selected.id,
        }),
      );
      toast.message("StartDelivery", {
        description: `Expected honesty: ${result.errors[0]?.code ?? "UNKNOWN"}`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function onProbeException() {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await delivery.execute(
        reportDeliveryExceptionCommand({
          operationalDay: dayDate,
          assignmentId: selected.id,
          code: "DEMO_EXCEPTION",
          message: "Capability Demo probe — not a real exception",
        }),
      );
      toast.message("ReportDeliveryException", {
        description: `Expected honesty: ${result.errors[0]?.code ?? "UNKNOWN"}`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function onProbeClose() {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await delivery.execute(
        closeDeliveryCommand({
          operationalDay: dayDate,
          assignmentId: selected.id,
        }),
      );
      toast.message("CloseDelivery", {
        description: `Expected honesty: ${result.errors[0]?.code ?? "UNKNOWN"}`,
      });
    } finally {
      setBusy(false);
    }
  }

  const assignments = context?.assignments ?? [];
  const stops: DeliveryStop[] = context?.stops ?? [];
  const selectedStop = selected
    ? stops.find((s) => s.id === selected.stopId) ?? null
    : null;

  return (
    <div className="animate-fade-in max-w-5xl space-y-6">
      <SectionTitle
        overline="Operaciones"
        title="Gestión de Reparto"
        subtitle="Transferencia de pedidos, rutas y paradas de entrega."
      />

      <AdminHeader
        goal="Probar cumplimiento operativo vía Facade (Assignment · Stop · Confirmation — never Orders · never Kitchen · never courier)"
        capability="logistics.operate"
        object="DeliveryContext · DeliveryAssignment · DeliveryStop · DeliveryConfirmation"
      />

      <div className="mb-6 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm">
        <p className="font-semibold text-foreground">
          Screen → useDelivery() → DeliveryFacade → OrderFacade ·
          KitchenExecutionFacade
        </p>
        <p className="mt-1 text-muted-foreground">
          Delivery never plans. Delivery never cooks. Delivery executes
          completed Kitchen work as controlled transfer of responsibility to the
          customer. Question: ¿Qué compromisos deben salir del tenant y cómo
          aseguramos que llegan correctamente?
        </p>
        <p className="mt-1 text-muted-foreground">
          Tenant: {identity.tenant?.slug ?? "—"} · Operator:{" "}
          {identity.currentUser?.fullName ?? identity.session.userId ?? "—"} ·
          Ready: {delivery.isReady ? "yes" : "no"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Legacy:{" "}
          <Link
            to="/admin/delivery"
            className="underline underline-offset-2 hover:text-foreground"
          >
            /admin/delivery
          </Link>{" "}
          · Kitchen demo:{" "}
          <Link
            to="/admin/kitchen-workspace"
            className="underline underline-offset-2 hover:text-foreground"
          >
            /admin/kitchen-workspace
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
          disabled={!delivery.isReady || busy}
          onClick={() => void onLoadContext()}
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
        >
          GetDeliveryContext
        </button>
        <button
          type="button"
          disabled={!delivery.isReady || busy}
          onClick={() => void onLoadAssignments()}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          GetDeliveryAssignments
        </button>
        <button
          type="button"
          disabled={!delivery.isReady || busy}
          onClick={() => void onLoadStops()}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          GetDeliveryStops
        </button>
        <button
          type="button"
          disabled={!delivery.isReady || busy}
          onClick={() => void onLoadCompleted()}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          GetCompletedDeliveries
        </button>
        <button
          type="button"
          disabled={!delivery.isReady || busy}
          onClick={() => void onProbeRoutes()}
          className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40"
        >
          GetDeliveryRoutes (expect UNIMPLEMENTED)
        </button>
        <button
          type="button"
          disabled={!delivery.isReady || busy}
          onClick={() => void refresh()}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          Refresh
        </button>
      </div>

      {context?.permissions ? (
        <p className="mb-4 text-xs text-muted-foreground">
          Permissions · assign{" "}
          <span className="font-semibold text-foreground">
            {context.permissions.canAssign ? "yes" : "no"}
          </span>
          {" · "}
          confirm{" "}
          <span className="font-semibold text-foreground">
            {context.permissions.canConfirm ? "yes" : "no"}
          </span>
          {" · "}
          evidence{" "}
          <span className="font-semibold text-foreground">
            {context.permissions.canViewEvidence ? "yes" : "no"}
          </span>
          {loading ? " · loading…" : null}
        </p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h3 className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Delivery Assignments · Status
          </h3>
          {assignments.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
              No DeliveryAssignments for this day. Load context via Facade
              (Orders ready_for_delivery must exist).
            </p>
          ) : (
            <ul className="space-y-2">
              {assignments.map((assignment) => (
                <li key={assignment.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(assignment)}
                    className={cn(
                      "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      selected?.id === assignment.id
                        ? "border-foreground bg-muted/50"
                        : "border-border hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        {assignment.destinationLabel}
                      </span>
                      <StatusChip
                        tone={statusTone(assignment.status)}
                        label={assignment.status}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assignment.id} · commitment {assignment.commitmentRef}
                      {assignment.routeId
                        ? ` · route ${assignment.routeId}`
                        : " · route —"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mb-2 mt-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Delivery Stops
          </h3>
          {stops.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              No DeliveryStops in context yet.
            </p>
          ) : (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {stops.map((stop) => (
                <li key={stop.id} className="rounded border border-border px-2 py-1.5">
                  <span className="font-semibold text-foreground">
                    #{stop.sequence} {stop.destinationLabel}
                  </span>{" "}
                  · {stop.status} · {stop.assignmentIds.length} assignment(s)
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Selected Delivery Assignment
          </h3>
          {!selected ? (
            <p className="rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
              Select an assignment to Confirm or probe UNIMPLEMENTED intents.
            </p>
          ) : (
            <div className="rounded-md border border-border px-3 py-3 text-sm">
              <p className="font-semibold text-foreground">
                {selected.destinationLabel}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Status {selected.status}
                {selectedStop
                  ? ` · Stop #${selectedStop.sequence} ${selectedStop.destinationLabel}`
                  : null}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Window {selected.windowStart ?? "—"} →{" "}
                {selected.windowEnd ?? "—"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !canConfirm}
                  onClick={() => void onConfirm()}
                  className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
                >
                  ConfirmDelivery
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onProbeAssign()}
                  className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40"
                >
                  AssignDelivery (UNIMPLEMENTED)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onProbeStart()}
                  className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40"
                >
                  StartDelivery (UNIMPLEMENTED)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onProbeException()}
                  className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40"
                >
                  ReportDeliveryException (UNIMPLEMENTED)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onProbeClose()}
                  className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40"
                >
                  CloseDelivery (UNIMPLEMENTED)
                </button>
              </div>

              <div className="mt-4 rounded border border-dashed border-border px-2 py-2 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Delivery Evidence / Confirmation
                </p>
                {lastConfirmation ? (
                  <p className="mt-1">
                    {lastConfirmation.id} · {lastConfirmation.outcome} ·{" "}
                    {lastConfirmation.confirmedAt}
                    {lastConfirmation.note
                      ? ` · note: ${lastConfirmation.note}`
                      : null}
                  </p>
                ) : (
                  <p className="mt-1">
                    No confirmation in this session. ConfirmDelivery returns
                    DeliveryConfirmation (evidence substrate). Photo/signature
                    kinds remain future Product UI — never simulated here.
                  </p>
                )}
              </div>

              <p className="mt-3 text-[10px] text-muted-foreground">
                LAW 006 / ADR 0085: this screen never asks “¿qué estoy
                ejecutando?” (Kitchen) or “¿qué debo producir?” (Production) —
                Delivery only transfers completed commitments outward.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
