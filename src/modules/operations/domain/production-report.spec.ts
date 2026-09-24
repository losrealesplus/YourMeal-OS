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

  it("builds Level 2 packing by customer with item checklists and culinary notes (G6)", () => {
    const report = buildProductionReport({
      deliveryDate: "2026-09-24",
      lines: [
        line({
          orderId: "ord-1",
          customerId: "cust-1",
          customerName: "Elena Ramos",
          dishId: "dish-1",
          dishName: "Pollo al Curry",
          qty: 2,
          comment: "Sin picante",
        }),
        line({
          orderId: "ord-1",
          customerId: "cust-1",
          customerName: "Elena Ramos",
          dishId: "dish-2",
          dishName: "Ensalada César",
          qty: 1,
          comment: null,
        }),
        line({
          orderId: "ord-2",
          customerId: "cust-2",
          customerName: "Carlos Gómez",
          dishId: "dish-1",
          dishName: "Pollo al Curry",
          qty: 3,
        }),
      ],
    });

    expect(report.packingByCustomer).toHaveLength(2);

    const elena = report.packingByCustomer.find((c) => c.customerId === "cust-1");
    expect(elena).toBeDefined();
    expect(elena?.customerName).toBe("Elena Ramos");
    expect(elena?.totalPortions).toBe(3);
    expect(elena?.items).toHaveLength(2);
    expect(elena?.items[0]).toEqual(
      expect.objectContaining({
        dishName: "Pollo al Curry",
        qty: 2,
        comment: "Sin picante",
      }),
    );
    expect(elena?.specialInstructions).toEqual(["Sin picante"]);

    const carlos = report.packingByCustomer.find((c) => c.customerId === "cust-2");
    expect(carlos).toBeDefined();
    expect(carlos?.totalPortions).toBe(3);
  });

  it("builds Level 2 packing by dish with customer allocations (G6)", () => {
    const report = buildProductionReport({
      deliveryDate: "2026-09-24",
      lines: [
        line({
          orderId: "ord-1",
          customerId: "cust-1",
          customerName: "Elena Ramos",
          dishId: "dish-1",
          dishName: "Pollo al Curry",
          qty: 2,
          comment: "Sin picante",
        }),
        line({
          orderId: "ord-2",
          customerId: "cust-2",
          customerName: "Carlos Gómez",
          dishId: "dish-1",
          dishName: "Pollo al Curry",
          qty: 3,
        }),
      ],
    });

    expect(report.packingByDish).toHaveLength(1);
    const curry = report.packingByDish[0];
    expect(curry.dishName).toBe("Pollo al Curry");
    expect(curry.totalQty).toBe(5);
    expect(curry.allocations).toHaveLength(2);
    expect(curry.allocations).toEqual([
      expect.objectContaining({
        customerName: "Elena Ramos",
        qty: 2,
        comment: "Sin picante",
      }),
      expect.objectContaining({
        customerName: "Carlos Gómez",
        qty: 3,
        comment: null,
      }),
    ]);
  });

  it("propagates post-confirmation order modifications to P1 kitchen and P2 packing (G6)", () => {
    // Initial order state
    const initialLines = [
      line({
        orderId: "ord-mod-1",
        customerId: "cust-mod-1",
        customerName: "Sofía Vega",
        dishId: "dish-1",
        dishName: "Salmón Grill",
        qty: 1,
        comment: null,
      }),
    ];

    const initialReport = buildProductionReport({
      deliveryDate: "2026-09-24",
      lines: initialLines,
    });
    expect(initialReport.totals.portionCount).toBe(1);
    expect(initialReport.packingByCustomer[0]?.totalPortions).toBe(1);

    // After modification: increased qty to 3 and added culinary note
    const modifiedLines = [
      line({
        orderId: "ord-mod-1",
        customerId: "cust-mod-1",
        customerName: "Sofía Vega",
        dishId: "dish-1",
        dishName: "Salmón Grill",
        qty: 3,
        comment: "Muy hecho / Salsa aparte",
      }),
    ];

    const updatedReport = buildProductionReport({
      deliveryDate: "2026-09-24",
      lines: modifiedLines,
    });

    // P1 Cocina updates
    expect(updatedReport.totals.portionCount).toBe(3);
    expect(updatedReport.totals.customizationCount).toBe(1);
    expect(updatedReport.customizations[0]?.observation).toBe("Muy hecho / Salsa aparte");

    // P2 Packing updates
    expect(updatedReport.packingByCustomer[0]?.totalPortions).toBe(3);
    expect(updatedReport.packingByCustomer[0]?.items[0]?.qty).toBe(3);
    expect(updatedReport.packingByCustomer[0]?.items[0]?.comment).toBe("Muy hecho / Salsa aparte");
    expect(updatedReport.packingByDish[0]?.totalQty).toBe(3);
    expect(updatedReport.packingByDish[0]?.allocations[0]?.comment).toBe("Muy hecho / Salsa aparte");
  });
});
