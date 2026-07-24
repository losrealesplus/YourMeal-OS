import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight, ClipboardList } from "lucide-react";
import { EmptyState, ScreenHeader, StatusPill } from "@/components/consumer";
import { useCustomerOrders } from "@/hooks/use-customer-orders";
import { useFmt } from "@/i18n/localization-provider";

/**
 * Screen: Customer · Orders List
 * - Objetivo operacional: repasar pedidos pasados y en curso.
 * - Capability: orders.list (CAP-007)
 * - Core Object(s): Order
 */
export const Route = createFileRoute("/_authenticated/app/orders")({
  component: OrdersPage,
});

const STATUS_LABEL_KEYS: Record<string, string> = {
  draft: "customer:statusDraft",
  confirmed: "customer:statusConfirmed",
  in_production: "customer:statusPreparing",
  delivered: "customer:statusDelivered",
  cancelled: "customer:statusCancelled",
};

const STATUS_PILL_MAP: Record<string, "pending" | "preparing" | "dispatched" | "delivered" | "cancelled"> = {
  draft: "pending",
  confirmed: "pending",
  in_production: "preparing",
  delivered: "delivered",
  cancelled: "cancelled",
};

function OrdersPage() {
  const { t } = useTranslation(["customer", "common"]);
  const fmt = useFmt();
  const { data: orders, isLoading } = useCustomerOrders();

  return (
    <div className="flex-1 flex flex-col">
      <ScreenHeader
        overline={t("common:tenant")}
        title={t("customer:orders")}
        subtitle={t("customer:ordersHint")}
      />
      <div className="px-6 space-y-3 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-28 rounded-3xl bg-muted/40 animate-pulse" />
            <div className="h-28 rounded-3xl bg-muted/40 animate-pulse" />
          </div>
        ) : !orders || orders.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="size-6" />}
            title={t("customer:noOrdersTitle")}
            hint={t("customer:noOrdersHint")}
          />
        ) : (
          orders.map((order) => {
            const pillStatus = STATUS_PILL_MAP[order.status] ?? "pending";
            const statusLabel = t(STATUS_LABEL_KEYS[order.status] ?? "customer:statusPending");
            return (
              <Link
                key={order.id}
                to="/app/orders/$orderId"
                params={{ orderId: order.id }}
                className="group block surface-raised border border-border/60 rounded-3xl p-5 transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.995]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="meta-label">
                      {fmt.date(new Date(`${order.weekStart}T00:00:00`), { dateStyle: "medium" })}
                    </p>
                    <p className="font-bold text-lg mt-1.5 leading-tight">
                      <span className="font-mono tabular-nums">{order.itemCount}</span>{" "}
                      <span className="text-muted-foreground font-semibold">
                        {t("customer:meals")}
                      </span>
                    </p>
                  </div>
                  <StatusPill status={pillStatus} label={statusLabel} />
                </div>
                <div className="mt-5 pt-4 border-t border-border/60 flex items-end justify-between">
                  <span className="font-mono text-lg font-extrabold tabular-nums tracking-tight">
                    {fmt.currency(order.total, { currency: order.currency })}
                  </span>
                  <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:text-primary group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
