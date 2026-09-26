import { describe, expect, it } from "vitest";
import { DishCostingService } from "./dish-costing-service";
import {
  FoodDishRecord,
  FoodIngredientRecord,
  FoodRecipeLineRecord,
} from "./food-cost-baseline-adapter";

describe("DishCostingService (CR-COST-02)", () => {
  const service = new DishCostingService();

  const dish: FoodDishRecord = {
    id: "DISH-TERIYAKI",
    name: "Pollo Teriyaki Fit",
    price: 8.5,
    laborCost: 0.7,
    energyCost: 0.18,
    packagingCost: 0.32,
  };

  const ingredients = new Map<string, FoodIngredientRecord>([
    [
      "ING-POLLO",
      {
        id: "ING-POLLO",
        name: "Pechuga de Pollo",
        unit: "kg",
        cost: 6.2,
        wastePercentage: 15.0, // 15% merma => Gross qty = 0.18 / 0.85 = ~0.2118 kg
      },
    ],
    [
      "ING-ARROZ",
      {
        id: "ING-ARROZ",
        name: "Arroz Jazmín",
        unit: "kg",
        cost: 1.8,
        wastePercentage: 0,
      },
    ],
  ]);

  const recipes: FoodRecipeLineRecord[] = [
    { dishId: "DISH-TERIYAKI", ingredientId: "ING-POLLO", amount: 0.18 },
    { dishId: "DISH-TERIYAKI", ingredientId: "ING-ARROZ", amount: 0.15 },
  ];

  it("1. Evaluates dynamic dish cost and gross margin % with waste and overheads", () => {
    const result = service.evaluateDishCost(dish, recipes, ingredients);

    expect(result.dishId).toBe("DISH-TERIYAKI");
    expect(result.salesPrice).toBe(8.5);
    expect(result.overheadsCost).toBe(1.2); // 0.70 + 0.18 + 0.32

    // Raw materials: Pollo (~1.313€) + Arroz (0.27€) = ~1.583€
    expect(result.rawMaterialsCost).toBeCloseTo(1.583, 2);

    // Total production cost: ~1.583 + 1.20 = ~2.783€
    expect(result.totalProductionCost).toBeCloseTo(2.783, 2);

    // Gross margin amount: 8.50 - 2.783 = ~5.717€
    expect(result.grossMarginAmount).toBeCloseTo(5.717, 2);

    // Gross margin %: (5.717 / 8.50) * 100 = ~67.26%
    expect(result.grossMarginPct).toBeCloseTo(67.26, 1);
  });
});
