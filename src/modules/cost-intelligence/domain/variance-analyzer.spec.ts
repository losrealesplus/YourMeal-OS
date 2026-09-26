import { describe, expect, it } from "vitest";
import { analyzeCostVariance } from "./variance-analyzer";

describe("Variance & Margin Analyzer (E7)", () => {
  it("1. Accurately decomposes variance between standard and real costs", () => {
    const analysis = analyzeCostVariance({
      productId: "PROD-TERIYAKI",
      salesPrice: 8.5,
      standardCost: 3.0,
      standardMaterialsCost: 1.8,
      realMaterialsCost: 2.02, // +0.22€
      standardLogisticsCost: 0.1,
      realLogisticsCost: 0.2, // +0.10€
      standardEnergyCost: 0.1,
      realEnergyCost: 0.18, // +0.08€
      standardLaborCost: 0.7,
      realLaborCost: 0.7, // 0.00€
      standardYieldLossCost: 0.05,
      realYieldLossCost: 0.12, // +0.07€
    });

    expect(analysis.variance.rawMaterialsDelta).toBeCloseTo(0.22, 2);
    expect(analysis.variance.logisticsDelta).toBeCloseTo(0.1, 2);
    expect(analysis.variance.energyDelta).toBeCloseTo(0.08, 2);
    expect(analysis.variance.yieldLossDelta).toBeCloseTo(0.07, 2);
    expect(analysis.variance.totalVariance).toBeCloseTo(0.47, 2);
    expect(analysis.realCost).toBeCloseTo(3.47, 2);

    // Margins
    // Standard: (8.50 - 3.00) / 8.50 = 64.71%
    expect(analysis.standardMarginPct).toBeCloseTo(64.71, 1);
    // Real: (8.50 - 3.47) / 8.50 = 59.18%
    expect(analysis.realMarginPct).toBeCloseTo(59.18, 1);
  });
});
