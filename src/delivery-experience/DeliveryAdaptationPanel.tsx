/**
 * DE003 — Zero Friction Delivery Adaptation (Experience only).
 *
 * Adapt delivery-day context when reality changes.
 * Never rewrite Order · Customer · routes · ConfirmDelivery · durable assignment.
 * Session overlays only. Route stop-reorder → registered for Route Preparation.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import { useDelivery } from "@/delivery/useDelivery";
import {
  getCompletedDeliveriesQuery,
  getDeliveryContextQuery,
} from "@/delivery/DeliveryQueries";
import type { DeliveryContext } from "@/delivery/DeliveryContext";
import {
  buildAdaptedTodaysDeliveryDay,
  confirmDeliveryAdaptation,
  deliveryAdaptationKindLabel,
  previewDeliveryAdaptation,
  type AdaptedDeliveryDayCard,
  type DeliveryAdaptationDraft,
  type DeliveryAdaptationImpact,
  type DeliveryAdaptationKind,
} from "@/delivery-experience/adapt-delivery";
import {
  absentOr,
  deliveryReadinessLabel,
  deliveryStatusLabel,
  type DeliveryReadiness,
} from "@/delivery-experience/today-delivery";
import { utcDateOnly } from "@/menu-experience/week-plan";
import { useOrder } from "@/order/useOrder";
import { getOrdersReadyForDeliveryQuery } from "@/order/OrderQueries";
import type { OrderDetails, OrderSummary } from "@/order/OrderContext";
import { useCan } from "@/hooks/use-can";
import { cn } from "@/lib/utils";

type Props = {
  dayDate?: string | null;
  focusDeliveryId?: string | null;
  onBackToToday: () => void;
};

const KINDS: { id: DeliveryAdaptationKind; label: string }[] = [
  { id: "sequence", label: "Secuencia" },
  { id: "priority", label: "Prioridad" },
  { id: "day_note", label: "Nota día" },
  { id: "operational_instruction", label: "Instrucción" },
  { id: "address_clarification", label: "Dirección (op.)" },
  { id: "window_note", label: "Ventana" },
  { id: "temporary_issue", label: "Incidencia" },
  { id: "responsibility_note", label: "Responsabilidad" },
];

function readinessTone(
  r: DeliveryReadiness,
): "positive" | "warning" | "info" | "neutral" {
  if (r === "completed") return "positive";
  if (r === "incomplete" || r === "unassigned") return "warning";
  if (r === "ready_with_warnings") return "info";
  if (r === "ready") return "positive";
  return "neutral";
}

export function DeliveryAdaptationPanel({
  dayDate: focusDay,
  focusDeliveryId = null,
  onBackToToday,
}: Props) {
  const delivery = useDelivery();
  const order = useOrder();
  const { can } = useCan();
  const canWrite = can("logistics.operate");

  const [tick, setTick] = useState(0);
  const [dayDate, setDayDate] = useState(focusDay ?? utcDateOnly());
  const [selectedId, setSelectedId] = useState<string | null>(focusDeliveryId);
  const [kind, setKind] = useState<DeliveryAdaptationKind>("sequence");
  const [pendingImpact, setPendingImpact] =
    useState<DeliveryAdaptationImpact | null>(null);

  const [sequenceRank, setSequenceRank] = useState("1");
  const [priority, setPriority] = useState<"high" | "normal" | "low">("high");
  const [dayNote, setDayNote] = useState("");
  const [instruction, setInstruction] = useState("");
  const [addressClar, setAddressClar] = useState("");
  const [windowNote, setWindowNote] = useState("");
  const [issue, setIssue] = useState("");
  const [respNote, setRespNote] = useState("");
  const [requestOrderOrCustomerChange, setRequestOrderOrCustomerChange] =
    useState(false);
  const [requestRouteReorder, setRequestRouteReorder] = useState(false);

  const [context, setContext] = useState<DeliveryContext | null>(null);
  const [completedContext, setCompletedContext] =
    useState<DeliveryContext | null>(null);
  const [summariesById, setSummariesById] = useState<
    Record<string, OrderSummary>
  >({});
  const [detailsById] = useState<Record<string, OrderDetails>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (focusDay) setDayDate(focusDay);
  }, [focusDay]);

  useEffect(() => {
    if (focusDeliveryId) setSelectedId(focusDeliveryId);
  }, [focusDeliveryId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!delivery.isReady) {
        setLoadError("Sesión / tenant requerido para Delivery.");
        setContext(null);
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const [ready, completed] = await Promise.all([
          delivery.getDeliveryContext(
            getDeliveryContextQuery({ operationalDay: dayDate }),
          ),
          delivery.getCompletedDeliveries(
            getCompletedDeliveriesQuery({ operationalDay: dayDate }),
          ),
        ]);
        if (cancelled) return;
        if (!ready.ok || !ready.context) {
          setContext(null);
          setLoadError(
            ready.errors[0]?.message ?? "GetDeliveryContext failed",
          );
        } else {
          setContext(ready.context);
        }
        setCompletedContext(
          completed.ok && completed.context ? completed.context : null,
        );
        if (order.isReady) {
          const readyOrders = await order.getOrdersReadyForDelivery(
            getOrdersReadyForDeliveryQuery({
              deliveryDay: dayDate,
              limit: 100,
            }),
          );
          if (cancelled) return;
          if (readyOrders.ok) {
            const map: Record<string, OrderSummary> = {};
            for (const s of readyOrders.summaries) map[s.id] = s;
            setSummariesById(map);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
          setContext(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [dayDate, delivery, order, tick]);

  const view = useMemo(
    () =>
      buildAdaptedTodaysDeliveryDay({
        dayDate,
        context,
        completedContext,
        summariesById,
        detailsById,
        loadError,
        assignmentSupported: false,
      }),
    [
      dayDate,
      context,
      completedContext,
      summariesById,
      detailsById,
      loadError,
      tick,
    ],
  );

  const selected: AdaptedDeliveryDayCard | null =
    view.cards.find((c) => c.id === selectedId) ?? null;

  function refresh() {
    setTick((n) => n + 1);
  }

  function clearDraft() {
    setPendingImpact(null);
    setRequestOrderOrCustomerChange(false);
    setRequestRouteReorder(false);
  }

  function buildDraft(): DeliveryAdaptationDraft | null {
    if (!selected) return null;
    const base: DeliveryAdaptationDraft = {
      kind,
      deliveryId: selected.id,
      requestOrderOrCustomerChange,
      requestRouteReorder,
    };
    switch (kind) {
      case "sequence": {
        const n = Number(sequenceRank);
        if (!Number.isFinite(n)) return null;
        return { ...base, sequenceRank: n };
      }
      case "priority":
        return { ...base, dayPriority: priority };
      case "day_note":
        return { ...base, dayNote };
      case "operational_instruction":
        return { ...base, operationalInstruction: instruction };
      case "address_clarification":
        return { ...base, addressClarification: addressClar };
      case "window_note":
        return { ...base, windowNote };
      case "temporary_issue":
        return { ...base, temporaryIssue: issue };
      case "responsibility_note":
        return { ...base, responsibilityNote: respNote };
    }
  }

  function reviewImpact() {
    if (!selected) {
      toast.message("Selecciona una entrega");
      return;
    }
    const draft = buildDraft();
    if (!draft) {
      toast.message("Completa el ajuste");
      return;
    }
    const impact = previewDeliveryAdaptation(selected, draft);
    if (!impact) {
      toast.message("Sin cambio");
      return;
    }
    setPendingImpact(impact);
  }

  function confirm() {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    if (!selected || !pendingImpact) return;
    const draft = buildDraft();
    if (!draft) return;
    const impact = confirmDeliveryAdaptation(selected, draft);
    if (!impact) {
      toast.error("No se pudo adaptar");
      return;
    }
    refresh();
    clearDraft();
    if (impact.routePreparationSignal) {
      toast.message(impact.summary);
    } else if (impact.escalationRequired && !impact.affectsDeliveryDay) {
      toast.message(impact.summary);
    } else {
      toast.success(`${impact.summary} · sesión`);
    }
  }

  if (loading && view.cards.length === 0 && !view.loadError) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide">
          Adaptación de entrega
        </h2>
        <p className="text-xs text-muted-foreground">Cargando jornada…</p>
      </section>
    );
  }

  if (view.cards.length === 0) {
    return (
      <section className="space-y-4" aria-labelledby="de-adapt-empty">
        <h2 id="de-adapt-empty" className="text-sm font-semibold tracking-wide">
          Adaptación de entrega
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            No hay entregas en la jornada para adaptar.
          </p>
          <p className="text-xs text-muted-foreground">
            {view.emptyReason ??
              "La adaptación opera sobre Today's Delivery Day — no reescribe Orders."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onBackToToday}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Volver a Today's Deliveries
            </button>
            <Link
              to="/admin/order-capture"
              search={{
                mode: "search",
                customerId: undefined,
                kind: undefined,
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Revisar Orders
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="de-adapt">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="de-adapt" className="text-sm font-semibold tracking-wide">
            Adaptación de entrega
          </h2>
          <p className="text-xs text-muted-foreground">
            Adapta el día operativo · Order intacto · sin rutas · sesión
            explícita
          </p>
        </div>
        <label className="text-xs">
          <span className="sr-only">Día</span>
          <input
            type="date"
            className="min-h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={dayDate}
            onChange={(e) => setDayDate(e.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusChip tone="info" label={`Hoy ${dayDate}`} />
        <StatusChip tone="info" label={`${view.cards.length} entregas`} />
        <StatusChip tone="warning" label="TTAD < 30 s" />
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={onBackToToday}
        >
          Volver a Today's Deliveries
        </button>
        <span className="text-xs text-muted-foreground">
          Assign / Route / Navigate / Confirm → Future
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Driver assignment not available in this substrate · AssignDelivery no se
        simula
      </p>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wide">
          Selecciona entrega
        </h3>
        <ul className="max-h-48 space-y-2 overflow-y-auto">
          {view.cards.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(c.id);
                  clearDraft();
                }}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left text-sm",
                  selectedId === c.id
                    ? "border-foreground bg-foreground/5"
                    : "border-border/60",
                )}
              >
                <span className="font-medium">
                  {c.customerLabel ?? "Cliente ausente"}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  · {c.orderRef}
                  {c.deliveryAdapted ? " · adaptado" : ""}
                  {c.sequenceRank != null ? ` · seq ${c.sequenceRank}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selected ? (
        <div className="space-y-3 rounded-md border border-border/60 px-3 py-3">
          <div className="flex flex-wrap gap-1">
            <StatusChip
              tone={readinessTone(selected.readiness)}
              label={deliveryReadinessLabel(selected.readiness)}
            />
            <StatusChip
              tone="neutral"
              label={deliveryStatusLabel(selected.deliveryStatus)}
            />
            {selected.deliveryAdapted ? (
              <StatusChip tone="info" label="Adaptado (sesión)" />
            ) : null}
          </div>
          <p className="text-xs">
            <span className="font-medium">Cliente:</span>{" "}
            {absentOr(selected.customerLabel)} ·{" "}
            <span className="font-medium">Order:</span> {selected.orderRef}
          </p>
          <p className="text-xs text-muted-foreground">
            Dirección substrate: {absentOr(selected.addressLabel)} · Zona:{" "}
            {absentOr(selected.zoneLabel)} · Ventana:{" "}
            {absentOr(selected.windowLabel)}
          </p>
          {selected.addressClarification ? (
            <p className="text-xs">
              <span className="font-medium">Aclaración operativa:</span>{" "}
              {selected.addressClarification}{" "}
              <span className="text-muted-foreground">
                (≠ registro Customer)
              </span>
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => {
                  setKind(k.id);
                  clearDraft();
                }}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs",
                  kind === k.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border",
                )}
              >
                {k.label}
              </button>
            ))}
          </div>

          <p className="text-xs font-medium">
            {deliveryAdaptationKindLabel(kind)}
          </p>

          {kind === "sequence" ? (
            <label className="block text-xs">
              Rank en cola del día (1 = primero) — no es ruta
              <input
                type="number"
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={sequenceRank}
                onChange={(e) => setSequenceRank(e.target.value)}
              />
            </label>
          ) : null}
          {kind === "priority" ? (
            <label className="block text-xs">
              Prioridad del día
              <select
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "high" | "normal" | "low")
                }
              >
                <option value="high">high</option>
                <option value="normal">normal</option>
                <option value="low">low</option>
              </select>
            </label>
          ) : null}
          {kind === "day_note" ? (
            <label className="block text-xs">
              Nota de jornada
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={dayNote}
                onChange={(e) => setDayNote(e.target.value)}
              />
            </label>
          ) : null}
          {kind === "operational_instruction" ? (
            <label className="block text-xs">
              Instrucción operativa
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
            </label>
          ) : null}
          {kind === "address_clarification" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Nota operativa de dirección · no modifica el registro Customer
              </p>
              <label className="block text-xs">
                Aclaración operativa
                <textarea
                  className="mt-1 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={addressClar}
                  onChange={(e) => setAddressClar(e.target.value)}
                />
              </label>
            </div>
          ) : null}
          {kind === "window_note" ? (
            <label className="block text-xs">
              Nota de ventana
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={windowNote}
                onChange={(e) => setWindowNote(e.target.value)}
              />
            </label>
          ) : null}
          {kind === "temporary_issue" ? (
            <label className="block text-xs">
              Incidencia temporal
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
              />
            </label>
          ) : null}
          {kind === "responsibility_note" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Driver assignment not available in this substrate
              </p>
              <label className="block text-xs">
                Nota de responsabilidad (sesión)
                <textarea
                  className="mt-1 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={respNote}
                  onChange={(e) => setRespNote(e.target.value)}
                />
              </label>
            </div>
          ) : null}

          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={requestOrderOrCustomerChange}
              onChange={(e) =>
                setRequestOrderOrCustomerChange(e.target.checked)
              }
            />
            <span>
              Este cambio debería modificar Order / Customer durable → escalar
              (no aplicar en Delivery)
            </span>
          </label>

          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={requestRouteReorder}
              onChange={(e) => setRequestRouteReorder(e.target.checked)}
            />
            <span>
              Necesito reordenar paradas como ruta → registrar Route Preparation
              (no aplicar como adaptación)
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reviewImpact}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Revisar impacto
            </button>
            <button
              type="button"
              disabled={!pendingImpact || !canWrite}
              onClick={confirm}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={clearDraft}
              className="text-xs underline-offset-2 hover:underline"
            >
              Cancelar
            </button>
            <Link
              to="/admin/order-capture"
              search={{
                mode: "search",
                customerId: undefined,
                kind: undefined,
              }}
              className="text-xs underline-offset-2 hover:underline"
            >
              Revisar order
            </Link>
            <Link
              to="/admin/customer-workspace"
              className="text-xs underline-offset-2 hover:underline"
            >
              Revisar customer
            </Link>
          </div>

          {pendingImpact ? (
            <div className="space-y-2 rounded-md border border-dashed border-border px-3 py-3 text-xs">
              <p className="font-medium">{pendingImpact.summary}</p>
              <p>
                <span className="font-medium">Cambió:</span>{" "}
                {pendingImpact.changed.length
                  ? pendingImpact.changed.join(" · ")
                  : "—"}
              </p>
              <p>
                <span className="font-medium">No cambió:</span>{" "}
                {pendingImpact.unchanged.join(" · ")}
              </p>
              <p>
                Afecta jornada:{" "}
                {pendingImpact.affectsDeliveryDay ? "sí" : "no"} · Persistencia:{" "}
                {pendingImpact.persistence} · Order intacto: sí · Customer
                intacto: sí
              </p>
              {pendingImpact.routePreparationSignal ? (
                <p className="font-medium text-foreground">
                  Señal Route Preparation registrada — no se inventa
                  optimización de ruta aquí.
                </p>
              ) : null}
              {pendingImpact.escalationRequired ? (
                <p>
                  <span className="font-medium">Escalado:</span>{" "}
                  {pendingImpact.escalationReason} →{" "}
                  {pendingImpact.escalationTarget}.{" "}
                  {pendingImpact.escalationNextAction}
                </p>
              ) : null}
              {pendingImpact.substrateGap ? (
                <p className="text-muted-foreground">
                  {pendingImpact.substrateGap}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Selecciona una entrega para adaptar el contexto del día.
        </p>
      )}
    </section>
  );
}
