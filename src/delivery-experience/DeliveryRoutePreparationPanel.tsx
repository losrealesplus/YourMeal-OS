/**
 * DE005 — Zero Friction Route Preparation (Experience only).
 *
 * Manual delivery-day sequence · not optimization · not maps · not navigation.
 * Session plan only. Never invent AssignDelivery or ConfirmDelivery.
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
import { buildAdaptedTodaysDeliveryDay } from "@/delivery-experience/adapt-delivery";
import {
  downloadRoutePrepCsv,
  printRoutePrepDay,
} from "@/delivery-experience/export-route-preparation";
import {
  applyMoveRelative,
  applyRemoveFromSequence,
  applyReorder,
  buildRoutePrepDayView,
  confirmRoutePreparation,
  previewReorder,
  previewRemoveFromSequence,
  responsibilityStateLabel,
  type RoutePrepImpact,
} from "@/delivery-experience/route-preparation";
import { absentOr } from "@/delivery-experience/today-delivery";
import { utcDateOnly } from "@/menu-experience/week-plan";
import { useOrder } from "@/order/useOrder";
import { getOrdersReadyForDeliveryQuery } from "@/order/OrderQueries";
import type { OrderDetails, OrderSummary } from "@/order/OrderContext";
import { cn } from "@/lib/utils";

type Props = {
  dayDate?: string | null;
  focusDeliveryId?: string | null;
  onOpenDelivery: (dayDate: string, deliveryId: string) => void;
  onOpenResponsibility: (dayDate: string, deliveryId?: string) => void;
  onBackToToday: () => void;
};

function readinessTone(
  r: string,
): "positive" | "warning" | "info" | "neutral" {
  if (r === "ready") return "positive";
  if (r === "ready_with_warnings") return "warning";
  if (r === "incomplete" || r === "unassigned") return "warning";
  if (r === "route_preparation_unavailable") return "info";
  return "neutral";
}

export function DeliveryRoutePreparationPanel({
  dayDate: focusDay,
  focusDeliveryId = null,
  onOpenDelivery,
  onOpenResponsibility,
  onBackToToday,
}: Props) {
  const delivery = useDelivery();
  const order = useOrder();
  const [dayDate, setDayDate] = useState(focusDay ?? utcDateOnly());
  const [openId, setOpenId] = useState<string | null>(focusDeliveryId);
  const [pendingImpact, setPendingImpact] = useState<RoutePrepImpact | null>(
    null,
  );
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(
    null,
  );
  const [tick, setTick] = useState(0);
  const [context, setContext] = useState<DeliveryContext | null>(null);
  const [completedContext, setCompletedContext] =
    useState<DeliveryContext | null>(null);
  const [summariesById, setSummariesById] = useState<
    Record<string, OrderSummary>
  >({});
  const [detailsById] = useState<Record<string, OrderDetails>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetPos, setTargetPos] = useState("1");

  /** AssignDelivery remains UNIMPLEMENTED — never flip from Experience */
  const assignmentSupported = false;

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
  }, [dayDate, delivery, order]);

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
    return buildRoutePrepDayView({
      dayDate: dayView.dayDate,
      dayLabel: dayView.dayLabel,
      cards: dayView.cards,
      assignmentSupported,
      emptyReason: dayView.emptyReason,
    });
  }, [dayView, assignmentSupported, tick]);

  function refresh() {
    setTick((n) => n + 1);
  }

  function stageImpact(impact: RoutePrepImpact | null, apply: () => void) {
    if (!impact) return;
    setPendingImpact(impact);
    setPendingAction(() => apply);
  }

  function confirmPending() {
    pendingAction?.();
    setPendingImpact(null);
    setPendingAction(null);
    refresh();
    toast.success("Secuencia actualizada (sesión · no optimización)");
  }

  function cancelPending() {
    setPendingImpact(null);
    setPendingAction(null);
  }

  if (loading && view.sequence.length === 0 && !view.emptyReason && !loadError) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide">
          Preparación de jornada
        </h2>
        <p className="text-xs text-muted-foreground">Cargando entregas…</p>
      </section>
    );
  }

  if (view.sequence.length === 0 && view.pool.length === 0) {
    return (
      <section className="space-y-4" aria-labelledby="de-route-empty">
        <h2 id="de-route-empty" className="text-sm font-semibold tracking-wide">
          Preparación de jornada
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            No deliveries available for route preparation
          </p>
          <p className="text-xs text-muted-foreground">
            {view.emptyReason ?? view.statusSummary}
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
              onClick={() => onOpenResponsibility(dayDate)}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Revisar Responsibility
            </button>
            <Link
              to="/admin/production-planning"
              search={{ mode: "handoff", weekStart: undefined }}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Production Handoff
            </Link>
            <Link
              to="/admin/order-capture"
              search={{
                mode: "search",
                customerId: undefined,
                kind: undefined,
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Revisar Orders
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="de-route">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="de-route" className="text-sm font-semibold tracking-wide">
            Preparación de jornada
          </h2>
          <p className="text-xs text-muted-foreground">
            Secuencia ejecutable · no optimización · no mapas · no navegación
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
        <StatusChip tone="positive" label={`${view.totals.ready} ready`} />
        <StatusChip
          tone={view.totals.unassigned ? "warning" : "neutral"}
          label={`${view.totals.unassigned} unassigned`}
        />
        <StatusChip
          tone={view.totals.incomplete ? "warning" : "neutral"}
          label={`${view.totals.incomplete} incomplete`}
        />
        <StatusChip
          tone="info"
          label={`${view.totals.remaining} remaining`}
        />
        <StatusChip
          tone="info"
          label={`${view.totals.preparedSequence} en secuencia`}
        />
        <StatusChip
          tone={readinessTone(view.readiness)}
          label={view.readinessLabel}
        />
        <StatusChip tone="neutral" label="persistencia: sesión" />
      </div>

      <div className="rounded-md border border-border/60 px-3 py-3 text-xs space-y-1">
        <p className="font-medium">{view.statusSummary}</p>
        <p className="text-muted-foreground">
          <span className="font-medium">Siguiente:</span> {view.nextActionHint}
        </p>
        {!view.assignmentSupported ? (
          <p>
            Driver assignment not available in this substrate · AssignDelivery
            UNIMPLEMENTED — la secuencia no implica conductor aceptado
          </p>
        ) : null}
        {view.confirmedAt ? (
          <p>
            Preparación confirmada (sesión):{" "}
            {new Date(view.confirmedAt).toLocaleString()}
          </p>
        ) : (
          <p className="text-muted-foreground">
            Preparación aún no confirmada · Ready for Driver / Navigate → Future
          </p>
        )}
        {view.dayWarnings.map((w) => (
          <p key={w.id} className="text-muted-foreground">
            · {w.message} — {w.why}
          </p>
        ))}
      </div>

      {pendingImpact ? (
        <div className="rounded-md border border-foreground/30 px-3 py-3 text-xs space-y-2">
          <p className="font-medium">Impacto de secuencia (antes de confirmar)</p>
          <p>{pendingImpact.summary}</p>
          <p>
            Entrega: {pendingImpact.customerLabel} · Order{" "}
            {pendingImpact.orderRef}
          </p>
          <p>
            Posición: {pendingImpact.previousPosition ?? "fuera"} →{" "}
            {pendingImpact.newPosition ?? "fuera"}
          </p>
          <p>
            Cambia: {pendingImpact.changed.join(" · ") || "—"}
          </p>
          <p className="text-muted-foreground">
            No cambia: {pendingImpact.unchanged.join(" · ")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-10 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background"
              onClick={confirmPending}
            >
              Confirmar cambio
            </button>
            <button
              type="button"
              className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-xs"
              onClick={cancelPending}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
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
          onClick={() => onOpenResponsibility(dayDate)}
        >
          Revisar Responsibility
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => printRoutePrepDay(view)}
        >
          Imprimir / PDF
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            downloadRoutePrepCsv(view);
            toast.success("CSV de preparación descargado");
          }}
        >
          Exportar CSV
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            const result = confirmRoutePreparation(dayDate, dayView.cards);
            refresh();
            toast.success(result.summary);
          }}
        >
          Confirmar preparación
        </button>
        <button
          type="button"
          className="text-xs text-muted-foreground"
          disabled
          title="Future"
        >
          Optimize Route → Future
        </button>
        <button
          type="button"
          className="text-xs text-muted-foreground"
          disabled
          title="Future"
        >
          Navigate → Future
        </button>
        <button
          type="button"
          className="text-xs text-muted-foreground"
          disabled
          title="Future"
        >
          Notify / Confirm → Future
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          Secuencia preparada
        </h3>
        <ol className="space-y-3">
          {view.sequence.map((c) => (
            <li
              key={c.deliveryId}
              className={cn(
                "rounded-md border border-border/60 px-3 py-3",
                c.warnings.some((w) => w.severity === "error") &&
                  "border-foreground/40",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    <span className="mr-2 inline-flex h-6 min-w-6 items-center justify-center rounded bg-foreground px-1.5 text-xs text-background">
                      {c.sequenceNumber}
                    </span>
                    {c.customerLabel ?? "Cliente ausente"}{" "}
                    <span className="font-normal text-muted-foreground">
                      · Order {c.orderRef}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dónde: {absentOr(c.addressLabel)}
                    {c.zoneLabel ? ` · Zona: ${c.zoneLabel}` : ""}
                  </p>
                  {c.addressClarification ? (
                    <p className="text-xs text-muted-foreground">
                      Aclaración dirección (sesión · ≠ Customer record):{" "}
                      {c.addressClarification}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Cuándo: {absentOr(c.windowLabel)}
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
                  {c.packageSummary ? (
                    <p className="text-xs text-muted-foreground">
                      Paquete: {c.packageSummary}
                    </p>
                  ) : null}
                  {c.specialInstructions ? (
                    <p className="text-xs text-muted-foreground">
                      Instrucciones: {c.specialInstructions}
                    </p>
                  ) : null}
                </div>
                <StatusChip
                  tone={
                    c.responsibilityState === "assignment_unavailable"
                      ? "info"
                      : c.responsibilityState === "unassigned"
                        ? "warning"
                        : "neutral"
                  }
                  label={responsibilityStateLabel(c.responsibilityState)}
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => onOpenDelivery(dayDate, c.deliveryId)}
                >
                  Abrir entrega
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() =>
                    onOpenResponsibility(dayDate, c.deliveryId)
                  }
                >
                  Revisar responsibility
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => setOpenId(openId === c.deliveryId ? null : c.deliveryId)}
                >
                  {openId === c.deliveryId ? "Cerrar" : "Revisar dirección / avisos"}
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  disabled={c.sequenceNumber <= 1}
                  onClick={() =>
                    stageImpact(
                      previewReorder(
                        dayDate,
                        c.deliveryId,
                        c.sequenceNumber - 2,
                        dayView.cards,
                      ),
                      () => {
                        applyMoveRelative(
                          dayDate,
                          c.deliveryId,
                          -1,
                          dayView.cards,
                        );
                      },
                    )
                  }
                >
                  Subir
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  disabled={c.sequenceNumber >= view.sequence.length}
                  onClick={() =>
                    stageImpact(
                      previewReorder(
                        dayDate,
                        c.deliveryId,
                        c.sequenceNumber,
                        dayView.cards,
                      ),
                      () => {
                        applyMoveRelative(
                          dayDate,
                          c.deliveryId,
                          1,
                          dayView.cards,
                        );
                      },
                    )
                  }
                >
                  Bajar
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() =>
                    stageImpact(
                      previewRemoveFromSequence(
                        dayDate,
                        c.deliveryId,
                        dayView.cards,
                      ),
                      () => {
                        applyRemoveFromSequence(
                          dayDate,
                          c.deliveryId,
                          dayView.cards,
                        );
                      },
                    )
                  }
                >
                  Quitar de secuencia
                </button>
              </div>

              {openId === c.deliveryId ? (
                <div className="mt-3 space-y-2 border-t border-border/50 pt-3 text-xs">
                  <label className="flex flex-wrap items-center gap-2">
                    Reordenar a posición
                    <input
                      type="number"
                      min={1}
                      max={view.sequence.length}
                      className="h-9 w-16 rounded-md border border-border px-2"
                      value={targetPos}
                      onChange={(e) => setTargetPos(e.target.value)}
                    />
                    <button
                      type="button"
                      className="underline-offset-2 hover:underline"
                      onClick={() => {
                        const n = Number(targetPos);
                        if (!Number.isFinite(n) || n < 1) return;
                        stageImpact(
                          previewReorder(
                            dayDate,
                            c.deliveryId,
                            n - 1,
                            dayView.cards,
                          ),
                          () => {
                            applyReorder(
                              dayDate,
                              c.deliveryId,
                              n - 1,
                              dayView.cards,
                            );
                          },
                        );
                      }}
                    >
                      Previsualizar
                    </button>
                  </label>
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
                    No implica: Order cambiado · Customer cambiado · ruta
                    optimizada · conductor aceptó · Delivery confirmada
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      {view.pool.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            Fuera de secuencia (insertar)
          </h3>
          <ul className="space-y-2">
            {view.pool.map((c) => (
              <li
                key={c.deliveryId}
                className="rounded-md border border-dashed border-border px-3 py-2 text-xs"
              >
                <p className="font-medium">
                  {c.customerLabel ?? "Cliente ausente"} · Order {c.orderRef}
                </p>
                <button
                  type="button"
                  className="mt-1 underline-offset-2 hover:underline"
                  onClick={() =>
                    stageImpact(
                      previewReorder(
                        dayDate,
                        c.deliveryId,
                        view.sequence.length,
                        dayView.cards,
                      ),
                      () => {
                        applyReorder(
                          dayDate,
                          c.deliveryId,
                          view.sequence.length,
                          dayView.cards,
                        );
                      },
                    )
                  }
                >
                  Insertar al final de secuencia
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
