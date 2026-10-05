import { describe, expect, it } from "vitest";
import { readOrderItem } from "@/modules/orders/domain/order-item-read-model";
import { buildProductionReport } from "@/modules/operations/domain/production-report";
import { mapReportToBatches, mapReportToLoad } from "./mapProduction";
import { mapBatchToExecutionUnit, parseUnitId, progressForUnit } from "@/kitchen/mapKitchen";

describe("native custom production and execution read contracts", () => {
  it("retains homonymous identities, UNKNOWN and unavailable recipe, with no legacy execution identity", () => {
    const custom = readOrderItem({
      id: "source-1",
      item_kind: "custom",
      dish_id: null,
      name_snapshot: "Sopa",
      description_snapshot: "Nota",
      allergen_state: "UNKNOWN",
      allergens_snapshot: [],
      snapshot_captured_at: "2026-10-05T12:00:00Z",
    });
    if (custom.kind !== "custom") throw new Error("Expected custom fixture");
    const report = buildProductionReport({
      deliveryDate: "2026-10-06",
      lines: [
        custom,
        { ...custom, orderItemId: "source-2", identity: "custom:source-2" as const },
      ].map((line) => ({
        line,
        orderItemId: line.orderItemId,
        orderId: "order",
        orderStatus: "confirmed",
        customerId: "customer",
        customerName: "Cliente",
        dishId: null,
        dishName: line.name,
        qty: 2,
        dayDate: "2026-10-06",
        comment: null,
      })),
    });
    const batches = mapReportToBatches(report);
    expect(batches).toHaveLength(2);
    expect(batches[0]?.id).not.toBe(batches[1]?.id);
    expect(batches[0]).toMatchObject({
      dishId: null,
      itemIdentity: "custom:source-1",
      kind: "custom",
      allergenState: "UNKNOWN",
      recipeState: "NOT_AVAILABLE",
      status: "blocked",
      constraints: { isCustom: true, allergens: [] },
      readiness: { releasedToKitchen: false },
    });
    expect(mapReportToLoad(report).estimatedPrepMinutes).toBeNull();
    const unit = mapBatchToExecutionUnit(batches[0]!);
    expect(unit).toMatchObject({
      dishId: null,
      itemIdentity: "custom:source-1",
      status: "BLOCKED",
      allergenState: "UNKNOWN",
    });
    expect(progressForUnit(unit).percent).toBe(0);
    expect(parseUnitId(unit.id)).toBeNull();
    expect(parseUnitId("batch:2026-10-06:dish-1")).toEqual({
      dayDate: "2026-10-06",
      dishId: "dish-1",
    });
  });
});
