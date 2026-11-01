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
  CostProvenanceType,
} from "@/modules/cost-intelligence/domain/types";

function round(val: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export interface FoodIngredientRecord {
  id: string;
  name: string;
  unit: string;
  cost: number | null;
  wastePercentage?: number; // Merma % (0 to 100)
  supplierId?: string;
}

export interface FoodDishRecord {
  id: string;
  name: string;
  price: number | null;
  cost?: number | null;
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
 * Respects D-003 (ingredient + packaging gross margin) and D-010 (provenance and missing data).
 */
export function buildFoodCostBaselineSnapshot(
  snapshotId: string,
  dishes: FoodDishRecord[],
  ingredientsMap: Map<string, FoodIngredientRecord>,
  recipeLines: FoodRecipeLineRecord[],
): CostBaselineSnapshot {
  const products: BaselineProduct[] = dishes.map((dish) => {
    const lines = recipeLines.filter((r) => r.dishId === dish.id);
    const missingReasons: string[] = [];

    if (dish.price == null || dish.price <= 0) {
      missingReasons.push("PVP no configurado o 0 €");
    }

    let bomComponents: BOMComponent[] = [];
    let costProvenance: CostProvenanceType = "incomplete";
    let isCalculable = false;

    if (lines.length > 0) {
      let hasIncompleteIngredient = false;
      bomComponents = lines.map((line) => {
        const ing = ingredientsMap.get(line.ingredientId);
        if (!ing || ing.cost == null) {
          hasIncompleteIngredient = true;
          missingReasons.push(
            `Ingrediente "${ing?.name ?? line.ingredientId}" sin coste registrado en catálogo`,
          );
        }
        const rawWaste = ing?.wastePercentage ?? 0;
        // Convert 0-100% to 0-1 fraction for Core YieldLossConfig
        const wastePercentage = rawWaste > 1 ? rawWaste / 100 : rawWaste;

        return {
          componentId: line.ingredientId,
          componentName: ing?.name ?? "Materia Prima Desconocida",
          quantity: line.amount,
          unit: ing?.unit ?? "ud",
          unitCost: ing?.cost ?? 0,
          yieldLoss: {
            wastePercentage: Math.max(0, Math.min(0.99, wastePercentage)),
          },
          supplierId: ing?.supplierId,
        };
      });

      if (hasIncompleteIngredient) {
        costProvenance = "incomplete";
        isCalculable = false;
      } else {
        costProvenance = "recipe_catalog";
        isCalculable = true;
      }
    } else {
      // Dish has NO recipe lines
      if (dish.cost != null && dish.cost >= 0) {
        // Valid manual registered cost in catalog (dishes.cost)
        costProvenance = "manual_catalog";
        isCalculable = true;
        bomComponents = [
          {
            componentId: `manual-cost-${dish.id}`,
            componentName: `Coste Base Manual (${dish.name})`,
            quantity: 1,
            unit: "ración",
            unitCost: Number(dish.cost),
            yieldLoss: { wastePercentage: 0 },
          },
        ];
      } else {
        // Missing recipe AND missing manual cost
        costProvenance = "incomplete";
        isCalculable = false;
        missingReasons.push("Sin receta ni coste manual registrado en catálogo");
        bomComponents = [];
      }
    }

    const overheads = {
      laborCost: dish.laborCost ?? 0,
      energyCost: dish.energyCost ?? 0,
      packagingCost: dish.packagingCost ?? 0,
    };

    let rawMaterialsCost: number | null = null;
    let grossMarginPct: number | null = null;

    if (isCalculable) {
      rawMaterialsCost = round(
        bomComponents.reduce((acc, comp) => {
          const wastePct = comp.yieldLoss?.wastePercentage ?? 0;
          const grossQty = wastePct > 0 ? comp.quantity / (1 - wastePct) : comp.quantity;
          return acc + grossQty * comp.unitCost;
        }, 0),
        4,
      );

      const packagingCost = overheads.packagingCost;
      const salesPrice = dish.price;
      if (salesPrice != null && salesPrice > 0) {
        // D-003: Margen inicial = Precio Venta - (Materia Prima + Packaging)
        grossMarginPct = round(
          ((salesPrice - (rawMaterialsCost + packagingCost)) / salesPrice) * 100,
          2,
        );
      }
    }

    return {
      productId: dish.id,
      productName: dish.name,
      salesPrice: dish.price,
      monthlyVolume: dish.monthlyVolume ?? 0,
      bomComponents,
      overheads,
      costProvenance,
      isCalculable,
      missingDataReasons: missingReasons,
      rawMaterialsCost,
      grossMarginPct,
    };
  });

  return {
    snapshotId,
    createdAt: new Date().toISOString(),
    products,
  };
}
