import {
  readOrderItem,
  requireDishReader,
  type OrderItemReadModel,
} from "../domain/order-item-read-model";
import type { CatalogDish } from "@/modules/dish-library/application/dish-catalog-mapper";
import type { OrderItemRow, OrderRow } from "../infrastructure/order-repository";
import type { OrderDietarySnapshot } from "@/types/dietary";

/**
 * CAP-005 — view model for existing Order Summary screen.
 * Maps as-built order_status to the StatusPill contract without redesign.
 */
export type OrderSummaryStatus =
  "draft" | "confirmed" | "pending" | "preparing" | "dispatched" | "delivered" | "cancelled";

export type OrderSummaryItemView = {
  line: OrderItemReadModel;
  dishId: string;
  qty: number;
  dayDate: string;
  dish: CatalogDish | null;
};

export type OrderDeliveryAddressView = {
  label: string | null;
  line: string;
  city: string | null;
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
  address: OrderDeliveryAddressView | null;
  companyName: string | null;
  dietarySnapshot: OrderDietarySnapshot | null;
};

function mapDbStatus(status: string): OrderSummaryStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "confirmed":
      return "confirmed";
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
  extras: {
    address?: OrderDeliveryAddressView | null;
    companyName?: string | null;
  } = {},
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
    items: items.map((item) => {
      const dish = dishesById.get(item.dish_id) ?? null;
      const line = requireDishReader(
        readOrderItem(item, dish && { name: dish.name, description: dish.tagline }),
      );
      return {
        line,
        dishId: line.dishId,
        qty: item.qty,
        dayDate: item.day_date,
        dish:
          dish && line.metadataSource === "snapshot"
            ? {
                ...dish,
                name: line.name!,
                tagline: line.description ?? "",
                allergens: line.allergensSnapshot ?? [],
              }
            : dish,
      };
    }),
    address: extras.address ?? null,
    companyName: extras.companyName ?? null,
    dietarySnapshot: (order.dietary_snapshot as OrderDietarySnapshot | null) ?? null,
  };
}
