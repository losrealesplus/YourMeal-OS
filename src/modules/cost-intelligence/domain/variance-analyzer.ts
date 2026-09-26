/**
 * YOURMEAL OS — VARIANCE & MARGIN ANALYZER (E7)
 * Decomposes variance between Standard Cost and Real Production Cost.
 */

import { StandardVsRealCost, VarianceBreakdown } from "./types";

function round(val: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export interface VarianceInput {
  productId: string;
  salesPrice: number;
  standardCost: number;
  realMaterialsCost: number;
  standardMaterialsCost: number;
  realLogisticsCost?: number;
  standardLogisticsCost?: number;
  realLaborCost?: number;
  standardLaborCost?: number;
  realEnergyCost?: number;
  standardEnergyCost?: number;
  realPackagingCost?: number;
  standardPackagingCost?: number;
  realYieldLossCost?: number;
  standardYieldLossCost?: number;
}

export function analyzeCostVariance(input: VarianceInput): StandardVsRealCost {
  const rawMaterialsDelta = round(input.realMaterialsCost - input.standardMaterialsCost);
  const logisticsDelta = round((input.realLogisticsCost ?? 0) - (input.standardLogisticsCost ?? 0));
  const laborDelta = round((input.realLaborCost ?? 0) - (input.standardLaborCost ?? 0));
  const energyDelta = round((input.realEnergyCost ?? 0) - (input.standardEnergyCost ?? 0));
  const packagingDelta = round((input.realPackagingCost ?? 0) - (input.standardPackagingCost ?? 0));
  const yieldLossDelta = round((input.realYieldLossCost ?? 0) - (input.standardYieldLossCost ?? 0));

  const totalVariance = round(
    rawMaterialsDelta +
      logisticsDelta +
      laborDelta +
      energyDelta +
      packagingDelta +
      yieldLossDelta,
  );

  const realCost = round(input.standardCost + totalVariance);

  const totalVariancePct =
    input.standardCost > 0 ? round((totalVariance / input.standardCost) * 100, 2) : 0;

  const standardMarginPct =
    input.salesPrice > 0
      ? round(((input.salesPrice - input.standardCost) / input.salesPrice) * 100, 2)
      : 0;

  const realMarginPct =
    input.salesPrice > 0
      ? round(((input.salesPrice - realCost) / input.salesPrice) * 100, 2)
      : 0;

  const variance: VarianceBreakdown = {
    rawMaterialsDelta,
    logisticsDelta,
    laborDelta,
    energyDelta,
    packagingDelta,
    yieldLossDelta,
    totalVariance,
    totalVariancePct,
  };

  return {
    productId: input.productId,
    standardCost: input.standardCost,
    realCost,
    salesPrice: input.salesPrice,
    standardMarginPct,
    realMarginPct,
    variance,
  };
}
