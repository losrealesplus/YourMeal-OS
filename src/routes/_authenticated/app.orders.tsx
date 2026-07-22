import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";
import {
  EmptyState,
  OrderCard,
  ScreenHeader,
} from "@/components/consumer";
import { MOCK_ORDERS } from "@/lib/mock-catalog";

/**
 * Screen: Customer · Orders List
 * - Objetivo operacional: repasar pedidos pasados y en curso.
 * - Capability: orders.list
 * - Core Object(s): Order (+ Delivery status derivado)
 */
export const Route = createFileRoute("/_authenticated/app/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { t } = useTranslation(["customer", "common"]);
  const statusLabels = {
    pending: t("customer:statusPending"),
    preparing: t("customer:statusPreparing"),
    dispatched: t("customer:statusDispatched"),
    delivered: t("customer:statusDelivered"),
    cancelled: t("customer:statusCancelled"),
  };

  return (
    <div className="flex-1 flex flex-col">
      <ScreenHeader
        overline={t("common:tenant")}
        title={t("customer:orders")}
        subtitle={t("customer:ordersHint")}
      />
      <div className="px-6 space-y-3 pb-6">
        {MOCK_ORDERS.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="size-6" />}
            title={t("customer:noOrdersTitle")}
            hint={t("customer:noOrdersHint")}
          />
        ) : (
          MOCK_ORDERS.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              mealsLabel={t("customer:meals")}
              statusLabels={statusLabels}
            />
          ))
        )}
      </div>
    </div>
  );
}
