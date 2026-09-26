/**
 * YOURMEAL OS — DISH COSTING SERVICE (CR-COST-02)
 * Vertical Pack: Food & Catering
 * Computes dish production costs, gross margins, and escandallo breakdowns
 * by consuming the Core BOM Calculator.
 */

import { calculateBOMCost } from "@/modules/cost-intelligence/domain/bom-calculator";
import {
  FoodDishRecord,
  FoodIngredientRecord,
  FoodRecipeLineRecord,
} from "./food-cost-baseline-adapter";

function round(val: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export interface DishCostingResult {
  dishId: string;
  dishName: string;
  salesPrice: number;
  rawMaterialsCost: number;
  overheadsCost: number;
  totalProductionCost: number;
  grossMarginAmount: number;
  grossMarginPct: number;
  ingredientsBreakdown: Array<{
    ingredientId: string;
    ingredientName: string;
    netQuantity: number;
    grossQuantity: number;
    unit: string;
    unitCost: number;
    effectiveCost: number;
  }>;
}

export class DishCostingService {
  /**
   * Evaluates dynamic escandallo for a dish based on current ingredient costs and waste.
   */
  public evaluateDishCost(
    dish: FoodDishRecord,
    recipeLines: FoodRecipeLineRecord[],
    ingredientsMap: Map<string, FoodIngredientRecord>,
  ): DishCostingResult {
    const lines = recipeLines.filter((r) => r.dishId === dish.id);

    const bomComponents = lines.map((line) => {
      const ing = ingredientsMap.get(line.ingredientId);
      const rawWaste = ing?.wastePercentage ?? 0;
      const wastePercentage = rawWaste > 1 ? rawWaste / 100 : rawWaste;

      return {
        componentId: line.ingredientId,
        componentName: ing?.name ?? "Unknown Ingredient",
        quantity: line.amount,
        unit: ing?.unit ?? "ud",
        unitCost: ing?.cost ?? 0,
        yieldLoss: {
          wastePercentage: Math.max(0, Math.min(0.99, wastePercentage)),
        },
        supplierId: ing?.supplierId,
      };
    });

    const overheads = {
      laborCost: dish.laborCost ?? 0,
      energyCost: dish.energyCost ?? 0,
      packagingCost: dish.packagingCost ?? 0,
    };

    const bomCost = calculateBOMCost(
      dish.id,
      dish.name,
      bomComponents,
      overheads,
    );

    const grossMarginAmount = round(dish.price - bomCost.totalProductionCost);
    const grossMarginPct =
      dish.price > 0 ? round((grossMarginAmount / dish.price) * 100, 2) : 0;

    const ingredientsBreakdown = bomCost.componentBreakdown.map((c, idx) => ({
      ingredientId: c.componentId,
      ingredientName: c.componentName,
      netQuantity: c.netQuantity,
      grossQuantity: c.grossQuantity,
      unit: bomComponents[idx]?.unit ?? "ud",
      unitCost: c.unitCost,
      effectiveCost: c.effectiveCost,
    }));

    return {
      dishId: dish.id,
      dishName: dish.name,
      salesPrice: dish.price,
      rawMaterialsCost: bomCost.rawMaterialsCost,
      overheadsCost: bomCost.overheadsCost,
      totalProductionCost: bomCost.totalProductionCost,
      grossMarginAmount,
      grossMarginPct,
      ingredientsBreakdown,
    };
  }
}
