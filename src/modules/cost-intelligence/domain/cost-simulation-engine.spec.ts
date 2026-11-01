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
    expect(teriyaki.simulatedMarginPct!).toBeLessThan(teriyaki.currentMarginPct!);

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
      {
        yieldLossAdjustments: { "ING-POLLO": -0.05 },
        overheadDeltas: { laborRateDeltaPct: -0.05 },
      },
      { scenarioId: "SCEN-B", name: "Efficiency Gains (-5% waste, -5% labor)" },
    );

    const comparison = compareScenarios(sampleBaseline.snapshotId, [scenA, scenB]);

    expect(comparison.scenarios.length).toBe(2);
    expect(comparison.scenarios[0].scenarioId).toBe("SCEN-A");
    expect(comparison.scenarios[0].monthlyProfitImpact).toBeLessThan(0); // Cost increase = negative profit impact

    expect(comparison.scenarios[1].scenarioId).toBe("SCEN-B");
    expect(comparison.scenarios[1].monthlyProfitImpact).toBeGreaterThan(0); // Cost reduction = positive profit impact
  });

  it("5. Decision D-010: Computes partial subtotal and coverage metrics when portfolio has incomplete dishes", () => {
    const mixedBaseline: CostBaselineSnapshot = {
      snapshotId: "SNAP-MIXED-D010",
      createdAt: "2026-11-01T10:00:00Z",
      products: [
        {
          productId: "PROD-CALC-1",
          productName: "Plato Calculable 1",
          salesPrice: 10.0,
          monthlyVolume: 100,
          bomComponents: [
            {
              componentId: "ING-1",
              componentName: "Ingrediente 1",
              quantity: 1,
              unit: "kg",
              unitCost: 2.0,
            },
          ],
          overheads: { laborCost: 1.0, energyCost: 0.5, packagingCost: 0.5 },
          isCalculable: true,
          costProvenance: "recipe_catalog",
          missingDataReasons: [],
        },
        {
          productId: "PROD-CALC-2",
          productName: "Plato Calculable 2",
          salesPrice: 12.0,
          monthlyVolume: 200,
          bomComponents: [
            {
              componentId: "ING-2",
              componentName: "Ingrediente 2",
              quantity: 1,
              unit: "kg",
              unitCost: 3.0,
            },
          ],
          overheads: { laborCost: 1.0, energyCost: 0.5, packagingCost: 0.5 },
          isCalculable: true,
          costProvenance: "manual_catalog",
          missingDataReasons: [],
        },
        {
          productId: "PROD-INCOMPLETE-3",
          productName: "Plato Sin Escandallo ni Coste",
          salesPrice: 8.0,
          monthlyVolume: 150,
          bomComponents: [],
          overheads: { laborCost: 0, energyCost: 0, packagingCost: 0 },
          isCalculable: false,
          costProvenance: "incomplete",
          missingDataReasons: ["Sin escandallo ni coste manual"],
        },
      ],
    };

    const variables: HypotheticalVariables = {
      itemCostDeltas: { "ING-1": 0.1, "ING-2": 0.1 }, // +10%
    };

    const result = simulateScenario(mixedBaseline, variables, {
      scenarioId: "SCEN-D010-PARTIAL",
      name: "D-010 Partial Coverage Simulation",
    });

    // Coverage & D-010 Summary
    expect(result.summary.totalProductsCount).toBe(3);
    expect(result.summary.calculableProductsCount).toBe(2);
    expect(result.summary.excludedProductsCount).toBe(1);
    expect(result.summary.coveragePct).toBe(66.7);
    expect(result.summary.isFullyCalculable).toBe(false);

    // Product 1 base cost: 2.0 + 2.0 (overheads) = 4.0; monthly = 400
    // Product 2 base cost: 3.0 + 2.0 (overheads) = 5.0; monthly = 1000
    // Total current monthly cost should ONLY include product 1 & 2 = 1400
    expect(result.summary.totalCurrentMonthlyCost).toBe(1400);

    // Excluded product in result has isCalculable: false and 0 impact
    const incompleteProd = result.products.find((p) => p.productId === "PROD-INCOMPLETE-3")!;
    expect(incompleteProd.isCalculable).toBe(false);
    expect(incompleteProd.currentMonthlyCost).toBe(0);
    expect(incompleteProd.simulatedMonthlyCost).toBe(0);
    expect(incompleteProd.rawMaterialsCost).toBeNull();
    expect(incompleteProd.missingDataReasons).toContain("Sin escandallo ni coste manual");
  });

  it("6. Decision D-010: Handles scenario when 0 products are calculable without crashing or faking costs", () => {
    const zeroCalculableBaseline: CostBaselineSnapshot = {
      snapshotId: "SNAP-ZERO-CALC",
      createdAt: "2026-11-01T10:00:00Z",
      products: [
        {
          productId: "PROD-EMPTY-1",
          productName: "Plato Vació",
          salesPrice: 7.0,
          monthlyVolume: 50,
          bomComponents: [],
          overheads: { laborCost: 0, energyCost: 0, packagingCost: 0 },
          isCalculable: false,
          costProvenance: "incomplete",
          missingDataReasons: ["Sin datos"],
        },
      ],
    };

    const result = simulateScenario(
      zeroCalculableBaseline,
      {},
      {
        scenarioId: "SCEN-ZERO-CALC",
        name: "Zero Calculable Test",
      },
    );

    expect(result.summary.totalProductsCount).toBe(1);
    expect(result.summary.calculableProductsCount).toBe(0);
    expect(result.summary.excludedProductsCount).toBe(1);
    expect(result.summary.coveragePct).toBe(0);
    expect(result.summary.isFullyCalculable).toBe(false);
    expect(result.summary.totalCurrentMonthlyCost).toBe(0);
    expect(result.summary.totalSimulatedMonthlyCost).toBe(0);
    expect(result.summary.avgCostDeltaPct).toBe(0);
    expect(result.summary.avgMarginDeltaPct).toBe(0);
  });

  it("7. Decision D-010: compareScenarios excludes incomplete products from avgMarginPct and attaches coverage", () => {
    const partialBaseline: CostBaselineSnapshot = {
      snapshotId: "SNAP-PARTIAL",
      createdAt: "2026-11-01T10:00:00Z",
      products: [
        {
          productId: "PROD-CALC-1",
          productName: "Plato Completo 1",
          salesPrice: 10.0,
          monthlyVolume: 100,
          bomComponents: [
            {
              componentId: "ING-1",
              componentName: "Ingrediente 1",
              quantity: 1,
              unit: "kg",
              unitCost: 4.0,
            },
          ],
          overheads: { laborCost: 1.0, energyCost: 0, packagingCost: 0 },
          isCalculable: true,
          costProvenance: "recipe_catalog",
        },
        {
          productId: "PROD-INCOMPLETE-2",
          productName: "Plato Incompleto 2",
          salesPrice: 20.0,
          monthlyVolume: 50,
          bomComponents: [],
          overheads: { laborCost: 0, energyCost: 0, packagingCost: 0 },
          isCalculable: false,
          costProvenance: "incomplete",
        },
      ],
    };

    const scen = simulateScenario(
      partialBaseline,
      {},
      {
        scenarioId: "SCEN-COMP-1",
        name: "Coverage Scenario",
      },
    );

    const comparison = compareScenarios("SNAP-PARTIAL", [scen]);
    expect(comparison.scenarios.length).toBe(1);

    const compScen = comparison.scenarios[0];
    // Product 1 cost: 4.0 + 1.0 = 5.0. salesPrice: 10.0 => Margin = 50.0%
    // Incomplete product MUST NOT drag the average down to 25.0% or 0%
    expect(compScen.avgMarginPct).toBe(50.0);
    expect(compScen.totalProductsCount).toBe(2);
    expect(compScen.calculableProductsCount).toBe(1);
    expect(compScen.excludedProductsCount).toBe(1);
    expect(compScen.coveragePct).toBe(50.0);
    expect(compScen.isFullyCalculable).toBe(false);
  });

  it("8. Decision D-010: Dish with null or zero salesPrice returns null margins (never fake 0%)", () => {
    const unpricedBaseline: CostBaselineSnapshot = {
      snapshotId: "SNAP-UNPRICED",
      createdAt: "2026-11-01T10:00:00Z",
      products: [
        {
          productId: "PROD-FREE-SAMPLE",
          productName: "Muestra Degustación",
          salesPrice: null,
          monthlyVolume: 50,
          bomComponents: [
            {
              componentId: "ING-1",
              componentName: "Ingrediente 1",
              quantity: 1,
              unit: "kg",
              unitCost: 2.0,
            },
          ],
          overheads: { laborCost: 0.5, energyCost: 0, packagingCost: 0 },
          isCalculable: true,
          costProvenance: "recipe_catalog",
        },
        {
          productId: "PROD-ZERO-PRICE",
          productName: "Regalo Cortesía",
          salesPrice: 0,
          monthlyVolume: 50,
          bomComponents: [
            {
              componentId: "ING-1",
              componentName: "Ingrediente 1",
              quantity: 1,
              unit: "kg",
              unitCost: 1.5,
            },
          ],
          overheads: { laborCost: 0.5, energyCost: 0, packagingCost: 0 },
          isCalculable: true,
          costProvenance: "recipe_catalog",
        },
      ],
    };

    const scen = simulateScenario(
      unpricedBaseline,
      {},
      {
        scenarioId: "SCEN-NO-PRICE",
        name: "No Price Scenario",
      },
    );

    const sample = scen.products.find((p) => p.productId === "PROD-FREE-SAMPLE")!;
    expect(sample.salesPrice).toBeNull();
    expect(sample.currentMarginPct).toBeNull();
    expect(sample.simulatedMarginPct).toBeNull();
    expect(sample.marginDeltaPct).toBeNull();

    const zero = scen.products.find((p) => p.productId === "PROD-ZERO-PRICE")!;
    expect(zero.salesPrice).toBe(0);
    expect(zero.currentMarginPct).toBeNull();
    expect(zero.simulatedMarginPct).toBeNull();
    expect(zero.marginDeltaPct).toBeNull();

    // Summary average margin delta should be 0 because no products have calculable margins
    expect(scen.summary.avgMarginDeltaPct).toBe(0);
  });
});
