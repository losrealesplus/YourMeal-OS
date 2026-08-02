import { describe, expect, it } from "vitest";
import { buildConsumptionPlanLines } from "./inventory-consumption";

describe("buildConsumptionPlanLines", () => {
  it("aggregates portions × recipe without inventing rows", () => {
    const lines = buildConsumptionPlanLines({
      deliveryDate: "2026-08-02",
      dishes: [
        { dishId: "d1", portions: 2 },
        { dishId: "d2", portions: 1 },
      ],
      recipes: [
        {
          dishId: "d1",
          ingredientId: "i1",
          ingredientName: "A",
          qty: 0.5,
          unit: "kg",
        },
        {
          dishId: "d2",
          ingredientId: "i1",
          ingredientName: "A",
          qty: 0.25,
          unit: "kg",
        },
        {
          dishId: "d2",
          ingredientId: "i2",
          ingredientName: "B",
          qty: 1,
          unit: "u",
        },
      ],
    });
    expect(lines).toEqual([
      { ingredientId: "i1", name: "A", qty: 1.25, unit: "kg" },
      { ingredientId: "i2", name: "B", qty: 1, unit: "u" },
    ]);
  });

  it("omits dishes without recipes", () => {
    const lines = buildConsumptionPlanLines({
      deliveryDate: "2026-08-02",
      dishes: [{ dishId: "orphan", portions: 10 }],
      recipes: [],
    });
    expect(lines).toEqual([]);
  });
});
