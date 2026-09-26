import { describe, expect, it } from "vitest";
import {
  buildFoodCostBaselineSnapshot,
  FoodDishRecord,
  FoodIngredientRecord,
  FoodRecipeLineRecord,
} from "./food-cost-baseline-adapter";

describe("FoodCostBaselineAdapter (CR-COST-02)", () => {
  const dishes: FoodDishRecord[] = [
    {
      id: "DISH-TERIYAKI",
      name: "Pollo Teriyaki Fit",
      price: 8.5,
      monthlyVolume: 1200,
      laborCost: 0.7,
      energyCost: 0.2,
      packagingCost: 0.35,
    },
  ];

  const ingredients = new Map<string, FoodIngredientRecord>([
    [
      "ING-POLLO",
      {
        id: "ING-POLLO",
        name: "Pechuga de Pollo",
        unit: "kg",
        cost: 6.2,
        wastePercentage: 15.0, // 15% merma
        supplierId: "SUPP-MAKRO",
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
        supplierId: "SUPP-LOCAL",
      },
    ],
  ]);

  const recipes: FoodRecipeLineRecord[] = [
    { dishId: "DISH-TERIYAKI", ingredientId: "ING-POLLO", amount: 0.18 },
    { dishId: "DISH-TERIYAKI", ingredientId: "ING-ARROZ", amount: 0.15 },
  ];

  it("1. Transmutes Food records into generic CostBaselineSnapshot for Core E9", () => {
    const snapshot = buildFoodCostBaselineSnapshot(
      "SNAP-FOOD-EATCLEAN-01",
      dishes,
      ingredients,
      recipes,
    );

    expect(snapshot.snapshotId).toBe("SNAP-FOOD-EATCLEAN-01");
    expect(snapshot.products.length).toBe(1);

    const product = snapshot.products[0];
    expect(product.productId).toBe("DISH-TERIYAKI");
    expect(product.salesPrice).toBe(8.5);
    expect(product.monthlyVolume).toBe(1200);

    // Overheads
    expect(product.overheads.laborCost).toBe(0.7);
    expect(product.overheads.energyCost).toBe(0.2);
    expect(product.overheads.packagingCost).toBe(0.35);

    // BOM Components
    expect(product.bomComponents.length).toBe(2);

    const polloComp = product.bomComponents.find((c) => c.componentId === "ING-POLLO")!;
    expect(polloComp.quantity).toBe(0.18);
    expect(polloComp.unitCost).toBe(6.2);
    expect(polloComp.yieldLoss?.wastePercentage).toBe(0.15); // Converted to 0.15 fraction
    expect(polloComp.supplierId).toBe("SUPP-MAKRO");
  });
});
