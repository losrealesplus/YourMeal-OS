import { describe, expect, it } from "vitest";
import { readOrderItem } from "@/modules/orders/domain/order-item-read-model";
import { buildProductionReport, type ProductionSourceLine } from "./production-report";

const custom = (id: string, qty = 1): ProductionSourceLine => ({
  orderId: `order-${id}`,
  orderStatus: "confirmed",
  customerId: "customer",
  customerName: "Ana",
  orderItemId: id,
  dishId: null,
  dishName: "Catalogue fallback must not win",
  qty,
  dayDate: "2026-10-05",
  comment: "Nota operativa",
  line: readOrderItem({
    id,
    dish_id: null,
    item_kind: "custom",
    name_snapshot: "Sopa especial",
    allergen_state: "UNKNOWN",
    allergens_snapshot: [],
    snapshot_captured_at: "2026-10-05T10:00:00Z",
  }),
});

describe("native custom production and packing readers", () => {
  it("keeps homonyms separate across every report projection and totals", () => {
    const report = buildProductionReport({
      deliveryDate: "2026-10-05",
      lines: [custom("one", 2), custom("two", 3)],
    });
    expect(report.standardDishes.map((row) => row.itemIdentity)).toEqual([
      "custom:one",
      "custom:two",
    ]);
    expect(report.packingByDish.map((row) => row.totalQty)).toEqual([2, 3]);
    expect(
      report.packingByCustomer.flatMap((row) => row.items).map((row) => row.itemIdentity),
    ).toEqual(["custom:one", "custom:two"]);
    expect(report.totals.portionCount).toBe(5);
    expect(report.customizations).toEqual([]); // Native custom is not a comment-based dish modification.
    for (const row of report.standardDishes) {
      expect(row).toMatchObject({
        dishId: null,
        kind: "custom",
        marker: "PERSONALIZADO",
        dishName: "Sopa especial",
        allergens: [],
        allergenState: "UNKNOWN",
        recipeState: "NOT_AVAILABLE",
        prepMinutes: null,
        weightG: null,
      });
    }
  });

  it("does not invent ingredients or catalogue enrichment for custom identity", () => {
    const report = buildProductionReport({
      deliveryDate: "2026-10-05",
      lines: [custom("one", 4)],
      dishMetaById: new Map([
        ["custom:one", { allergens: ["MILK"], prepMinutes: 20, weightG: 500 }],
      ]),
      recipeLines: [
        { dishId: "custom:one", ingredientId: "milk", ingredientName: "Milk", qty: 30, unit: "g" },
      ],
      batchStatusByDish: new Map([
        ["custom:one", { status: "preparing", updatedAt: "2026-10-05T11:00:00Z" }],
      ]),
    });
    expect(report.ingredientSummary).toEqual([]);
    expect(report.standardDishes[0]?.allergens).toEqual([]);
    expect(report.standardDishes[0]?.batchStatus).toBe("preparing");
  });

  it("uses captured dish name and declaration ahead of current catalogue", () => {
    const row: ProductionSourceLine = {
      ...custom("one"),
      dishId: "dish-a",
      line: readOrderItem({
        id: "one",
        dish_id: "dish-a",
        name_snapshot: "Captured name",
        allergen_state: "UNKNOWN",
        allergens_snapshot: [],
        snapshot_captured_at: "2026-10-05T10:00:00Z",
      }),
    };
    const report = buildProductionReport({
      deliveryDate: row.dayDate,
      lines: [row],
      dishMetaById: new Map([["dish-a", { allergens: ["MILK"], prepMinutes: 10, weightG: 200 }]]),
    });
    expect(report.customizations[0]).toMatchObject({
      dishName: "Captured name",
      itemIdentity: "dish:dish-a",
      allergenState: "UNKNOWN",
    });
    expect(report.packingByDish[0]).toMatchObject({
      dishName: "Captured name",
      allergens: [],
      allergenState: "UNKNOWN",
    });
    expect(report.packingByCustomer[0]?.items[0]?.allergens).toEqual([]);
  });

  it("counts mixed dish/custom quantities while recipe totals remain dish-only", () => {
    const dish: ProductionSourceLine = {
      ...custom("dish-line", 3),
      dishId: "dish-a",
      comment: null,
      line: readOrderItem({ id: "dish-line", dish_id: "dish-a" }, { name: "Sopa especial" }),
    };
    const report = buildProductionReport({
      deliveryDate: dish.dayDate,
      lines: [custom("custom-line", 2), dish],
      recipeLines: [
        { dishId: "dish-a", ingredientId: "rice", ingredientName: "Arroz", qty: 100, unit: "g" },
      ],
    });
    expect(report.totals.portionCount).toBe(5);
    expect(report.packingByDish.map((row) => row.itemIdentity).sort()).toEqual([
      "custom:custom-line",
      "dish:dish-a",
    ]);
    expect(report.ingredientSummary[0]?.qty).toBe(300);
  });

  it("keeps mixed captured dish declarations per source while aggregating uncertainty", () => {
    const declared: ProductionSourceLine = {
      ...custom("declared", 2),
      orderId: "order",
      comment: null,
      dishId: "dish-a",
      line: readOrderItem({
        id: "declared",
        dish_id: "dish-a",
        name_snapshot: "Old name",
        allergen_state: "DECLARED",
        allergens_snapshot: ["MILK"],
        snapshot_captured_at: "2026-10-05T10:00:00Z",
      }),
    };
    const unknown: ProductionSourceLine = {
      ...custom("unknown", 3),
      orderId: "order",
      comment: null,
      dishId: "dish-a",
      line: readOrderItem({
        id: "unknown",
        dish_id: "dish-a",
        name_snapshot: "New name",
        allergen_state: "UNKNOWN",
        allergens_snapshot: [],
        snapshot_captured_at: "2026-10-05T11:00:00Z",
      }),
    };
    const report = buildProductionReport({
      deliveryDate: declared.dayDate,
      lines: [declared, unknown],
    });
    expect(report.standardDishes[0]).toMatchObject({
      totalQty: 5,
      allergenState: "UNKNOWN",
      allergens: ["MILK"],
    });
    expect(report.standardDishes[0]?.customers).toHaveLength(2);
    expect(report.standardDishes[0]?.customers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          orderItemId: "declared",
          dishName: "Old name",
          allergenState: "DECLARED",
          allergens: ["MILK"],
          qty: 2,
        }),
        expect.objectContaining({
          orderItemId: "unknown",
          dishName: "New name",
          allergenState: "UNKNOWN",
          allergens: [],
          qty: 3,
        }),
      ]),
    );
    expect(report.packingByDish[0]?.allergenState).toBe("UNKNOWN");
    expect(report.packingByDish[0]?.allocations[1]).toMatchObject({
      orderItemId: "unknown",
      dishName: "New name",
      allergenState: "UNKNOWN",
      allergens: [],
    });
    expect(report.packingByCustomer[0]?.items[1]).toMatchObject({
      dishName: "New name",
      allergenState: "UNKNOWN",
      allergens: [],
    });
    const historical = {
      ...unknown,
      line: readOrderItem({ id: "historical", dish_id: "dish-a" }, { name: "Current catalogue" }),
    };
    const historicalReport = buildProductionReport({
      deliveryDate: declared.dayDate,
      lines: [declared, historical],
    });
    expect(historicalReport.standardDishes[0]?.allergenState).toBe("HISTORICAL_UNAVAILABLE");
    expect(historicalReport.packingByDish[0]?.allergenState).toBe("HISTORICAL_UNAVAILABLE");
  });

  it("fails closed rather than creating custom:null when source identity is missing", () => {
    const { line: _read, orderItemId: _id, ...missing } = custom("one");
    expect(() =>
      buildProductionReport({ deliveryDate: missing.dayDate, lines: [missing] }),
    ).toThrow("requires order item identity");
  });
});
