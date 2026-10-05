import {
  readOrderItem,
  type OrderItemReadModel,
  type OrderItemReadRow,
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
  id: string;
  unitPrice: number | null;
  priceSnapshotStatus: "captured" | "explicit_zero" | "historical_unavailable";
  line: OrderItemReadModel;
  dishId: string | null;
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
  writeContractVersion?: 1 | 2;
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
  items: Array<Omit<OrderItemRow, "dish_id"> & OrderItemReadRow>,
  dishesById: Map<string, CatalogDish>,
  extras: {
    address?: OrderDeliveryAddressView | null;
    companyName?: string | null;
  } = {},
): OrderSummaryView {
  const firstDay = items[0]?.day_date ?? order.week_start;
  return {
    id: order.id,
    writeContractVersion: order.write_contract_version ?? 1,
    weekStart: order.week_start,
    weekLabel: order.week_start,
    status: mapDbStatus(order.status),
    deliveryDateIso: `${firstDay}T12:00:00.000Z`,
    total: order.total,
    currency: "EUR",
    items: items.map((item) => {
      const dish = item.dish_id === null ? null : (dishesById.get(item.dish_id) ?? null);
      const line = readOrderItem(item, dish && { name: dish.name, description: dish.tagline });
      return {
        id: item.id,
        unitPrice: item.unit_price ?? null,
        priceSnapshotStatus: item.price_snapshot_status ?? "historical_unavailable",
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
