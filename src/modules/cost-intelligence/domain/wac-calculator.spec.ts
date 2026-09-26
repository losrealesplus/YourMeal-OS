import { describe, expect, it } from "vitest";
import { calculateWeightedAverageCost } from "./wac-calculator";

describe("Weighted Average Cost (WAC / CMP) Calculator (CR-COST-02)", () => {
  it("1. Star Test: Step 1 (100kg @ 2.00€ + 50kg @ 3.00€) -> WAC = 2.3333 €/kg", () => {
    const step1WAC = calculateWeightedAverageCost({
      previousStock: 100,
      previousCost: 2.0,
      inboundQuantity: 50,
      inboundEffectiveCost: 3.0,
    });

    // (100*2 + 50*3) / 150 = 350 / 150 = 2.333333...
    expect(step1WAC).toBe(2.3333);
  });

  it("2. Star Test: Step 2 (150kg @ 2.3333€ + 25kg @ 4.00€) -> WAC = 2.5714 €/kg", () => {
    const step2WAC = calculateWeightedAverageCost({
      previousStock: 150,
      previousCost: 2.3333,
      inboundQuantity: 25,
      inboundEffectiveCost: 4.0,
    });

    // (150 * 2.3333 + 25 * 4.0) / 175 = (349.995 + 100) / 175 = 449.995 / 175 = 2.5714
    expect(step2WAC).toBe(2.5714);
  });

  it("3. Adopts inbound effective cost directly when previous stock is zero or negative", () => {
    const zeroStockWAC = calculateWeightedAverageCost({
      previousStock: 0,
      previousCost: 2.0,
      inboundQuantity: 20,
      inboundEffectiveCost: 4.5,
    });
    expect(zeroStockWAC).toBe(4.5);

    const negativeStockWAC = calculateWeightedAverageCost({
      previousStock: -5,
      previousCost: 2.0,
      inboundQuantity: 20,
      inboundEffectiveCost: 5.2,
    });
    expect(negativeStockWAC).toBe(5.2);
  });

  it("4. Throws on invalid input (inbound quantity <= 0 or negative effective cost)", () => {
    expect(() =>
      calculateWeightedAverageCost({
        previousStock: 10,
        previousCost: 2.0,
        inboundQuantity: 0,
        inboundEffectiveCost: 3.0,
      }),
    ).toThrow();

    expect(() =>
      calculateWeightedAverageCost({
        previousStock: 10,
        previousCost: 2.0,
        inboundQuantity: 10,
        inboundEffectiveCost: -1.0,
      }),
    ).toThrow();
  });
});
