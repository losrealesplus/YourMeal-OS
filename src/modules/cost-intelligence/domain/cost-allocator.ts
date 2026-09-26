/**
 * YOURMEAL OS — COST ALLOCATION ENGINE (E3)
 * Pure domain math for allocating indirect inbound costs across purchase lines.
 * Invariant: Sum of allocated overheads equals total additional costs (Zero penny drift).
 */

import {
  CostAllocationResult,
  InboundPurchaseLine,
  ProratedPurchaseLine,
  ProrationMethod,
} from "./types";

function round(val: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export function allocateInboundCosts(
  lines: InboundPurchaseLine[],
  additionalCosts: number,
  method: ProrationMethod = "value",
): CostAllocationResult {
  if (lines.length === 0) {
    return {
      totalBaseAmount: 0,
      totalAdditionalCosts: 0,
      totalEffectiveAmount: 0,
      allocationMethod: method,
      lines: [],
    };
  }

  if (additionalCosts < 0) {
    throw new Error("Additional costs cannot be negative.");
  }

  const baseAmounts = lines.map((l) => {
    if (l.quantity <= 0 || l.unitPrice < 0) {
      throw new Error(`Invalid line quantity or price for item: ${l.itemName}`);
    }
    return round(l.quantity * l.unitPrice);
  });

  const totalBaseAmount = round(baseAmounts.reduce((acc, curr) => acc + curr, 0));

  if (additionalCosts === 0) {
    const proratedLines: ProratedPurchaseLine[] = lines.map((l, idx) => ({
      ...l,
      baseAmount: baseAmounts[idx],
      allocatedOverhead: 0,
      effectiveUnitCost: l.unitPrice,
      totalEffectiveCost: baseAmounts[idx],
    }));

    return {
      totalBaseAmount,
      totalAdditionalCosts: 0,
      totalEffectiveAmount: totalBaseAmount,
      allocationMethod: method,
      lines: proratedLines,
    };
  }

  let weights: number[] = [];

  switch (method) {
    case "value":
      if (totalBaseAmount === 0) {
        // Fallback to equal unit distribution if base amount is zero
        weights = lines.map(() => 1 / lines.length);
      } else {
        weights = baseAmounts.map((b) => b / totalBaseAmount);
      }
      break;

    case "weight": {
      const totalWeight = lines.reduce((acc, l) => acc + (l.weightKg ?? 0) * l.quantity, 0);
      if (totalWeight <= 0) {
        throw new Error("Weight allocation requested but total weight is zero or undefined.");
      }
      weights = lines.map((l) => ((l.weightKg ?? 0) * l.quantity) / totalWeight);
      break;
    }

    case "volume": {
      const totalVolume = lines.reduce((acc, l) => acc + (l.volumeM3 ?? 0) * l.quantity, 0);
      if (totalVolume <= 0) {
        throw new Error("Volume allocation requested but total volume is zero or undefined.");
      }
      weights = lines.map((l) => ((l.volumeM3 ?? 0) * l.quantity) / totalVolume);
      break;
    }

    case "units": {
      const totalUnits = lines.reduce((acc, l) => acc + l.quantity, 0);
      if (totalUnits <= 0) {
        throw new Error("Unit allocation requested but total units is zero.");
      }
      weights = lines.map((l) => l.quantity / totalUnits);
      break;
    }

    case "manual": {
      const manualSum = lines.reduce((acc, l) => acc + (l.manualOverhead ?? 0), 0);
      if (round(manualSum, 2) !== round(additionalCosts, 2)) {
        throw new Error(
          `Manual overheads sum (${manualSum}) does not match total additional costs (${additionalCosts}).`,
        );
      }
      weights = lines.map((l) => (l.manualOverhead ?? 0) / additionalCosts);
      break;
    }
  }

  // Calculate allocated overheads with rounding
  let allocatedSum = 0;
  const rawAllocations = weights.map((w, idx) => {
    if (idx === weights.length - 1) {
      // Last element takes exact remaining difference to ensure zero drift
      const remaining = round(additionalCosts - allocatedSum);
      return Math.max(0, remaining);
    }
    const allocated = round(additionalCosts * w);
    allocatedSum += allocated;
    return allocated;
  });

  const proratedLines: ProratedPurchaseLine[] = lines.map((l, idx) => {
    const allocatedOverhead = rawAllocations[idx];
    const totalEffectiveCost = round(baseAmounts[idx] + allocatedOverhead);
    const effectiveUnitCost = round(totalEffectiveCost / l.quantity);

    return {
      ...l,
      baseAmount: baseAmounts[idx],
      allocatedOverhead,
      effectiveUnitCost,
      totalEffectiveCost,
    };
  });

  const totalEffectiveAmount = round(totalBaseAmount + additionalCosts);

  return {
    totalBaseAmount,
    totalAdditionalCosts: additionalCosts,
    totalEffectiveAmount,
    allocationMethod: method,
    lines: proratedLines,
  };
}
