/**
 * DE006 — Zero Friction Delivery Completion (Experience only).
 *
 * Understand outcome · remaining · unresolved · next responsibility.
 * Expose ConfirmDelivery when Facade supports it — never invent POD,
 * ReportDeliveryException persistence, or Billing outcomes.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import { useDelivery } from "@/delivery/useDelivery";
import { confirmDeliveryCommand } from "@/delivery/DeliveryCommands";
import {
  getCompletedDeliveriesQuery,
  getDeliveryContextQuery,
} from "@/delivery/DeliveryQueries";
import type { DeliveryContext } from "@/delivery/DeliveryContext";
import { buildAdaptedTodaysDeliveryDay } from "@/delivery-experience/adapt-delivery";
import {
  buildDeliveryCompletionDayView,
  completionStateLabel,
  filterCompletionCards,
  markConfirmedInSession,
  responsibilityStateLabel,
  setSessionUnresolved,
  unresolvedKindLabel,
  type CompletionFilter,
  type DeliveryCompletionState,
  type SessionUnresolvedKind,
} from "@/delivery-experience/completion-view";
import {
  downloadDeliveryCompletionCsv,
  printDeliveryCompletion,
} from "@/delivery-experience/export-completion";
import {
  absentOr,
  deliveryStatusLabel,
} from "@/delivery-experience/today-delivery";
import { utcDateOnly } from "@/menu-experience/week-plan";
import { useOrder } from "@/order/useOrder";
import { getOrdersReadyForDeliveryQuery } from "@/order/OrderQueries";
import type { OrderDetails, OrderSummary } from "@/order/OrderContext";
import { cn } from "@/lib/utils";

type Props = {
  dayDate?: string | null;
  focusDeliveryId?: string | null;
  onOpenDelivery: (dayDate: string, deliveryId: string) => void;
  onOpenRoute: (dayDate: string) => void;
  onOpenResponsibility: (dayDate: string, deliveryId?: string) => void;
  onBackToToday: () => void;
};

function stateTone(
  s: DeliveryCompletionState,
): "positive" | "warning" | "info" | "neutral" {
  if (s === "completed") return "positive";
  if (s === "failed" || s === "blocked") return "warning";
  if (s === "remaining") return "info";
  return "neutral";
}

export function DeliveryCompletionPanel({
  dayDate: focusDay,
  focusDeliveryId = null,
  onOpenDelivery,
  onOpenRoute,
  onOpenResponsibility,
  onBackToToday,
}: Props) {
  const delivery = useDelivery();
  const order = useOrder();
  const [dayDate, setDayDate] = useState(focusDay ?? utcDateOnly());
  const [filter, setFilter] = useState<CompletionFilter>("all");
  const [openId, setOpenId] = useState<string | null>(focusDeliveryId);
  const [tick, setTick] = useState(0);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [unresolvedKind, setUnresolvedKind] =
    useState<SessionUnresolvedKind>("customer_unavailable");
  const [unresolvedNote, setUnresolvedNote] = useState("");
  const [context, setContext] = useState<DeliveryContext | null>(null);
  const [completedContext, setCompletedContext] =
    useState<DeliveryContext | null>(null);
  const [summariesById, setSummariesById] = useState<
    Record<string, OrderSummary>
  >({});
  const [detailsById] = useState<Record<string, OrderDetails>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const assignmentSupported = false;
  /** ConfirmDelivery is composed on Delivery Facade today */
  const confirmDeliverySupported = true;

  useEffect(() => {
    if (focusDay) setDayDate(focusDay);
  }, [focusDay]);

  useEffect(() => {
    if (focusDeliveryId) setOpenId(focusDeliveryId);
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

  const dayView = useMemo(
    () =>
      buildAdaptedTodaysDeliveryDay({
        dayDate,
        context,
        completedContext,
        summariesById,
        detailsById,
        loadError,
        assignmentSupported,
      }),
    [
      dayDate,
      context,
      completedContext,
      summariesById,
      detailsById,
      loadError,
      assignmentSupported,
    ],
  );

  const view = useMemo(() => {
    void tick;
    return buildDeliveryCompletionDayView({
      dayDate: dayView.dayDate,
      dayLabel: dayView.dayLabel,
      cards: dayView.cards,
      assignmentSupported,
      confirmDeliverySupported,
      emptyReason: dayView.emptyReason,
    });
  }, [dayView, assignmentSupported, confirmDeliverySupported, tick]);

  const filtered = useMemo(
    () => filterCompletionCards(view.cards, filter),
    [view.cards, filter],
  );

  function refresh() {
    setTick((n) => n + 1);
  }

  async function runConfirm(deliveryId: string) {
    if (!confirmDeliverySupported) {
      toast.message(
        "Delivery confirmation not available in this substrate",
      );
      return;
    }
    setConfirmingId(deliveryId);
    try {
      const result = await delivery.confirmDelivery(
        confirmDeliveryCommand({
          operationalDay: dayDate,
          assignmentId: deliveryId,
          note: noteById[deliveryId]?.trim() || null,
        }),
      );
      if (!result.ok) {
        toast.error(
          result.errors[0]?.message ?? "ConfirmDelivery failed",
        );
        return;
      }
      markConfirmedInSession(deliveryId);
      toast.success(
        "ConfirmDelivery ok · Completed in this session · Facade (no POD inventado)",
      );
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setConfirmingId(null);
    }
  }

  if (loading && view.cards.length === 0 && !loadError) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide">
          Cierre de entregas
        </h2>
        <p className="text-xs text-muted-foreground">Cargando outcomes…</p>
      </section>
    );
  }

  if (view.cards.length === 0) {
    return (
      <section className="space-y-4" aria-labelledby="de-comp-empty">
        <h2 id="de-comp-empty" className="text-sm font-semibold tracking-wide">
          Cierre de entregas
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            {view.dayCompleteTrustworthy
              ? "Delivery day complete"
              : "Delivery completion status unavailable"}
          </p>
          <p className="text-xs text-muted-foreground">
            {view.emptyReason ??
              "No hay entregas en la jornada para evaluar cierre. No se afirma complete solo por lista vacía."}
          </p>
          <p className="text-xs">
            <span className="font-medium">Siguiente:</span> {view.nextActionHint}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onBackToToday}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Today's Deliveries
            </button>
            <button
              type="button"
              onClick={() => onOpenRoute(dayDate)}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Revisar Route Preparation
            </button>
            <button
              type="button"
              onClick={() => onOpenResponsibility(dayDate)}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Revisar Responsibility
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="de-comp">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="de-comp" className="text-sm font-semibold tracking-wide">
            Cierre de entregas
          </h2>
          <p className="text-xs text-muted-foreground">
            Outcome · remaining · unresolved · sin POD inventado · sin Billing
            automático
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
        <StatusChip tone="info" label={`${view.dayLabel} · ${view.dayDate}`} />
        <StatusChip tone="info" label={`${view.totals.total} entregas`} />
        <StatusChip
          tone="positive"
          label={`${view.totals.completed} completed`}
        />
        <StatusChip
          tone={view.totals.remaining ? "info" : "neutral"}
          label={`${view.totals.remaining} remaining`}
        />
        <StatusChip
          tone={view.totals.failed ? "warning" : "neutral"}
          label={`${view.totals.failed} failed`}
        />
        <StatusChip
          tone={view.totals.blocked ? "warning" : "neutral"}
          label={`${view.totals.blocked} blocked`}
        />
        <StatusChip
          tone={view.totals.warnings ? "warning" : "neutral"}
          label={`${view.totals.warnings} warnings`}
        />
        {view.dayCompleteTrustworthy ? (
          <StatusChip tone="positive" label="Delivery day complete" />
        ) : null}
      </div>

      <div className="rounded-md border border-border/60 px-3 py-3 text-xs space-y-1">
        <p className="font-medium">{view.statusSummary}</p>
        <p className="text-muted-foreground">
          <span className="font-medium">Siguiente:</span> {view.nextActionHint}
        </p>
        {view.confirmDeliverySupported ? (
          <p>
            ConfirmDelivery disponible vía Delivery Facade · no implica Proof of
            Delivery ni aceptación del cliente simulada
          </p>
        ) : (
          <p>Delivery confirmation not available in this substrate</p>
        )}
        <p>Billing outcome unavailable in this substrate</p>
        {view.dayWarnings.map((w) => (
          <p key={w.id} className="text-muted-foreground">
            · {w.message} — {w.why}
          </p>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todas"],
            ["remaining", "Remaining"],
            ["completed", "Completed"],
            ["failed", "Failed"],
            ["blocked", "Blocked"],
            ["unassigned", "Unassigned / gap"],
            ["unknown", "Unknown"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-md border px-2 py-1 text-xs",
              filter === id
                ? "border-foreground bg-foreground text-background"
                : "border-border",
            )}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={onBackToToday}
        >
          Volver a Today's Deliveries
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => onOpenRoute(dayDate)}
        >
          Revisar route
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => printDeliveryCompletion(view)}
        >
          Imprimir / PDF
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            downloadDeliveryCompletionCsv(view);
            toast.success("CSV de cierre descargado");
          }}
        >
          Exportar CSV
        </button>
        <button
          type="button"
          className="text-xs text-muted-foreground"
          disabled
          title="Future"
        >
          Proof of Delivery → Future
        </button>
        <button
          type="button"
          className="text-xs text-muted-foreground"
          disabled
          title="Future"
        >
          Notify Customer → Future
        </button>
        <button
          type="button"
          className="text-xs text-muted-foreground"
          disabled
          title="Billing unavailable"
        >
          Ready for Billing → unavailable
        </button>
      </div>

      <ul className="space-y-3">
        {filtered.map((c) => (
          <li
            key={c.deliveryId}
            className={cn(
              "rounded-md border border-border/60 px-3 py-3",
              (c.completionState === "failed" ||
                c.completionState === "blocked") &&
                "border-foreground/40",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  {c.customerLabel ?? "Cliente ausente"}{" "}
                  <span className="font-normal text-muted-foreground">
                    · Order {c.orderRef}
                    {c.routePosition != null
                      ? ` · #${c.routePosition}`
                      : ""}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Dirección: {absentOr(c.addressLabel)}
                  {c.zoneLabel ? ` · Zona: ${c.zoneLabel}` : ""}
                </p>
                {c.addressClarification ? (
                  <p className="text-xs text-muted-foreground">
                    Aclaración (sesión · ≠ Customer): {c.addressClarification}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Ventana: {absentOr(c.windowLabel)} · Facade:{" "}
                  {deliveryStatusLabel(c.deliveryStatus)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Responsabilidad:{" "}
                  {responsibilityStateLabel(c.responsibilityState)}
                  {" · "}
                  Conductor:{" "}
                  {c.responsibilityState === "assignment_unavailable"
                    ? "no disponible en este substrate"
                    : absentOr(c.driverLabel)}
                </p>
                {c.completedInSession ? (
                  <p className="text-xs font-medium">
                    Completed in this session
                  </p>
                ) : null}
                {c.sessionUnresolvedNote && c.sessionUnresolvedKind ? (
                  <p className="text-xs text-muted-foreground">
                    Sin resolver (sesión · no incidente durable):{" "}
                    {unresolvedKindLabel(c.sessionUnresolvedKind)} —{" "}
                    {c.sessionUnresolvedNote}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Siguiente: {c.nextResponsibilityLabel}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <StatusChip
                  tone={stateTone(c.completionState)}
                  label={completionStateLabel(c.completionState)}
                />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs underline-offset-2 hover:underline"
                onClick={() => onOpenDelivery(dayDate, c.deliveryId)}
              >
                Abrir entrega
              </button>
              <Link
                to="/admin/customer-workspace"
                className="text-xs underline-offset-2 hover:underline"
              >
                Revisar customer
              </Link>
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
              <button
                type="button"
                className="text-xs underline-offset-2 hover:underline"
                onClick={() =>
                  setOpenId(openId === c.deliveryId ? null : c.deliveryId)
                }
              >
                {openId === c.deliveryId ? "Cerrar detalle" : "Ver detalle"}
              </button>
              {c.completionState === "remaining" &&
              view.confirmDeliverySupported ? (
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  disabled={confirmingId === c.deliveryId}
                  onClick={() => void runConfirm(c.deliveryId)}
                >
                  {confirmingId === c.deliveryId
                    ? "Confirmando…"
                    : "ConfirmDelivery (Facade)"}
                </button>
              ) : null}
              {c.completionState === "remaining" &&
              !view.confirmDeliverySupported ? (
                <span className="text-xs text-muted-foreground">
                  Delivery confirmation not available in this substrate
                </span>
              ) : null}
            </div>

            {openId === c.deliveryId ? (
              <div className="mt-3 space-y-2 border-t border-border/50 pt-3 text-xs">
                {c.completionState === "remaining" &&
                view.confirmDeliverySupported ? (
                  <label className="block space-y-1">
                    <span className="font-medium">
                      Nota ConfirmDelivery (opcional)
                    </span>
                    <input
                      className="min-h-10 w-full rounded-md border border-border bg-background px-2"
                      value={noteById[c.deliveryId] ?? ""}
                      onChange={(e) =>
                        setNoteById((m) => ({
                          ...m,
                          [c.deliveryId]: e.target.value,
                        }))
                      }
                      placeholder="Sin POD · sin foto · sin firma inventada"
                    />
                  </label>
                ) : null}

                {c.completionState !== "completed" ? (
                  <div className="space-y-1 rounded-md border border-dashed border-border px-2 py-2">
                    <p className="font-medium">
                      Nota sin resolver (sesión · ≠ ReportDeliveryException)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <select
                        className="min-h-9 rounded-md border border-border bg-background px-2"
                        value={unresolvedKind}
                        onChange={(e) =>
                          setUnresolvedKind(
                            e.target.value as SessionUnresolvedKind,
                          )
                        }
                      >
                        <option value="customer_unavailable">
                          Customer unavailable
                        </option>
                        <option value="address_issue">Address issue</option>
                        <option value="delivery_issue">Delivery issue</option>
                        <option value="operational_issue">
                          Operational issue
                        </option>
                      </select>
                      <input
                        className="min-h-9 min-w-[12rem] flex-1 rounded-md border border-border bg-background px-2"
                        value={unresolvedNote}
                        onChange={(e) => setUnresolvedNote(e.target.value)}
                        placeholder="Motivo · impacto · siguiente (sesión)"
                      />
                      <button
                        type="button"
                        className="underline-offset-2 hover:underline"
                        onClick={() => {
                          setSessionUnresolved(
                            c.deliveryId,
                            unresolvedKind,
                            unresolvedNote,
                          );
                          setUnresolvedNote("");
                          refresh();
                          toast.message(
                            "Nota sesión guardada · no es incidente durable",
                          );
                        }}
                      >
                        Guardar nota sesión
                      </button>
                    </div>
                  </div>
                ) : null}

                <p>
                  <span className="font-medium">Billing:</span>{" "}
                  {c.billingOutcomeLabel}
                </p>
                {c.warnings.length > 0 ? (
                  <ul className="space-y-1 text-muted-foreground">
                    {c.warnings.map((w) => (
                      <li key={w.id}>
                        · <span className="font-medium">{w.message}</span> —{" "}
                        {w.why} → {w.nextAction}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="text-muted-foreground">
                  No implica: Order edit inventado · Customer cambiado · factura
                  · pago · POD · departamento destino aceptó
                </p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Ninguna entrega en este filtro.
        </p>
      ) : null}
    </section>
  );
}
