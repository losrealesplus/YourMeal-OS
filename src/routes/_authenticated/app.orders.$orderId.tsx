import { createFileRoute, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MapPin, Truck } from "lucide-react";
import {
  DishThumb,
  ScreenHeader,
  StatusPill,
} from "@/components/consumer";
import { useFmt } from "@/i18n/localization-provider";
import { useOrder } from "@/hooks/use-order";
import type { OrderSummaryStatus } from "@/modules/orders/application/order-summary-mapper";

/**
 * Screen: Customer · Order Summary
 * - Objetivo operacional: verificar detalle del pedido y entrega.
 * - Capability: orders.read · delivery.track
 * - Core Object(s): Order · OrderItem · Delivery
 * - CAP-005: useOrder() real Draft/order read (no Confirm — CAP-006)
 */
export const Route = createFileRoute("/_authenticated/app/orders/$orderId")({
  component: OrderSummary,
});

function OrderSummary() {
  const { t } = useTranslation(["customer", "common"]);
  const { orderId } = Route.useParams();
  const { data: order, isPending, isFetched } = useOrder(orderId);
  const fmt = useFmt();

  if (isPending) {
    return <div className="flex-1 flex flex-col" aria-busy="true" />;
  }
  if (isFetched && !order) {
    throw notFound();
  }
  if (!order) {
    return <div className="flex-1 flex flex-col" aria-busy="true" />;
  }

  const statusLabels: Record<OrderSummaryStatus, string> = {
    draft: t("customer:statusDraft"),
    pending: t("customer:statusPending"),
    preparing: t("customer:statusPreparing"),
    dispatched: t("customer:statusDispatched"),
    delivered: t("customer:statusDelivered"),
    cancelled: t("customer:statusCancelled"),
  };

  const pillStatus = order.status === "draft" ? "pending" : order.status;

  return (
    <div className="flex-1 flex flex-col pb-6">
      <ScreenHeader
        backTo="/app/orders"
        overline={order.weekLabel}
        title={t("customer:orderSummary")}
        trailing={
          <StatusPill status={pillStatus} label={statusLabels[order.status]} />
        }
      />

      {/* Delivery block */}
      <section className="px-6">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center size-10 rounded-xl bg-secondary shrink-0">
              <Truck className="size-5 text-primary" />
            </div>
            <div>
              <p className="meta-label">{t("customer:deliveryDay")}</p>
              <p className="font-bold mt-1">{fmt.dateTime(order.deliveryDateIso)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="grid place-items-center size-10 rounded-xl bg-secondary shrink-0">
              <MapPin className="size-5 text-primary" />
            </div>
            <div>
              <p className="meta-label">{t("customer:deliveryAddress")}</p>
              <p className="text-sm mt-1">{t("common:comingSoon")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Items */}
      <section className="px-6 mt-6">
        <p className="meta-label mb-2">{t("customer:orderItems")}</p>
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {order.items.map((it) => {
            const dish = it.dish;
            if (!dish) return null;
            return (
              <div key={`${it.dishId}-${it.dayDate}`} className="flex items-center gap-3 p-3">
                <DishThumb emoji={dish.emoji} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{dish.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {dish.kcal} kcal
                  </p>
                </div>
                <span className="font-mono text-sm font-bold tabular-nums">
                  ×{it.qty}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Totals */}
      <section className="px-6 mt-6">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <TotalsRow
            label={t("customer:subtotal")}
            value={fmt.currency(order.total, { currency: order.currency })}
          />
          <TotalsRow
            label={t("customer:deliveryFee")}
            value={fmt.currency(0, { currency: order.currency })}
          />
          <div className="border-t border-border pt-3 mt-1 flex items-center justify-between">
            <span className="font-bold">{t("customer:total")}</span>
            <span className="font-mono text-lg font-extrabold tabular-nums">
              {fmt.currency(order.total, { currency: order.currency })}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function TotalsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums text-sm font-semibold">
        {value}
      </span>
    </div>
  );
}
