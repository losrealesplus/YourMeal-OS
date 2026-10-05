import { describe, expect, it } from "vitest";
import { readOrderItem } from "@/modules/orders/domain/order-item-read-model";
import { buildProductionReport } from "@/modules/operations/domain/production-report";
import { buildOperationalLabels } from "./operational-labels";

describe("captured source labels", () => {
  it("never replaces an UNKNOWN source with a same-Dish declaration or representative name", () => {
    const source = { dish_id: "dish", snapshot_captured_at: "2026-10-05T12:00:00Z" };
    const readers = [
      readOrderItem({
        ...source,
        id: "source-1",
        name_snapshot: "Nombre capturado A",
        allergen_state: "DECLARED",
        allergens_snapshot: ["gluten"],
      }),
      readOrderItem({
        ...source,
        id: "source-2",
        name_snapshot: "Nombre capturado B",
        allergen_state: "UNKNOWN",
        allergens_snapshot: [],
      }),
      readOrderItem({
        ...source,
        id: "custom-1",
        dish_id: null,
        item_kind: "custom",
        name_snapshot: "Nombre capturado A",
        allergen_state: "UNKNOWN",
        allergens_snapshot: [],
      }),
    ];
    const report = buildProductionReport({
      deliveryDate: "2026-10-06",
      lines: readers.map((line) => ({
        line,
        orderItemId: line.orderItemId,
        orderId: "order",
        orderStatus: "confirmed",
        customerId: "customer",
        customerName: "Cliente",
        dishId: line.dishId,
        dishName: line.name,
        qty: 1,
        dayDate: "2026-10-06",
        comment: null,
      })),
    });
    const labels = buildOperationalLabels(report);
    expect(labels).toHaveLength(3);
    expect(labels[0]).toMatchObject({
      dishName: "Nombre capturado A",
      allergens: ["gluten"],
      allergenState: "DECLARED",
    });
    expect(labels[1]).toMatchObject({
      dishName: "Nombre capturado B",
      allergens: [],
      allergenState: "UNKNOWN",
    });
    expect(labels[2]).toMatchObject({
      itemIdentity: "custom:custom-1",
      dishName: "Nombre capturado A",
      allergens: [],
      allergenState: "UNKNOWN",
      nativeCustom: true,
    });
    expect(new Set(labels.map((label) => label.key)).size).toBe(3);
  });
});
