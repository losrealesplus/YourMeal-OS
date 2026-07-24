import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight, ClipboardList, RotateCcw } from "lucide-react";
import { EmptyState, ScreenHeader, StatusPill } from "@/components/consumer";
import { useCustomerOrders } from "@/hooks/use-customer-orders";
import { useRepeatOrder } from "@/hooks/use-repeat-order";
import { useFmt } from "@/i18n/localization-provider";
import type { CustomerOrderListItem } from "@/modules/orders/application/order-queries";

/**
 * Screen: Customer · Orders List (EP-002A.2 Historial)
 * - Objetivo operacional: reutilizar pedidos pasados (ver · repetir).
 * - Capability: orders.list (CAP-007)
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

const STATUS_PILL_MAP: Record<
  string,
  "pending" | "preparing" | "dispatched" | "delivered" | "cancelled"
> = {
  draft: "pending",
  confirmed: "pending",
  in_production: "preparing",
  delivered: "delivered",
  cancelled: "cancelled",
};

function formatAddressLine(
  address: CustomerOrderListItem["address"],
): string | null {
  if (!address) return null;
  if (address.label && address.city) return `${address.label} · ${address.city}`;
  if (address.label) return address.label;
  if (address.city) return `${address.line} · ${address.city}`;
  return address.line;
}

function OrdersPage() {
  const { t } = useTranslation(["customer", "common"]);
  const fmt = useFmt();
  const { data: orders, isLoading } = useCustomerOrders();
  const repeatOrder = useRepeatOrder();

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
            const statusLabel = t(
              STATUS_LABEL_KEYS[order.status] ?? "customer:statusPending",
            );
            const addressLine = formatAddressLine(order.address);
            const dishPreview = order.dishNames.slice(0, 3).join(" · ");
            const canRepeat = order.status !== "cancelled" && order.status !== "draft";

            return (
              <div
                key={order.id}
                className="surface-raised border border-border/60 rounded-3xl p-5"
              >
                <Link
                  to="/app/orders/$orderId"
                  params={{ orderId: order.id }}
                  className="group block transition-opacity active:opacity-80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="meta-label">
                        {fmt.date(
                          new Date(`${order.deliveryDate}T00:00:00`),
                          "medium",
                        )}
                      </p>
                      <p className="font-bold text-lg mt-1.5 leading-tight">
                        <span className="font-mono tabular-nums">
                          {order.itemCount}
                        </span>{" "}
                        <span className="text-muted-foreground font-semibold">
                          {t("customer:meals")}
                        </span>
                      </p>
                      {dishPreview ? (
                        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                          {dishPreview}
                          {order.dishNames.length > 3 ? "…" : ""}
                        </p>
                      ) : null}
                      {addressLine ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {addressLine}
                        </p>
                      ) : null}
                      {order.companyName ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("customer:companyLabel")}: {order.companyName}
                        </p>
                      ) : null}
                    </div>
                    <StatusPill status={pillStatus} label={statusLabel} />
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="font-mono text-lg font-extrabold tabular-nums tracking-tight">
                      {fmt.currency(order.total, { currency: order.currency })}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground group-hover:text-primary">
                      {t("customer:viewOrder")}
                      <ChevronRight className="size-4" />
                    </span>
                  </div>
                </Link>

                {canRepeat ? (
                  <button
                    type="button"
                    disabled={repeatOrder.isPending}
                    onClick={() => repeatOrder.mutate(order.id)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-bold disabled:opacity-50"
                  >
                    <RotateCcw className="size-4" strokeWidth={2} />
                    {t("customer:repeatOrder")}
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
