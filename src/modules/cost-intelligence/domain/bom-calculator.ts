/**
 * YOURMEAL OS — BOM & PRODUCTION COST CALCULATOR (E4, E5, E6)
 * Calculates product composition costs incorporating Yield & Loss and Overheads.
 */

import {
  BOMComponent,
  CalculatedBOMCost,
  ProductionOverheadsConfig,
} from "./types";

function round(val: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export function calculateBOMCost(
  productId: string,
  productName: string,
  components: BOMComponent[],
  overheads: ProductionOverheadsConfig = { laborCost: 0, energyCost: 0, packagingCost: 0 },
): CalculatedBOMCost {
  const componentBreakdown = components.map((comp) => {
    if (comp.quantity < 0 || comp.unitCost < 0) {
      throw new Error(`Invalid component quantity or cost for ${comp.componentName}`);
    }

    const wastePct = comp.yieldLoss?.wastePercentage ?? 0;
    if (wastePct < 0 || wastePct >= 1) {
      throw new Error(`Waste percentage must be in range [0, 1) for ${comp.componentName}`);
    }

    // Gross Quantity needed = Net Quantity / (1 - wastePercentage)
    const grossQuantity = wastePct > 0 ? round(comp.quantity / (1 - wastePct)) : comp.quantity;
    const effectiveCost = round(grossQuantity * comp.unitCost);

    return {
      componentId: comp.componentId,
      componentName: comp.componentName,
      netQuantity: comp.quantity,
      grossQuantity,
      unitCost: comp.unitCost,
      effectiveCost,
    };
  });

  const rawMaterialsCost = round(
    componentBreakdown.reduce((acc, curr) => acc + curr.effectiveCost, 0),
  );

  const overheadsCost = round(
    overheads.laborCost +
      overheads.energyCost +
      overheads.packagingCost +
      (overheads.otherOverheads ?? 0),
  );

  const totalProductionCost = round(rawMaterialsCost + overheadsCost);

  return {
    productId,
    productName,
    rawMaterialsCost,
    overheadsCost,
    totalProductionCost,
    componentBreakdown,
  };
}
