import { describe, expect, it } from "vitest";
import {
  buildProductionReport,
  scaleIngredientNeed,
  type ProductionSourceLine,
  type RecipeLine,
} from "./production-report";

function line(
  partial: Partial<ProductionSourceLine> &
    Pick<ProductionSourceLine, "orderId" | "customerId" | "dishId">,
): ProductionSourceLine {
  return {
    orderStatus: "confirmed",
    customerName: "Cliente A",
    dishName: "Pechuga",
    qty: 1,
    dayDate: "2026-07-24",
    comment: null,
    ...partial,
  };
}

describe("production report aggregation", () => {
  it("groups standard lines by dish with customer totals", () => {
    const report = buildProductionReport({
      deliveryDate: "2026-07-24",
      lines: [
        line({
          orderId: "o1",
          customerId: "c1",
          customerName: "Ana",
          dishId: "d1",
          dishName: "Pechuga de pavo",
          qty: 2,
        }),
        line({
          orderId: "o2",
          customerId: "c2",
          customerName: "Bruno",
          dishId: "d1",
          dishName: "Pechuga de pavo",
          qty: 1,
        }),
        line({
          orderId: "o3",
          customerId: "c3",
          customerName: "Carla",
          dishId: "d2",
          dishName: "Merluza",
          qty: 3,
        }),
      ],
    });

    expect(report.standardDishes).toHaveLength(2);
    const pechuga = report.standardDishes.find((d) => d.dishId === "d1");
    expect(pechuga?.totalQty).toBe(3);
    expect(pechuga?.batchStatus).toBe("pending");
    expect(pechuga?.customers.map((c) => c.customerName)).toEqual([
      "Ana",
      "Bruno",
    ]);
    expect(report.customizations).toHaveLength(0);
    expect(report.totals.portionCount).toBe(6);
    expect(report.totals.orderCount).toBe(3);
  });

  it("keeps customized lines out of standard dish blocks", () => {
    const report = buildProductionReport({
      deliveryDate: "2026-07-24",
      lines: [
        line({
          orderId: "o1",
          customerId: "c1",
          dishId: "d1",
          qty: 2,
        }),
        line({
          orderId: "o2",
          customerId: "c2",
          customerName: "Diana",
          dishId: "d1",
          qty: 1,
          comment: "Sin cebolla",
        }),
      ],
    });

    expect(report.standardDishes[0]?.totalQty).toBe(2);
    expect(report.customizations).toEqual([
      expect.objectContaining({
        customerName: "Diana",
        observation: "Sin cebolla",
        qty: 1,
      }),
    ]);
    expect(report.totals.customizationCount).toBe(1);
    expect(report.totals.portionCount).toBe(3);
  });

  it("builds ingredient summary from recipes without inventing rows", () => {
    const recipes: RecipeLine[] = [
      {
        dishId: "d1",
        ingredientId: "i1",
        ingredientName: "Pechuga de pollo",
        qty: 200,
        unit: "g",
      },
    ];
    const report = buildProductionReport({
      deliveryDate: "2026-07-24",
      lines: [
        line({ orderId: "o1", customerId: "c1", dishId: "d1", qty: 10 }),
      ],
      recipeLines: recipes,
    });

    expect(report.ingredientSummary).toHaveLength(1);
    expect(report.ingredientSummary[0]?.displayUnit).toBe("kg");
    expect(report.ingredientSummary[0]?.displayQty).toBe(2);
  });

  it("omits ingredient summary when recipes are missing", () => {
    const report = buildProductionReport({
      deliveryDate: "2026-07-24",
      lines: [line({ orderId: "o1", customerId: "c1", dishId: "d1", qty: 5 })],
      recipeLines: [],
    });
    expect(report.ingredientSummary).toEqual([]);
  });

  it("attaches kitchen batch status per dish lot", () => {
    const report = buildProductionReport({
      deliveryDate: "2026-07-24",
      lines: [
        line({ orderId: "o1", customerId: "c1", dishId: "d1", qty: 2 }),
        line({ orderId: "o2", customerId: "c2", dishId: "d2", qty: 1 }),
      ],
      batchStatusByDish: new Map([
        ["d1", { status: "preparing", updatedAt: "2026-07-24T09:14:00Z" }],
      ]),
    });
    expect(report.standardDishes.find((d) => d.dishId === "d1")?.batchStatus).toBe(
      "preparing",
    );
    expect(report.standardDishes.find((d) => d.dishId === "d2")?.batchStatus).toBe(
      "pending",
    );
  });

  it("scales grams to kilograms for display", () => {
    expect(scaleIngredientNeed(180, "g", 100).displayQty).toBe(18);
    expect(scaleIngredientNeed(180, "g", 100).displayUnit).toBe("kg");
  });
});
