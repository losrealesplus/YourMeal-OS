import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";
import {
  EmptyState,
  ScreenHeader,
} from "@/components/consumer";

/**
 * Screen: Customer · Orders List
 * - Objetivo operacional: repasar pedidos pasados y en curso.
 * - Capability: orders.list
 * - Core Object(s): Order (+ Delivery status derivado)
 * - Hardening INC-06: no MOCK_ORDERS — empty until CAP-007 list wiring
 */
export const Route = createFileRoute("/_authenticated/app/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { t } = useTranslation(["customer", "common"]);

  return (
    <div className="flex-1 flex flex-col">
      <ScreenHeader
        overline={t("common:tenant")}
        title={t("customer:orders")}
        subtitle={t("customer:ordersHint")}
      />
      <div className="px-6 space-y-3 pb-6">
        <EmptyState
          icon={<ClipboardList className="size-6" />}
          title={t("customer:noOrdersTitle")}
          hint={t("customer:noOrdersHint")}
        />
      </div>
    </div>
  );
}
