import { describe, expect, it } from "vitest";
import { compareScenarios, simulateScenario } from "./cost-simulation-engine";
import { CostBaselineSnapshot, HypotheticalVariables } from "./types";

describe("Cost Simulation & Scenario Engine (E9)", () => {
  const sampleBaseline: CostBaselineSnapshot = {
    snapshotId: "SNAP-2026-09-26",
    createdAt: "2026-09-26T12:00:00Z",
    products: [
      {
        productId: "PROD-TERIYAKI",
        productName: "Pollo Teriyaki Fit",
        salesPrice: 8.5,
        monthlyVolume: 1000,
        bomComponents: [
          {
            componentId: "ING-POLLO",
            componentName: "Pechuga Pollo",
            quantity: 0.18,
            unit: "kg",
            unitCost: 6.2,
            supplierId: "SUPP-MAKRO",
            yieldLoss: { wastePercentage: 0.15 },
          },
          {
            componentId: "ING-ARROZ",
            componentName: "Arroz Jazmín",
            quantity: 0.15,
            unit: "kg",
            unitCost: 1.8,
            supplierId: "SUPP-LOCAL",
          },
        ],
        overheads: {
          laborCost: 0.7,
          energyCost: 0.2,
          packagingCost: 0.3,
        },
      },
      {
        productId: "PROD-SALMON",
        productName: "Salmón Grill & Brócoli",
        salesPrice: 11.0,
        monthlyVolume: 500,
        bomComponents: [
          {
            componentId: "ING-SALMON",
            componentName: "Lomo de Salmón",
            quantity: 0.2,
            unit: "kg",
            unitCost: 14.0,
            supplierId: "SUPP-PESCADOS",
            yieldLoss: { wastePercentage: 0.05 },
          },
        ],
        overheads: {
          laborCost: 0.8,
          energyCost: 0.25,
          packagingCost: 0.35,
        },
      },
    ],
  };

  it("1. Strict Invariant: Simulation != Reality (Zero mutation of baseline snapshot)", () => {
    // Deep clone baseline to verify absolute immutability
    const baselineBefore = JSON.stringify(sampleBaseline);

    const variables: HypotheticalVariables = {
      supplierCostDeltas: { "SUPP-MAKRO": 0.25 }, // +25% Makro
      overheadDeltas: { energyRateDeltaPct: 0.5 }, // +50% Energy
    };

    const result = simulateScenario(sampleBaseline, variables, {
      scenarioId: "SCEN-TEST-IMMUT",
      name: "Extreme Stress Test",
    });

    const baselineAfter = JSON.stringify(sampleBaseline);

    // Baseline MUST be 100% untouched
    expect(baselineBefore).toBe(baselineAfter);
    expect(result.products[0].simulatedCost).toBeGreaterThan(result.products[0].currentCost);
  });

  it("2. Accurately simulates supplier cost increases (+8% Makro)", () => {
    const variables: HypotheticalVariables = {
      supplierCostDeltas: { "SUPP-MAKRO": 0.08 }, // +8% Makro
    };

    const result = simulateScenario(sampleBaseline, variables, {
      scenarioId: "SCEN-MAKRO-8",
      name: "Makro +8%",
    });

    const teriyaki = result.products.find((p) => p.productId === "PROD-TERIYAKI")!;
    const salmon = result.products.find((p) => p.productId === "PROD-SALMON")!;

    // Teriyaki uses Makro pollo -> cost increases
    expect(teriyaki.costDelta).toBeGreaterThan(0);
    expect(teriyaki.simulatedCost).toBeGreaterThan(teriyaki.currentCost);
    expect(teriyaki.simulatedMarginPct).toBeLessThan(teriyaki.currentMarginPct);

    // Salmon uses SUPP-PESCADOS -> cost unchanged
    expect(salmon.costDelta).toBe(0);
    expect(salmon.simulatedCost).toBe(salmon.currentCost);

    // Total monthly cost impact (Teriyaki 1000 units * delta)
    expect(result.summary.totalMonthlyCostDelta).toBeGreaterThan(0);
    expect(result.summary.totalMonthlyProfitImpact).toBe(-result.summary.totalMonthlyCostDelta);
  });

  it("3. Simulates multi-variable operational optimization (Yield improvement + Energy increase)", () => {
    const variables: HypotheticalVariables = {
      yieldLossAdjustments: { "ING-POLLO": -0.05 }, // -5% waste (improved yield)
      overheadDeltas: { energyRateDeltaPct: 0.2 }, // +20% energy
    };

    const result = simulateScenario(sampleBaseline, variables, {
      scenarioId: "SCEN-OPTIMIZED",
      name: "Better Yield & Energy Shock",
    });

    expect(result.scenarioId).toBe("SCEN-OPTIMIZED");
    expect(result.products.length).toBe(2);
  });

  it("4. Multi-scenario comparison matrix", () => {
    const scenA = simulateScenario(
      sampleBaseline,
      { supplierCostDeltas: { "SUPP-MAKRO": 0.1 } },
      { scenarioId: "SCEN-A", name: "Supplier Shock (+10%)" },
    );

    const scenB = simulateScenario(
      sampleBaseline,
      { yieldLossAdjustments: { "ING-POLLO": -0.05 }, overheadDeltas: { laborRateDeltaPct: -0.05 } },
      { scenarioId: "SCEN-B", name: "Efficiency Gains (-5% waste, -5% labor)" },
    );

    const comparison = compareScenarios(sampleBaseline.snapshotId, [scenA, scenB]);

    expect(comparison.scenarios.length).toBe(2);
    expect(comparison.scenarios[0].scenarioId).toBe("SCEN-A");
    expect(comparison.scenarios[0].monthlyProfitImpact).toBeLessThan(0); // Cost increase = negative profit impact

    expect(comparison.scenarios[1].scenarioId).toBe("SCEN-B");
    expect(comparison.scenarios[1].monthlyProfitImpact).toBeGreaterThan(0); // Cost reduction = positive profit impact
  });
});
