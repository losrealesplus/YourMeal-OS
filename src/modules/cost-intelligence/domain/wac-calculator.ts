/**
 * YOURMEAL OS — WEIGHTED AVERAGE COST (WAC / CMP) CALCULATOR (CR-COST-02)
 * Subsystem: Platform Core (Cost Intelligence)
 * Pure domain mathematics for deriving weighted average operational cost.
 */

function round(val: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export interface WACInput {
  previousStock: number;
  previousCost: number;
  inboundQuantity: number;
  inboundEffectiveCost: number;
}

/**
 * Calculates new Weighted Average Cost (WAC).
 * Invariant: If previous stock <= 0, new WAC adopts the inbound effective cost directly.
 */
export function calculateWeightedAverageCost(input: WACInput): number {
  if (input.inboundQuantity <= 0 || input.inboundEffectiveCost < 0) {
    throw new Error("Inbound quantity must be > 0 and inbound effective cost must be >= 0.");
  }

  // If previous stock is 0 or negative (stock deficit), new cost is the latest inbound cost
  if (input.previousStock <= 0 || input.previousCost < 0) {
    return round(input.inboundEffectiveCost);
  }

  const previousTotalValue = input.previousStock * input.previousCost;
  const inboundTotalValue = input.inboundQuantity * input.inboundEffectiveCost;
  const totalQuantity = input.previousStock + input.inboundQuantity;

  if (totalQuantity <= 0) {
    return round(input.inboundEffectiveCost);
  }

  const newWAC = (previousTotalValue + inboundTotalValue) / totalQuantity;
  return round(newWAC);
}
