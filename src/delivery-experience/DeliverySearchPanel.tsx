/**
 * DE002 — Zero Friction Delivery Search (Experience only).
 *
 * Find a delivery within today's workload without leaving Delivery Day.
 * Never Customer search · Order management · route planning · navigation · confirm.
 */

import { useEffect, useMemo, useRef, useState } from "react";
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
  rememberDeliveryAccess,
  searchDeliveries,
  type DeliverySearchHit,
} from "@/delivery-experience/delivery-search-rank";
import {
  absentOr,
  buildTodaysDeliveryDay,
  deliveryReadinessLabel,
  deliveryStatusLabel,
  type DeliveryReadiness,
  type TodaysDeliveryDay,
} from "@/delivery-experience/today-delivery";
import { utcDateOnly } from "@/menu-experience/week-plan";
import { useOrder } from "@/order/useOrder";
import {
  getOrderQuery,
  getOrdersReadyForDeliveryQuery,
} from "@/order/OrderQueries";
import type { OrderDetails, OrderSummary } from "@/order/OrderContext";
import { cn } from "@/lib/utils";

type Props = {
  dayDate?: string | null;
  onOpenDelivery: (dayDate: string, deliveryId: string) => void;
  onBackToToday: () => void;
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

export function DeliverySearchPanel({
  dayDate: focusDay,
  onOpenDelivery,
  onBackToToday,
}: Props) {
  const delivery = useDelivery();
  const order = useOrder();
  const [query, setQuery] = useState("");
  const [dayDate, setDayDate] = useState(focusDay ?? utcDateOnly());
  const [openId, setOpenId] = useState<string | null>(null);
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusDay) setDayDate(focusDay);
  }, [focusDay]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  const view: TodaysDeliveryDay = useMemo(
    () =>
      buildTodaysDeliveryDay({
        dayDate,
        context,
        completedContext,
        summariesById,
        detailsById,
        loadError,
        assignmentSupported: false,
      }),
    [dayDate, context, completedContext, summariesById, detailsById, loadError],
  );

  const ranked = useMemo(
    () => searchDeliveries(view.cards, query, dayDate).slice(0, 40),
    [view.cards, query, dayDate],
  );

  async function enrichAndToggle(hit: DeliverySearchHit) {
    setOpenId(openId === hit.id ? null : hit.id);
    if (openId === hit.id) return;
    if (detailsById[hit.commitmentRef] || !order.isReady) return;
    try {
      const got = await order.getOrder(
        getOrderQuery({ orderId: hit.commitmentRef }),
      );
      if (got.ok && got.context) {
        setDetailsById((prev) => ({
          ...prev,
          [hit.commitmentRef]: got.context!.details,
        }));
        setSummariesById((prev) => ({
          ...prev,
          [hit.commitmentRef]: got.context!.details.summary,
        }));
      }
    } catch {
      /* honesty */
    }
  }

  function openHit(hit: DeliverySearchHit) {
    rememberDeliveryAccess(hit.id);
    onOpenDelivery(dayDate, hit.id);
  }

  if (loading && view.cards.length === 0 && !view.loadError) {
    return (
      <section className="space-y-3" aria-labelledby="de-search-loading">
        <h2
          id="de-search-loading"
          className="text-sm font-semibold tracking-wide"
        >
          Buscar entregas
        </h2>
        <p className="text-xs text-muted-foreground">Cargando jornada…</p>
      </section>
    );
  }

  if (view.cards.length === 0) {
    return (
      <section className="space-y-4" aria-labelledby="de-search-empty">
        <h2
          id="de-search-empty"
          className="text-sm font-semibold tracking-wide"
        >
          Buscar entregas
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            No hay entregas en la jornada para buscar.
          </p>
          <p className="text-xs text-muted-foreground">
            {view.emptyReason ??
              "La búsqueda opera sobre Today's Delivery Day — no sobre Customer ni Order management."}
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

  return (
    <section className="space-y-5" aria-labelledby="de-search">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="de-search" className="text-sm font-semibold tracking-wide">
            Buscar entregas
          </h2>
          <p className="text-xs text-muted-foreground">
            Cliente · order · dirección · zona · ventana · estado · día — sin
            salir de la jornada
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

      <label className="block">
        <span className="sr-only">Buscar entrega</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe cliente, order, zona, estado…"
          className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
          autoComplete="off"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <StatusChip tone="info" label={`Hoy ${dayDate}`} />
        <StatusChip
          tone="positive"
          label={`${ranked.length} resultado(s)`}
        />
        <StatusChip
          tone="info"
          label={`${view.totals.total} en jornada`}
        />
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
          Build route / Navigate / Confirm → Future
        </span>
      </div>

      {!view.assignmentAvailable ? (
        <p className="text-xs text-muted-foreground">
          Driver / responsibility: no disponible en este substrate
        </p>
      ) : null}

      {ranked.length === 0 ? (
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            No hay entregas que coincidan.
          </p>
          <p className="text-xs text-muted-foreground">
            Prueba otro término o vuelve a la jornada. La búsqueda no es Customer
            Search ni Order management.
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
              to="/admin/production-planning"
              search={{ mode: "handoff", weekStart: undefined }}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Revisar Production Handoff
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {ranked.map((hit) => (
            <li
              key={hit.id}
              className={cn(
                "rounded-md border border-border/60 px-3 py-3",
                hit.readiness === "incomplete" && "border-foreground/40",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {hit.customerLabel ?? "Cliente ausente"}{" "}
                    <span className="font-normal text-muted-foreground">
                      · Order {hit.orderRef}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dirección: {absentOr(hit.addressLabel)}
                    {hit.zoneLabel ? ` · Zona: ${hit.zoneLabel}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ventana: {absentOr(hit.windowLabel)} · Paquete:{" "}
                    {absentOr(hit.packageSummary)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Conductor:{" "}
                    {view.assignmentAvailable
                      ? absentOr(hit.driverLabel)
                      : "no disponible en este substrate"}
                  </p>
                  {hit.matchHints.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Coincide: {hit.matchHints.join(" · ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1">
                  <StatusChip
                    tone={readinessTone(hit.readiness)}
                    label={deliveryReadinessLabel(hit.readiness)}
                  />
                  <StatusChip
                    tone="neutral"
                    label={deliveryStatusLabel(hit.deliveryStatus)}
                  />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => openHit(hit)}
                >
                  Abrir entrega
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => void enrichAndToggle(hit)}
                >
                  {openId === hit.id ? "Cerrar detalle" : "Ver detalle"}
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
              {openId === hit.id ? (
                <div className="mt-3 space-y-1 border-t border-border/50 pt-3 text-xs">
                  <p>
                    <span className="font-medium">Cliente:</span>{" "}
                    {absentOr(hit.customerLabel)}
                  </p>
                  <p>
                    <span className="font-medium">Order:</span> {hit.orderRef}
                  </p>
                  <p>
                    <span className="font-medium">Dirección:</span>{" "}
                    {absentOr(hit.addressLabel)}
                  </p>
                  <p>
                    <span className="font-medium">Zona:</span>{" "}
                    {absentOr(hit.zoneLabel)}
                  </p>
                  <p>
                    <span className="font-medium">Ventana:</span>{" "}
                    {absentOr(hit.windowLabel)}
                  </p>
                  <p>
                    <span className="font-medium">Avisos:</span>{" "}
                    {hit.warnings.length
                      ? hit.warnings.map((w) => w.message).join(" · ")
                      : "—"}
                  </p>
                  <p className="text-muted-foreground">
                    Búsqueda de entregas · sin rutas · sin ConfirmDelivery
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
