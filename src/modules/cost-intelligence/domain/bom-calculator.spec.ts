import { describe, expect, it } from "vitest";
import { calculateBOMCost } from "./bom-calculator";
import { BOMComponent, ProductionOverheadsConfig } from "./types";

describe("BOM & Production Cost Calculator (E4, E5, E6)", () => {
  const sampleComponents: BOMComponent[] = [
    { componentId: "ING-POLLO", componentName: "Pechuga de Pollo", quantity: 0.18, unit: "kg", unitCost: 6.2, yieldLoss: { wastePercentage: 0.15 } },
    { componentId: "ING-ARROZ", componentName: "Arroz Jazmín", quantity: 0.15, unit: "kg", unitCost: 1.8 },
    { componentId: "ING-SALSA", componentName: "Salsa Teriyaki", quantity: 0.03, unit: "kg", unitCost: 7.5 },
  ];

  const sampleOverheads: ProductionOverheadsConfig = {
    laborCost: 0.7, // 3 min @ 14€/h
    energyCost: 0.18,
    packagingCost: 0.32,
  };

  it("1. Correctly factors in Yield & Loss (Waste %) into gross requirement and cost", () => {
    const result = calculateBOMCost("PROD-TERIYAKI", "Pollo Teriyaki Fit", sampleComponents, sampleOverheads);

    // Pollo: Net 0.18kg / (1 - 0.15) = 0.2118kg gross. 0.2118 * 6.2 = ~1.313€
    const polloBreakdown = result.componentBreakdown.find((c) => c.componentId === "ING-POLLO")!;
    expect(polloBreakdown.grossQuantity).toBeGreaterThan(0.18);
    expect(polloBreakdown.effectiveCost).toBeCloseTo(1.313, 2);

    // Arroz: Net 0.15kg, 0 waste => 0.15 * 1.8 = 0.27€
    const arrozBreakdown = result.componentBreakdown.find((c) => c.componentId === "ING-ARROZ")!;
    expect(arrozBreakdown.grossQuantity).toBe(0.15);
    expect(arrozBreakdown.effectiveCost).toBeCloseTo(0.27, 2);

    expect(result.rawMaterialsCost).toBeGreaterThan(1.8);
    expect(result.overheadsCost).toBeCloseTo(1.2, 2); // 0.70 + 0.18 + 0.32 = 1.20€
    expect(result.totalProductionCost).toBe(result.rawMaterialsCost + result.overheadsCost);
  });

  it("2. Handles zero overheads cleanly", () => {
    const result = calculateBOMCost("PROD-TEST", "Basic Item", [
      { componentId: "C1", componentName: "Comp 1", quantity: 1, unit: "ud", unitCost: 2.5 },
    ]);

    expect(result.rawMaterialsCost).toBe(2.5);
    expect(result.overheadsCost).toBe(0);
    expect(result.totalProductionCost).toBe(2.5);
  });

  it("3. Throws on invalid waste percentage (>= 1.0 or < 0)", () => {
    expect(() =>
      calculateBOMCost("PROD-BAD", "Bad Waste", [
        { componentId: "C1", componentName: "Comp 1", quantity: 1, unit: "ud", unitCost: 2.5, yieldLoss: { wastePercentage: 1.2 } },
      ]),
    ).toThrow();
  });
});
