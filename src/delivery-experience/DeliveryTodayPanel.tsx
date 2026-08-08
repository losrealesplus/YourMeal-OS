/**
 * DE001 — Zero Friction Delivery Day · Today's Deliveries (Experience only).
 *
 * Understand the delivery workload before anyone leaves.
 * No routes · no maps · no navigation · no ConfirmDelivery UX · no fake assignment.
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
  downloadDeliveryDayCsv,
  printDeliveryDay,
} from "@/delivery-experience/export-delivery-day";
import {
  buildAdaptedTodaysDeliveryDay,
  type AdaptedDeliveryDayCard,
} from "@/delivery-experience/adapt-delivery";
import {
  absentOr,
  deliveryReadinessLabel,
  deliveryStatusLabel,
  filterDeliveryCards,
  type DeliveryDayFilter,
  type DeliveryDayWarning,
  type DeliveryReadiness,
} from "@/delivery-experience/today-delivery";
import { utcDateOnly } from "@/menu-experience/week-plan";
import { useOrder } from "@/order/useOrder";
import { getOrdersReadyForDeliveryQuery } from "@/order/OrderQueries";
import { getOrderQuery } from "@/order/OrderQueries";
import type { OrderDetails, OrderSummary } from "@/order/OrderContext";
import { cn } from "@/lib/utils";

type Props = {
  dayDate?: string | null;
  focusDeliveryId?: string | null;
};

function readinessTone(
  r: DeliveryReadiness,
): "positive" | "warning" | "info" | "neutral" {
  if (r === "completed") return "positive";
  if (r === "incomplete" || r === "unassigned") return "warning";
  if (r === "ready_with_warnings") return "info";
  if (r === "ready") return "positive";
  return "neutral";
}

function WarningNextLink({ w }: { w: DeliveryDayWarning }) {
  if (!w.nextHref) return null;
  if (w.nextHref === "order-capture") {
    return (
      <Link
        to="/admin/order-capture"
        search={{
          mode: "search",
          customerId: undefined,
          kind: undefined,
        }}
        className="text-xs underline-offset-2 hover:underline"
      >
        Revisar Orders
      </Link>
    );
  }
  if (w.nextHref === "kitchen-today") {
    return (
      <Link
        to="/admin/kitchen-today"
        search={{ mode: "today", day: undefined, workId: undefined }}
        className="text-xs underline-offset-2 hover:underline"
      >
        Revisar Kitchen
      </Link>
    );
  }
  if (w.nextHref === "production-handoff") {
    return (
      <Link
        to="/admin/production-planning"
        search={{ mode: "handoff", weekStart: undefined }}
        className="text-xs underline-offset-2 hover:underline"
      >
        Revisar Production Handoff
      </Link>
    );
  }
  if (w.nextHref === "customer-workspace") {
    return (
      <Link
        to="/admin/customer-workspace"
        className="text-xs underline-offset-2 hover:underline"
      >
        Revisar Customer
      </Link>
    );
  }
  return (
    <Link
      to="/admin/delivery-workspace"
      className="text-xs underline-offset-2 hover:underline"
    >
      Delivery Workspace (Demo)
    </Link>
  );
}

export function DeliveryTodayPanel({
  dayDate: focusDay,
  focusDeliveryId = null,
}: Props) {
  const delivery = useDelivery();
  const order = useOrder();
  const [dayDate, setDayDate] = useState(focusDay ?? utcDateOnly());
  const [filter, setFilter] = useState<DeliveryDayFilter>("all");
  const [openId, setOpenId] = useState<string | null>(focusDeliveryId);
  const [context, setContext] = useState<DeliveryContext | null>(null);
  const [completedContext, setCompletedContext] =
    useState<DeliveryContext | null>(null);
  const [summariesById, setSummariesById] = useState<
    Record<string, OrderSummary>
  >({});
  const [detailsById, setDetailsById] = useState<Record<string, OrderDetails>>(
    {},
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setCompletedContext(null);
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
        if (completed.ok && completed.context) {
          setCompletedContext(completed.context);
        } else {
          setCompletedContext(null);
        }

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
    ],
  );

  const filtered = useMemo(
    () => filterDeliveryCards(view.cards, filter),
    [view.cards, filter],
  );

  async function openDelivery(card: AdaptedDeliveryDayCard) {
    setOpenId(openId === card.id ? null : card.id);
    if (openId === card.id) return;
    if (detailsById[card.commitmentRef] || !order.isReady) return;
    try {
      const got = await order.getOrder(
        getOrderQuery({ orderId: card.commitmentRef }),
      );
      if (got.ok && got.context) {
        setDetailsById((prev) => ({
          ...prev,
          [card.commitmentRef]: got.context!.details,
        }));
        setSummariesById((prev) => ({
          ...prev,
          [card.commitmentRef]: got.context!.details.summary,
        }));
      }
    } catch {
      /* honesty: leave substrate absent */
    }
  }

  if (loading && view.cards.length === 0 && !view.loadError) {
    return (
      <section className="space-y-3" aria-labelledby="de-today-loading">
        <h2
          id="de-today-loading"
          className="text-sm font-semibold tracking-wide"
        >
          Entregas de hoy
        </h2>
        <p className="text-xs text-muted-foreground">Cargando jornada…</p>
      </section>
    );
  }

  if (view.emptyReason) {
    return (
      <section className="space-y-4" aria-labelledby="de-today-empty">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="de-today-empty"
              className="text-sm font-semibold tracking-wide"
            >
              Entregas de hoy
            </h2>
            <p className="text-xs text-muted-foreground">
              Delivery recibe — no crea el compromiso · sin rutas aún
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
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            No hay entregas listas para hoy.
          </p>
          <p className="text-xs text-muted-foreground">{view.emptyReason}</p>
          <p className="text-xs">
            <span className="font-medium">Siguiente:</span> {view.nextActionHint}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/kitchen-today"
              search={{ mode: "completion", day: dayDate, workId: undefined }}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Revisar Kitchen
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
            <Link
              to="/admin/production-planning"
              search={{ mode: "handoff", weekStart: undefined }}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Revisar Production Handoff
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const open = filtered.find((c) => c.id === openId) ?? null;

  return (
    <section className="space-y-5" aria-labelledby="de-today">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="de-today" className="text-sm font-semibold tracking-wide">
            Entregas de hoy
          </h2>
          <p className="text-xs text-muted-foreground">
            Qué debe salir · cuántas · dónde · avisos · responsabilidad (cuando
            exista)
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
          label={`${view.totals.ready} ready`}
        />
        <StatusChip
          tone={view.totals.readyWithWarnings ? "warning" : "positive"}
          label={`${view.totals.readyWithWarnings} con avisos`}
        />
        <StatusChip
          tone={view.totals.incomplete ? "warning" : "neutral"}
          label={`${view.totals.incomplete} incompletas`}
        />
        <StatusChip
          tone="info"
          label={`${view.totals.remaining} restantes`}
        />
        <StatusChip
          tone="positive"
          label={`${view.totals.completed} completadas`}
        />
        {loading ? <StatusChip tone="neutral" label="Cargando…" /> : null}
      </div>

      {!view.assignmentAvailable ? (
        <p className="text-xs text-muted-foreground">
          Driver assignment not available in this substrate · AssignDelivery →
          Future (no se inventa conductor)
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todas"],
            ["ready", "Ready"],
            ["warnings", "Avisos"],
            ["incomplete", "Incompletas"],
            ["remaining", "Restantes"],
            ["completed", "Completadas"],
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
          onClick={() => printDeliveryDay(view)}
        >
          Imprimir
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            downloadDeliveryDayCsv(view);
            toast.success("CSV de entregas descargado");
          }}
        >
          Exportar CSV
        </button>
        <span className="text-xs text-muted-foreground">
          Build route / Optimize / Navigate / Confirm → Future
        </span>
      </div>

      {view.dayReady ? (
        <div className="rounded-md border border-border/60 px-3 py-2 text-xs">
          <p className="font-medium">Jornada comprensible · Ready for Route (Future)</p>
          <p className="text-muted-foreground">
            No se construye ruta aquí. La preparación del día está clara; Route
            Preparation es una Experience posterior.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs">
          <p className="font-medium">Jornada aún no lista para salir</p>
          <p className="text-muted-foreground">{view.nextActionHint}</p>
        </div>
      )}

      {view.warnings.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold tracking-wide">Avisos</h3>
          <ul className="space-y-2">
            {view.warnings.slice(0, 12).map((w) => (
              <li
                key={w.id}
                className="rounded-md border border-border/60 px-3 py-2"
              >
                <p className="text-sm font-medium">{w.message}</p>
                <p className="text-xs text-muted-foreground">{w.why}</p>
                <p className="text-xs">
                  <span className="font-medium">Siguiente:</span> {w.nextAction}
                </p>
                <WarningNextLink w={w} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="space-y-3">
        {filtered.map((c) => (
          <li
            key={c.id}
            className={cn(
              "rounded-md border border-border/60 px-3 py-3",
              c.readiness === "incomplete" && "border-foreground/40",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  {c.customerLabel ?? "Cliente ausente"}{" "}
                  <span className="font-normal text-muted-foreground">
                    · Order {c.orderRef}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Dirección: {absentOr(c.addressLabel)}
                  {c.zoneLabel ? ` · Zona: ${c.zoneLabel}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ventana: {absentOr(c.windowLabel)} · Paquete:{" "}
                  {absentOr(c.packageSummary)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Conductor:{" "}
                  {view.assignmentAvailable
                    ? absentOr(c.driverLabel)
                    : "no disponible en este substrate"}
                </p>
                {c.addressClarification ? (
                  <p className="text-xs text-muted-foreground">
                    Aclaración operativa: {c.addressClarification}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1">
                <StatusChip
                  tone={readinessTone(c.readiness)}
                  label={deliveryReadinessLabel(c.readiness)}
                />
                <StatusChip
                  tone="neutral"
                  label={deliveryStatusLabel(c.deliveryStatus)}
                />
                {c.deliveryAdapted ? (
                  <StatusChip tone="info" label="Adaptado (sesión)" />
                ) : null}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs underline-offset-2 hover:underline"
                onClick={() => void openDelivery(c)}
              >
                {openId === c.id ? "Cerrar detalle" : "Abrir entrega"}
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
              <button
                type="button"
                className="text-xs text-muted-foreground"
                disabled
                title="AssignDelivery UNIMPLEMENTED"
              >
                Asignar responsabilidad → Future
              </button>
            </div>
            {open?.id === c.id ? (
              <div className="mt-3 space-y-1 border-t border-border/50 pt-3 text-xs">
                <p>
                  <span className="font-medium">Cliente:</span>{" "}
                  {absentOr(c.customerLabel)}
                </p>
                <p>
                  <span className="font-medium">Order:</span> {c.orderRef}
                </p>
                <p>
                  <span className="font-medium">Dirección:</span>{" "}
                  {absentOr(c.addressLabel)}
                </p>
                <p>
                  <span className="font-medium">Zona:</span>{" "}
                  {absentOr(c.zoneLabel)}
                </p>
                <p>
                  <span className="font-medium">Contacto:</span>{" "}
                  {absentOr(c.contactLabel)}
                </p>
                <p>
                  <span className="font-medium">Ventana:</span>{" "}
                  {absentOr(c.windowLabel)}
                </p>
                <p>
                  <span className="font-medium">Paquete:</span>{" "}
                  {absentOr(c.packageSummary)}
                </p>
                <p>
                  <span className="font-medium">Dietario / alérgenos:</span>{" "}
                  {absentOr(c.dietaryInfo)}
                </p>
                <p>
                  <span className="font-medium">Instrucciones:</span>{" "}
                  {absentOr(c.specialInstructions)}
                </p>
                <p className="text-muted-foreground">
                  Delivery Facade · sin rutas · sin ConfirmDelivery en esta
                  Experience
                </p>
                {c.warnings.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {c.warnings.map((w) => (
                      <li key={w.id} className="text-muted-foreground">
                        · {w.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Ninguna entrega en este filtro. Cambia el filtro o el día.
        </p>
      ) : null}
    </section>
  );
}
