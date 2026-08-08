/**
 * DE004 — Zero Friction Delivery Responsibility (Experience only).
 *
 * Understand responsibility · unassigned · assignment unavailable.
 * Never invent durable AssignDelivery or a fake driver.
 * Route Preparation remains NEXT — not built here.
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
  downloadResponsibilityCsv,
  printResponsibilityDay,
} from "@/delivery-experience/export-responsibility";
import {
  buildResponsibilityDayView,
  filterResponsibilityCards,
  responsibilityStateLabel,
  type ResponsibilityFilter,
  type ResponsibilityState,
} from "@/delivery-experience/responsibility-view";
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
  onBackToToday: () => void;
};

function stateTone(
  s: ResponsibilityState,
): "positive" | "warning" | "info" | "neutral" {
  if (s === "assigned" || s === "completed") return "positive";
  if (s === "unassigned") return "warning";
  if (s === "assignment_unavailable") return "info";
  return "neutral";
}

export function DeliveryResponsibilityPanel({
  dayDate: focusDay,
  focusDeliveryId = null,
  onOpenDelivery,
  onBackToToday,
}: Props) {
  const delivery = useDelivery();
  const order = useOrder();
  const [dayDate, setDayDate] = useState(focusDay ?? utcDateOnly());
  const [filter, setFilter] = useState<ResponsibilityFilter>("all");
  const [openId, setOpenId] = useState<string | null>(focusDeliveryId);
  const [context, setContext] = useState<DeliveryContext | null>(null);
  const [completedContext, setCompletedContext] =
    useState<DeliveryContext | null>(null);
  const [summariesById, setSummariesById] = useState<
    Record<string, OrderSummary>
  >({});
  const [detailsById] = useState<Record<string, OrderDetails>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** AssignDelivery remains UNIMPLEMENTED — never flip to true from Experience */
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

  const view = useMemo(
    () =>
      buildResponsibilityDayView({
        dayDate: dayView.dayDate,
        dayLabel: dayView.dayLabel,
        cards: dayView.cards,
        assignmentSupported,
        emptyReason: dayView.emptyReason,
      }),
    [dayView, assignmentSupported],
  );

  const filtered = useMemo(
    () => filterResponsibilityCards(view.cards, filter),
    [view.cards, filter],
  );

  if (loading && view.cards.length === 0 && !loadError) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide">
          Responsabilidad de entregas
        </h2>
        <p className="text-xs text-muted-foreground">Cargando jornada…</p>
      </section>
    );
  }

  if (view.cards.length === 0) {
    return (
      <section className="space-y-4" aria-labelledby="de-resp-empty">
        <h2 id="de-resp-empty" className="text-sm font-semibold tracking-wide">
          Responsabilidad de entregas
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            Responsibility status unavailable
          </p>
          <p className="text-xs text-muted-foreground">
            {view.emptyReason ??
              "No hay entregas en la jornada para evaluar responsabilidad."}
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
              Volver a Today's Deliveries
            </button>
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
              to="/admin/delivery-workspace"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Delivery Workspace (Demo)
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="de-resp">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="de-resp" className="text-sm font-semibold tracking-wide">
            Responsabilidad de entregas
          </h2>
          <p className="text-xs text-muted-foreground">
            Quién es responsable · qué falta · sin simular conductor · sin rutas
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
          tone={view.totals.assigned ? "positive" : "neutral"}
          label={`${view.totals.assigned} assigned`}
        />
        <StatusChip
          tone={view.totals.unassigned ? "warning" : "neutral"}
          label={`${view.totals.unassigned} unassigned`}
        />
        <StatusChip
          tone={view.totals.assignmentUnavailable ? "info" : "neutral"}
          label={`${view.totals.assignmentUnavailable} unavailable`}
        />
        <StatusChip
          tone="positive"
          label={`${view.totals.completed} completed`}
        />
        <StatusChip
          tone="info"
          label={`${view.totals.remaining} remaining`}
        />
      </div>

      <div className="rounded-md border border-border/60 px-3 py-3 text-xs space-y-1">
        <p className="font-medium">{view.responsibilityStatusSummary}</p>
        <p className="text-muted-foreground">
          <span className="font-medium">Siguiente:</span> {view.nextActionHint}
        </p>
        {!view.assignmentSupported ? (
          <p>
            Driver assignment not available in this substrate · AssignDelivery
            UNIMPLEMENTED — no se inventa conductor durable
          </p>
        ) : null}
        {view.allResponsibilitiesAccountedFor ? (
          <p className="font-medium">
            All delivery responsibilities are accounted for
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todas"],
            ["unavailable", "Unavailable"],
            ["unassigned", "Unassigned"],
            ["assigned", "Assigned"],
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
          onClick={onBackToToday}
        >
          Volver a Today's Deliveries
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => printResponsibilityDay(view)}
        >
          Imprimir
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            downloadResponsibilityCsv(view);
            toast.success("CSV de responsabilidad descargado");
          }}
        >
          Exportar CSV
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            if (!view.routePreparationEligible) {
              toast.message(
                "Responsibility aún no lista para Route Preparation · revisa gaps",
              );
              return;
            }
            toast.message(
              "Route Preparation → NEXT (Experience · no implementada aquí · sin mapas)",
            );
          }}
        >
          Continuar a Route Preparation
        </button>
        <span className="text-xs text-muted-foreground">
          Build / Optimize / Navigate / Confirm → Future
        </span>
      </div>

      <ul className="space-y-3">
        {filtered.map((c) => (
          <li
            key={c.id}
            className={cn(
              "rounded-md border border-border/60 px-3 py-3",
              c.responsibilityState === "unassigned" && "border-foreground/40",
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
                  Ventana: {absentOr(c.windowLabel)} · Estado Facade:{" "}
                  {deliveryStatusLabel(c.deliveryStatus)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Conductor:{" "}
                  {c.responsibilityState === "assignment_unavailable"
                    ? "no disponible en este substrate"
                    : absentOr(c.driverLabel)}
                </p>
                {c.sessionResponsibilityNote ? (
                  <p className="text-xs text-muted-foreground">
                    Nota responsabilidad (sesión · no es AssignDelivery):{" "}
                    {c.sessionResponsibilityNote}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1">
                <StatusChip
                  tone={stateTone(c.responsibilityState)}
                  label={responsibilityStateLabel(c.responsibilityState)}
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
                onClick={() => onOpenDelivery(dayDate, c.id)}
              >
                Revisar entrega
              </button>
              <button
                type="button"
                className="text-xs underline-offset-2 hover:underline"
                onClick={() => setOpenId(openId === c.id ? null : c.id)}
              >
                {openId === c.id ? "Cerrar detalle" : "Ver detalle"}
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
              {c.responsibilityState === "unassigned" ? (
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() =>
                    toast.message(
                      "Asignar responsabilidad · substrate disponible",
                    )
                  }
                >
                  Asignar responsabilidad
                </button>
              ) : null}
              {c.responsibilityState === "assignment_unavailable" ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground"
                  disabled
                  title="AssignDelivery UNIMPLEMENTED"
                >
                  Asignar → Future (gap)
                </button>
              ) : null}
            </div>
            {openId === c.id ? (
              <div className="mt-3 space-y-1 border-t border-border/50 pt-3 text-xs">
                <p>
                  <span className="font-medium">Responsabilidad:</span>{" "}
                  {responsibilityStateLabel(c.responsibilityState)}
                </p>
                <p>
                  <span className="font-medium">Cliente:</span>{" "}
                  {absentOr(c.customerLabel)}
                </p>
                <p>
                  <span className="font-medium">Order:</span> {c.orderRef}{" "}
                  (sin cambios desde Responsibility)
                </p>
                <p>
                  <span className="font-medium">Dirección:</span>{" "}
                  {absentOr(c.addressLabel)}
                </p>
                <p className="text-muted-foreground">
                  No implica: Order cambiado · Customer cambiado · Ruta creada ·
                  Delivery confirmada
                </p>
                {c.warnings.length > 0 ? (
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {c.warnings.map((w) => (
                      <li key={w.id}>· {w.message}</li>
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
