/**
 * YOURMEAL OS — FOOD COST BASELINE ADAPTER (CR-COST-02)
 * Vertical Pack: Food & Catering
 * Transmutes culinary database records (dishes, ingredients, recipes)
 * into generic, neutral CostBaselineSnapshot structures consumed by Core E9.
 */

import {
  BaselineProduct,
  BOMComponent,
  CostBaselineSnapshot,
} from "@/modules/cost-intelligence/domain/types";

export interface FoodIngredientRecord {
  id: string;
  name: string;
  unit: string;
  cost: number;
  wastePercentage?: number; // Merma % (0 to 100)
  supplierId?: string;
}

export interface FoodDishRecord {
  id: string;
  name: string;
  price: number;
  monthlyVolume?: number;
  laborCost?: number;
  energyCost?: number;
  packagingCost?: number;
}

export interface FoodRecipeLineRecord {
  dishId: string;
  ingredientId: string;
  amount: number; // in unit (e.g. kg or g)
}

/**
 * Pure adapter function transforming Food records into generic CostBaselineSnapshot.
 * Invariant: Zero culinary jargon leaks into the resulting CostBaselineSnapshot.
 */
export function buildFoodCostBaselineSnapshot(
  snapshotId: string,
  dishes: FoodDishRecord[],
  ingredientsMap: Map<string, FoodIngredientRecord>,
  recipeLines: FoodRecipeLineRecord[],
): CostBaselineSnapshot {
  const products: BaselineProduct[] = dishes.map((dish) => {
    const lines = recipeLines.filter((r) => r.dishId === dish.id);

    const bomComponents: BOMComponent[] = lines.map((line) => {
      const ing = ingredientsMap.get(line.ingredientId);
      const rawWaste = ing?.wastePercentage ?? 0;
      // Convert 0-100% to 0-1 fraction for Core YieldLossConfig
      const wastePercentage = rawWaste > 1 ? rawWaste / 100 : rawWaste;

      return {
        componentId: line.ingredientId,
        componentName: ing?.name ?? "Unknown Raw Material",
        quantity: line.amount,
        unit: ing?.unit ?? "ud",
        unitCost: ing?.cost ?? 0,
        yieldLoss: {
          wastePercentage: Math.max(0, Math.min(0.99, wastePercentage)),
        },
        supplierId: ing?.supplierId,
      };
    });

    return {
      productId: dish.id,
      productName: dish.name,
      salesPrice: dish.price,
      monthlyVolume: dish.monthlyVolume ?? 0,
      bomComponents,
      overheads: {
        laborCost: dish.laborCost ?? 0,
        energyCost: dish.energyCost ?? 0,
        packagingCost: dish.packagingCost ?? 0,
      },
    };
  });

  return {
    snapshotId,
    createdAt: new Date().toISOString(),
    products,
  };
}
