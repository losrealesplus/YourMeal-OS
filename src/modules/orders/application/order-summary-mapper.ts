import type { CatalogDish } from "@/modules/dish-library/application/dish-catalog-mapper";
import type { OrderItemRow, OrderRow } from "../infrastructure/order-repository";

/**
 * CAP-005 — view model for existing Order Summary screen.
 * Maps as-built order_status to the StatusPill contract without redesign.
 */
export type OrderSummaryStatus =
  | "draft"
  | "pending"
  | "preparing"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type OrderSummaryItemView = {
  dishId: string;
  qty: number;
  dayDate: string;
  dish: CatalogDish | null;
};

export type OrderSummaryView = {
  id: string;
  weekStart: string;
  weekLabel: string;
  status: OrderSummaryStatus;
  /** ISO datetime for delivery day display (noon UTC of first item day). */
  deliveryDateIso: string;
  total: number;
  currency: string;
  items: OrderSummaryItemView[];
};

function mapDbStatus(status: string): OrderSummaryStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "confirmed":
      return "pending";
    case "in_production":
      return "preparing";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

export function mapOrderToSummaryView(
  order: OrderRow,
  items: OrderItemRow[],
  dishesById: Map<string, CatalogDish>,
): OrderSummaryView {
  const firstDay = items[0]?.day_date ?? order.week_start;
  return {
    id: order.id,
    weekStart: order.week_start,
    weekLabel: order.week_start,
    status: mapDbStatus(order.status),
    deliveryDateIso: `${firstDay}T12:00:00.000Z`,
    total: order.total,
    currency: "EUR",
    items: items.map((item) => ({
      dishId: item.dish_id,
      qty: item.qty,
      dayDate: item.day_date,
      dish: dishesById.get(item.dish_id) ?? null,
    })),
  };
}
