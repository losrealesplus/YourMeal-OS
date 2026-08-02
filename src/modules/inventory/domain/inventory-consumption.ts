/**
 * FLOW-04 · Inventory Consumption domain types
 * Spec: docs/00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md (FROZEN)
 */

export type InventoryConsumptionStatus = "planned" | "applied" | "sealed";

export type ConsumptionLine = {
  ingredientId: string;
  name: string;
  qty: number;
  unit: string;
};

export type InventoryConsumption = {
  id: string;
  tenantId: string;
  deliveryDate: string;
  status: InventoryConsumptionStatus;
  lines: ConsumptionLine[];
  createdAt: string;
};

/** Production input for plan calculation (portions × recipe). */
export type ProductionPlanInput = {
  deliveryDate: string;
  dishes: Array<{
    dishId: string;
    portions: number;
  }>;
  recipes: Array<{
    dishId: string;
    ingredientId: string;
    ingredientName: string;
    qty: number;
    unit: string;
  }>;
};

/**
 * Σ (portionQty × recipeLine.qty) per ingredientId+unit.
 * Never invents lines — dishes without recipes contribute nothing.
 */
export function buildConsumptionPlanLines(
  input: ProductionPlanInput,
): ConsumptionLine[] {
  const portionsByDish = new Map<string, number>();
  for (const d of input.dishes) {
    if (d.portions <= 0) continue;
    portionsByDish.set(
      d.dishId,
      (portionsByDish.get(d.dishId) ?? 0) + d.portions,
    );
  }

  const acc = new Map<string, ConsumptionLine>();
  for (const recipe of input.recipes) {
    const portions = portionsByDish.get(recipe.dishId) ?? 0;
    if (portions <= 0) continue;
    if (!(recipe.qty > 0)) continue;
    const key = `${recipe.ingredientId}::${recipe.unit}`;
    const qty = recipe.qty * portions;
    const prev = acc.get(key);
    if (prev) {
      prev.qty += qty;
    } else {
      acc.set(key, {
        ingredientId: recipe.ingredientId,
        name: recipe.ingredientName,
        qty,
        unit: recipe.unit,
      });
    }
  }

  return [...acc.values()].sort((a, b) =>
    a.ingredientId.localeCompare(b.ingredientId),
  );
}
