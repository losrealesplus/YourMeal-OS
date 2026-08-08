/**
 * OPERATIONAL-003.5 · Order Workspace Demo
 *
 * Capability Demo — not the definitive Orders module.
 * Proves FOUNDATION LAW 003 + LAW 004:
 *   screen orchestrates interaction; OrderFacade owns process behaviour.
 *   Operational Experience consumes Order Capability.
 *
 * Allowed imports: useOrder · useIdentity · admin chrome · React · command/query helpers.
 * Forbidden: supabase · repositories · OrderIntake/Order/Operations services · ServiceContext.
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
import { useOrder } from "@/order/useOrder";
import { useIdentity } from "@/identity/useIdentity";
import {
  cancelOrderCommand,
  closeOrderCommand,
  completeDeliveryCommand,
  confirmOrderCommand,
  planWeeklyOrderCommand,
  readyForDeliveryCommand,
  readyForKitchenCommand,
  scheduleProductionCommand,
} from "@/order/OrderCommands";
import {
  getOperationalCalendarQuery,
  getOrderQuery,
  getOrdersByCustomerQuery,
  getOrdersByWeekQuery,
  searchOrdersQuery,
} from "@/order/OrderQueries";
import type {
  OrderCommandResult,
  OrderContext,
  OrderSummary,
} from "@/order/OrderContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute(
  "/_authenticated/admin/order-workspace",
)({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "orders.read");
  },
  component: OrderWorkspaceDemoPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Order Workspace (Demo)" },
      {
        name: "description",
        content:
          "Capability Demo: weekly operational commitment via OrderFacade only (LAW 003 · 004).",
      },
    ],
  }),
});

function mondayIso(d = new Date()): string {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x.toISOString().slice(0, 10);
}

function statusTone(
  status: string,
): "positive" | "warning" | "danger" | "neutral" {
  if (status === "delivered") return "positive";
  if (status === "cancelled" || status === "delivery_issue") return "danger";
  if (status === "draft") return "neutral";
  if (status === "confirmed" || status === "in_production") return "warning";
  return "neutral";
}

function OrderWorkspaceDemoPage() {
  const order = useOrder();
  const identity = useIdentity();
  const [weekStart, setWeekStart] = useState(mondayIso());
  const [customerFilter, setCustomerFilter] = useState("");
  const [summaries, setSummaries] = useState<OrderSummary[]>([]);
  const [calendarDays, setCalendarDays] = useState<string[]>([]);
  const [selected, setSelected] = useState<OrderContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dishId, setDishId] = useState("");
  const [dayDate, setDayDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [qty, setQty] = useState(1);
  const caps = identity.permissions.capabilities;
  const canWrite = caps.includes("orders.write");

  const loadWeek = useEffectEvent(async () => {
    if (!order.isReady) return;
    setLoading(true);
    try {
      const [listed, calendar] = await Promise.all([
        customerFilter.trim()
          ? order.getOrdersByCustomer(
              getOrdersByCustomerQuery({
                customerId: customerFilter.trim(),
                limit: 40,
              }),
            )
          : order.getOrdersByWeek(
              getOrdersByWeekQuery({ weekStart, limit: 40 }),
            ),
        order.getOperationalCalendar(
          getOperationalCalendarQuery({ weekStart }),
        ),
      ]);
      if (!listed.ok) {
        toast.error(listed.errors[0]?.message ?? "Search failed");
        setSummaries([]);
      } else {
        setSummaries(listed.summaries);
      }
      if (calendar.ok) {
        setCalendarDays(calendar.calendar.deliveryDays);
      } else {
        setCalendarDays([]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadWeek();
    }, 200);
    return () => window.clearTimeout(handle);
  }, [weekStart, customerFilter, order.isReady]);

  const openOrder = useCallback(
    async (orderId: string) => {
      setBusy(true);
      try {
        const result = await order.getOrder(getOrderQuery({ orderId }));
        if (!result.ok || !result.context) {
          toast.error(result.errors[0]?.message ?? "Not found");
          setSelected(null);
          return;
        }
        setSelected(result.context);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [order],
  );

  async function onSearchAll() {
    setBusy(true);
    try {
      const result = await order.searchOrders(
        searchOrdersQuery({ weekStart, limit: 40 }),
      );
      if (!result.ok) {
        toast.error(result.errors[0]?.message ?? "Search failed");
        return;
      }
      setSummaries(result.summaries);
      toast.success(`SearchOrders · ${result.summaries.length}`);
    } finally {
      setBusy(false);
    }
  }

  async function onPlanWeekly() {
    if (!order.isReady || !canWrite) return;
    if (!dishId.trim()) {
      toast.error("dishId required for PlanWeeklyOrder probe");
      return;
    }
    setBusy(true);
    try {
      const result = await order.planWeeklyOrder(
        planWeeklyOrderCommand({
          weekStart,
          channel: "admin",
          items: [{ dishId: dishId.trim(), dayDate, qty }],
        }),
      );
      if (!result.ok) {
        toast.error(result.errors[0]?.message ?? "PlanWeeklyOrder failed");
        return;
      }
      toast.success(`PlanWeeklyOrder · ${result.orderId} · ${result.status}`);
      if (result.orderId) await openOrder(result.orderId);
      await loadWeek();
    } finally {
      setBusy(false);
    }
  }

  async function runProcess(
    label: string,
    run: () => Promise<OrderCommandResult>,
  ) {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await run();
      if (!result.ok) {
        const code = result.errors[0]?.code ?? "UNKNOWN";
        toast.message(label, {
          description: `${code}: ${result.errors[0]?.message ?? ""}`,
        });
        return;
      }
      toast.success(`${label} → ${result.status ?? "ok"}`);
      if (selected.details.summary.id) {
        await openOrder(selected.details.summary.id);
      }
      await loadWeek();
    } finally {
      setBusy(false);
    }
  }

  const orderId = selected?.details.summary.id;

  return (
    <div className="animate-fade-in max-w-5xl">
      <SectionTitle
        overline="Operational Experience · Capability Demo"
        title="Order Workspace"
        subtitle="Demuestra LAW 003 y LAW 004: la pantalla orquesta; OrderFacade posee el proceso. No es el módulo Orders definitivo."
      />

      <AdminHeader
        goal="Probar compromiso operativo semanal vía Facade (sin Supabase en UI)"
        capability="orders.read / orders.write"
        object="OrderSummary · OrderContext · process commands"
      />

      <div className="mb-6 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm">
        <p className="font-semibold text-foreground">
          Screen → useOrder() → OrderFacade → Intake / Orders / Operations
        </p>
        <p className="mt-1 text-muted-foreground">
          Order = compromiso operativo del tenant para una semana concreta.
        </p>
        <p className="mt-1 text-muted-foreground">
          Tenant: {identity.tenant?.slug ?? "—"} · Operator:{" "}
          {identity.currentUser?.fullName ?? identity.session.userId ?? "—"} ·
          Ready: {order.isReady ? "yes" : "no"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Legacy:{" "}
          <Link
            to="/admin/orders"
            className="underline underline-offset-2 hover:text-foreground"
          >
            /admin/orders
          </Link>{" "}
          · Customer demo:{" "}
          <Link
            to="/admin/customer-workspace"
            className="underline underline-offset-2 hover:text-foreground"
          >
            /admin/customer-workspace
          </Link>
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Operational Week
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-sans normal-case tracking-normal"
          />
        </label>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          By Customer (party id)
          <input
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            placeholder="optional customerId"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-sans normal-case tracking-normal"
          />
        </label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
          <button
            type="button"
            disabled={!order.isReady || busy}
            onClick={() => void loadWeek()}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            GetOrdersByWeek / Calendar
          </button>
          <button
            type="button"
            disabled={!order.isReady || busy}
            onClick={() => void onSearchAll()}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            SearchOrders
          </button>
        </div>
      </div>

      {calendarDays.length > 0 ? (
        <p className="mb-4 text-xs text-muted-foreground">
          GetOperationalCalendar · delivery days:{" "}
          <span className="font-semibold text-foreground">
            {calendarDays.join(" · ")}
          </span>
        </p>
      ) : null}

      <div className="mb-6 rounded-md border border-dashed border-border p-3">
        <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          PlanWeeklyOrder probe
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={dishId}
            onChange={(e) => setDishId(e.target.value)}
            placeholder="dishId (uuid)"
            className="min-w-[12rem] flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs"
          />
          <input
            type="date"
            value={dayDate}
            onChange={(e) => setDayDate(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs"
          />
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
            className="w-16 rounded-md border border-border bg-background px-3 py-1.5 text-xs"
          />
          <button
            type="button"
            disabled={!order.isReady || busy || !canWrite}
            onClick={() => void onPlanWeekly()}
            className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
          >
            PlanWeeklyOrder
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Orders · week {weekStart}
          </p>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Cargando…
            </p>
          ) : summaries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin compromisos en esta semana
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {summaries.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => void openOrder(s.id)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/40",
                      selected?.details.summary.id === s.id && "bg-muted/50",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {s.partyRef.displayName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.id.slice(0, 8)} · {s.partyRef.kind} · items{" "}
                        {s.itemCount}
                      </p>
                    </div>
                    <StatusChip tone={statusTone(s.status)} label={s.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            GetOrder · process commands
          </p>
          {!selected ? (
            <p className="rounded-md border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
              Selecciona un compromiso operativo
            </p>
          ) : (
            <div className="space-y-3 rounded-md border border-border p-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {selected.details.summary.partyRef.displayName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selected.details.summary.id} · week{" "}
                  {selected.details.summary.week.weekStart}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-semibold">
                    {selected.details.summary.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Delivery day</dt>
                  <dd className="font-semibold">
                    {selected.details.summary.deliveryDayPrimary ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">canWrite</dt>
                  <dd className="font-semibold">
                    {selected.permissions.canWrite ? "yes" : "no"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Lines</dt>
                  <dd className="font-semibold">
                    {selected.details.lines.length}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 border-t border-dashed border-border pt-2">
                <button
                  type="button"
                  disabled={busy || !canWrite || !orderId}
                  onClick={() =>
                    void runProcess("ConfirmOrder", () =>
                      order.confirmOrder(
                        confirmOrderCommand({ orderId: orderId! }),
                      ),
                    )
                  }
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  ConfirmOrder
                </button>
                <button
                  type="button"
                  disabled={busy || !canWrite || !orderId}
                  onClick={() =>
                    void runProcess("ScheduleProduction", () =>
                      order.scheduleProduction(
                        scheduleProductionCommand({ orderId: orderId! }),
                      ),
                    )
                  }
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  ScheduleProduction
                </button>
                <button
                  type="button"
                  disabled={busy || !canWrite || !orderId}
                  onClick={() =>
                    void runProcess("ReadyForKitchen", () =>
                      order.readyForKitchen(
                        readyForKitchenCommand({ orderId: orderId! }),
                      ),
                    )
                  }
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  ReadyForKitchen
                </button>
                <button
                  type="button"
                  disabled={busy || !canWrite || !orderId}
                  onClick={() =>
                    void runProcess("ReadyForDelivery", () =>
                      order.readyForDelivery(
                        readyForDeliveryCommand({ orderId: orderId! }),
                      ),
                    )
                  }
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  ReadyForDelivery
                </button>
                <button
                  type="button"
                  disabled={busy || !canWrite || !orderId}
                  onClick={() =>
                    void runProcess("CompleteDelivery", () =>
                      order.completeDelivery(
                        completeDeliveryCommand({ orderId: orderId! }),
                      ),
                    )
                  }
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  CompleteDelivery
                </button>
                <button
                  type="button"
                  disabled={busy || !orderId}
                  onClick={() =>
                    void runProcess("CloseOrder", () =>
                      order.closeOrder(closeOrderCommand({ orderId: orderId! })),
                    )
                  }
                  className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-40"
                >
                  CloseOrder (expect UNIMPLEMENTED)
                </button>
                <button
                  type="button"
                  disabled={busy || !orderId}
                  onClick={() =>
                    void runProcess("CancelOrder", () =>
                      order.cancelOrder(
                        cancelOrderCommand({
                          orderId: orderId!,
                          reason: "workspace-demo-probe",
                        }),
                      ),
                    )
                  }
                  className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-40"
                >
                  CancelOrder (expect UNIMPLEMENTED)
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
