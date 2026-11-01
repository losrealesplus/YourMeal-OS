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

    // D-010 & D-003 metadata
    expect(product.costProvenance).toBe("recipe_catalog");
    expect(product.isCalculable).toBe(true);
    expect(product.missingDataReasons).toEqual([]);
    expect(product.rawMaterialsCost).toBeGreaterThan(0);
    expect(product.grossMarginPct).toBeGreaterThan(0);
  });

  it("2. Handles dish without recipe lines but with manual cost (manual_catalog, 0% waste)", () => {
    const manualDishes: FoodDishRecord[] = [
      {
        id: "DISH-MANUAL",
        name: "Ensalada Simple",
        price: 6.0,
        cost: 2.2, // Manual cost in catalog
        monthlyVolume: 300,
        laborCost: 0.5,
        energyCost: 0.1,
        packagingCost: 0.25,
      },
    ];

    const snapshot = buildFoodCostBaselineSnapshot(
      "SNAP-MANUAL",
      manualDishes,
      ingredients,
      [], // No recipe lines
    );

    const product = snapshot.products[0];
    expect(product.costProvenance).toBe("manual_catalog");
    expect(product.isCalculable).toBe(true);
    expect(product.missingDataReasons).toEqual([]);
    expect(product.rawMaterialsCost).toBe(2.2);
    expect(product.bomComponents.length).toBe(1);
    expect(product.bomComponents[0].unitCost).toBe(2.2);
    // Crucial: NO invented 5% waste!
    expect(product.bomComponents[0].yieldLoss?.wastePercentage).toBe(0);

    // D-003 Gross Margin = (6.0 - (2.2 + 0.25)) / 6.0 = 3.55 / 6.0 = 59.2%
    expect(product.grossMarginPct).toBeCloseTo(59.2, 1);
  });

  it("3. Identifies dish without recipe and without cost as incomplete (D-010 non-invented data)", () => {
    const incompleteDishes: FoodDishRecord[] = [
      {
        id: "DISH-NO-DATA",
        name: "Plato Fantasma",
        price: 9.0,
        cost: null, // No manual cost
        monthlyVolume: 100,
      },
    ];

    const snapshot = buildFoodCostBaselineSnapshot(
      "SNAP-INCOMPLETE",
      incompleteDishes,
      ingredients,
      [],
    );

    const product = snapshot.products[0];
    expect(product.costProvenance).toBe("incomplete");
    expect(product.isCalculable).toBe(false);
    expect(product.bomComponents).toHaveLength(0);
    expect(product.rawMaterialsCost).toBeNull();
    expect(product.grossMarginPct).toBeNull();
    expect(product.missingDataReasons).toBeDefined();
    expect(product.missingDataReasons!.length).toBeGreaterThan(0);
    expect(product.missingDataReasons![0]).toContain("Sin receta ni coste manual");
  });

  it("4. Detects recipe lines with missing ingredient cost as incomplete", () => {
    const customIngredients = new Map<string, FoodIngredientRecord>([
      [
        "ING-TRUFA",
        {
          id: "ING-TRUFA",
          name: "Trufa Negra",
          unit: "g",
          cost: null, // Cost missing
        },
      ],
    ]);

    const customDishes: FoodDishRecord[] = [
      {
        id: "DISH-TRUFA",
        name: "Pasta con Trufa",
        price: 18.0,
        monthlyVolume: 50,
      },
    ];

    const customRecipes: FoodRecipeLineRecord[] = [
      { dishId: "DISH-TRUFA", ingredientId: "ING-TRUFA", amount: 10 },
    ];

    const snapshot = buildFoodCostBaselineSnapshot(
      "SNAP-TRUFA",
      customDishes,
      customIngredients,
      customRecipes,
    );

    const product = snapshot.products[0];
    expect(product.costProvenance).toBe("incomplete");
    expect(product.isCalculable).toBe(false);
    expect(product.rawMaterialsCost).toBeNull();
    expect(product.missingDataReasons?.some((r) => r.includes("Trufa Negra"))).toBe(true);
  });

  it("5. Respects explicit 0 cost vs missing cost", () => {
    const zeroCostDishes: FoodDishRecord[] = [
      {
        id: "DISH-ZERO",
        name: "Agua de Cortesía",
        price: 0,
        cost: 0, // Explicit 0 cost (promotional/complimentary)
        monthlyVolume: 500,
      },
    ];

    const snapshot = buildFoodCostBaselineSnapshot("SNAP-ZERO", zeroCostDishes, ingredients, []);

    const product = snapshot.products[0];
    expect(product.costProvenance).toBe("manual_catalog");
    expect(product.isCalculable).toBe(true);
    expect(product.rawMaterialsCost).toBe(0);
    // Sales price is 0 -> gross margin should be null, avoid division by zero
    expect(product.grossMarginPct).toBeNull();
  });

  it("6. Decision D-010: Handles mixed portfolio (recipe, manual_catalog, incomplete, and unpriced) without cross-contamination", () => {
    const mixedDishes: FoodDishRecord[] = [
      {
        id: "DISH-RECIPE",
        name: "Pollo Bowl",
        price: 12.0,
        laborCost: 1.0,
        packagingCost: 0.5,
      },
      {
        id: "DISH-MANUAL",
        name: "Postre Casero",
        price: 5.0,
        cost: 1.5,
        packagingCost: 0.2,
      },
      {
        id: "DISH-INCOMPLETE",
        name: "Plato Sin Datos",
        price: 10.0,
        cost: null,
      },
      {
        id: "DISH-NO-PVP",
        name: "Plato Sin Precio",
        price: null,
        cost: 2.0,
      },
    ];

    const recipes: FoodRecipeLineRecord[] = [
      { dishId: "DISH-RECIPE", ingredientId: "ING-POLLO", amount: 0.2 },
    ];

    const snapshot = buildFoodCostBaselineSnapshot("SNAP-MIXED", mixedDishes, ingredients, recipes);

    expect(snapshot.products.length).toBe(4);

    const recipeProd = snapshot.products.find((p) => p.productId === "DISH-RECIPE")!;
    expect(recipeProd.costProvenance).toBe("recipe_catalog");
    expect(recipeProd.isCalculable).toBe(true);
    expect(recipeProd.grossMarginPct).not.toBeNull();

    const manualProd = snapshot.products.find((p) => p.productId === "DISH-MANUAL")!;
    expect(manualProd.costProvenance).toBe("manual_catalog");
    expect(manualProd.isCalculable).toBe(true);
    expect(manualProd.rawMaterialsCost).toBe(1.5);
    // Gross Margin: (5.0 - (1.5 + 0.2)) / 5.0 = 3.3 / 5.0 = 66%
    expect(manualProd.grossMarginPct).toBe(66);

    const incProd = snapshot.products.find((p) => p.productId === "DISH-INCOMPLETE")!;
    expect(incProd.costProvenance).toBe("incomplete");
    expect(incProd.isCalculable).toBe(false);
    expect(incProd.rawMaterialsCost).toBeNull();
    expect(incProd.grossMarginPct).toBeNull();

    const noPvpProd = snapshot.products.find((p) => p.productId === "DISH-NO-PVP")!;
    expect(noPvpProd.salesPrice).toBeNull();
    expect(noPvpProd.costProvenance).toBe("manual_catalog");
    expect(noPvpProd.isCalculable).toBe(true);
    expect(noPvpProd.grossMarginPct).toBeNull(); // No price => null margin, never 0%
  });
});
