import { createFileRoute, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Building2, MapPin, RotateCcw, Truck } from "lucide-react";
import {
  DishThumb,
  PrimaryCTA,
  ScreenHeader,
  StatusPill,
} from "@/components/consumer";
import { useFmt } from "@/i18n/localization-provider";
import { useOrder } from "@/hooks/use-order";
import { useConfirmOrder } from "@/hooks/use-confirm-order";
import {
  useRepeatOrder,
  useRepeatOrderPreview,
} from "@/hooks/use-repeat-order";
import type { OrderSummaryStatus } from "@/modules/orders/application/order-summary-mapper";
import type { MockOrderStatus } from "@/lib/mock-catalog";

/**
 * Screen: Customer · Order Summary / Confirm / Repeat
 * - CAP-005: useOrder() real read
 * - CAP-006: Confirm Draft → Confirmed
 * - EP-002A.2: Repetir pedido (menu-validated draft)
 */
export const Route = createFileRoute("/_authenticated/app/orders/$orderId")({
  component: OrderSummary,
});

function pillTone(status: OrderSummaryStatus): MockOrderStatus {
  if (status === "draft" || status === "confirmed" || status === "pending") {
    return "pending";
  }
  if (status === "preparing") return "preparing";
  if (status === "dispatched") return "dispatched";
  if (status === "delivered") return "delivered";
  return "cancelled";
}

function formatAddress(
  address: {
    label: string | null;
    line: string;
    city: string | null;
  } | null,
): string | null {
  if (!address) return null;
  if (address.label && address.city) return `${address.label} · ${address.city}`;
  if (address.label && address.line) return `${address.label} · ${address.line}`;
  if (address.city) return `${address.line} · ${address.city}`;
  return address.line;
}

function OrderSummary() {
  const { t } = useTranslation(["customer", "common"]);
  const { orderId } = Route.useParams();
  const { data: order, isPending, isFetched } = useOrder(orderId);
  const confirmOrder = useConfirmOrder();
  const repeatOrder = useRepeatOrder();
  const repeatPreview = useRepeatOrderPreview(
    order && order.status !== "draft" && order.status !== "cancelled"
      ? order.id
      : undefined,
  );
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
    confirmed: t("customer:statusConfirmed"),
    pending: t("customer:statusPending"),
    preparing: t("customer:statusPreparing"),
    dispatched: t("customer:statusDispatched"),
    delivered: t("customer:statusDelivered"),
    cancelled: t("customer:statusCancelled"),
  };

  const isDraft = order.status === "draft";
  const addressLine = formatAddress(order.address);
  const showRepeat =
    !isDraft &&
    order.status !== "cancelled" &&
    Boolean(repeatPreview.data?.canRepeat);

  return (
    <div className="flex-1 flex flex-col pb-6">
      <ScreenHeader
        backTo="/app/orders"
        overline={order.weekLabel}
        title={t("customer:orderSummary")}
        trailing={
          <StatusPill
            status={pillTone(order.status)}
            label={statusLabels[order.status]}
          />
        }
      />

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
              <p className="text-sm mt-1">
                {addressLine ?? t("common:comingSoon")}
              </p>
            </div>
          </div>
          {order.companyName ? (
            <div className="flex items-center gap-3">
              <div className="grid place-items-center size-10 rounded-xl bg-secondary shrink-0">
                <Building2 className="size-5 text-primary" />
              </div>
              <div>
                <p className="meta-label">{t("customer:companyLabel")}</p>
                <p className="text-sm mt-1 font-semibold">{order.companyName}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

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

      {repeatPreview.data &&
      repeatPreview.data.unavailable.length > 0 &&
      showRepeat ? (
        <section className="px-6 mt-6">
          <p className="meta-label mb-2">{t("customer:repeatUnavailableTitle")}</p>
          <ul className="bg-card border border-border rounded-2xl divide-y divide-border">
            {repeatPreview.data.unavailable.map((line) => (
              <li
                key={`${line.dishId}-${line.sourceDayDate}`}
                className="px-4 py-3 text-sm"
              >
                <p className="font-semibold">
                  {line.dishName ?? line.dishId}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("customer:dishUnavailable")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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

      <div className="px-6 mt-8 space-y-3">
        {isDraft ? (
          <>
            {confirmOrder.isError ? (
              <p className="text-sm text-destructive" role="alert">
                {(confirmOrder.error as Error)?.message ?? "Error"}
              </p>
            ) : null}
            <PrimaryCTA
              disabled={confirmOrder.isPending}
              onClick={() => {
                void confirmOrder.mutateAsync(order.id);
              }}
            >
              {t("customer:confirmOrder")}
            </PrimaryCTA>
          </>
        ) : null}

        {showRepeat ? (
          <PrimaryCTA
            variant={isDraft ? "outline" : "solid"}
            disabled={repeatOrder.isPending}
            trailingIcon={false}
            onClick={() => repeatOrder.mutate(order.id)}
          >
            <span className="inline-flex items-center gap-2">
              <RotateCcw className="size-4" strokeWidth={2} />
              {t("customer:repeatOrder")}
            </span>
          </PrimaryCTA>
        ) : null}
      </div>
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
