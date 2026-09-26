import { describe, expect, it } from "vitest";
import { allocateInboundCosts } from "./cost-allocator";
import { InboundPurchaseLine } from "./types";

describe("Cost Allocation Engine (E3)", () => {
  const sampleLines: InboundPurchaseLine[] = [
    { itemId: "ING-ARROZ", itemName: "Arroz Jazmín", quantity: 25, unit: "kg", unitPrice: 1.3, weightKg: 1, volumeM3: 0.002 },
    { itemId: "ING-POLLO", itemName: "Pechuga de Pollo", quantity: 20, unit: "kg", unitPrice: 4.3, weightKg: 1, volumeM3: 0.0015 },
    { itemId: "ING-TOMATE", itemName: "Tomate Cherry", quantity: 10, unit: "kg", unitPrice: 2.1, weightKg: 1, volumeM3: 0.003 },
  ];

  it("1. Allocates zero additional costs cleanly without altering base prices", () => {
    const result = allocateInboundCosts(sampleLines, 0, "value");

    expect(result.totalBaseAmount).toBe(139.5); // 25*1.3 (32.5) + 20*4.3 (86.0) + 10*2.1 (21.0)
    expect(result.totalAdditionalCosts).toBe(0);
    expect(result.totalEffectiveAmount).toBe(139.5);
    expect(result.lines[0].effectiveUnitCost).toBe(1.3);
    expect(result.lines[1].effectiveUnitCost).toBe(4.3);
    expect(result.lines[2].effectiveUnitCost).toBe(2.1);
  });

  it("2. Allocates additional transport costs by Value with zero penny drift", () => {
    const additionalCosts = 50.0; // 50€ portes
    const result = allocateInboundCosts(sampleLines, additionalCosts, "value");

    expect(result.totalBaseAmount).toBe(139.5);
    expect(result.totalAdditionalCosts).toBe(50.0);
    expect(result.totalEffectiveAmount).toBe(189.5);

    // Sum of allocated overheads must equal additionalCosts exactly
    const sumOverheads = result.lines.reduce((acc, l) => acc + l.allocatedOverhead, 0);
    expect(Math.round(sumOverheads * 100) / 100).toBe(50.0);

    // Pechuga has largest base value (86/139.5 = 61.65%), so gets largest overhead
    expect(result.lines[1].allocatedOverhead).toBeGreaterThan(result.lines[0].allocatedOverhead);
    expect(result.lines[0].effectiveUnitCost).toBeGreaterThan(1.3);
  });

  it("3. Allocates additional transport costs by Weight", () => {
    // Total weight = 25*1 + 20*1 + 10*1 = 55kg
    const additionalCosts = 55.0; // 1€ per kg
    const result = allocateInboundCosts(sampleLines, additionalCosts, "weight");

    expect(result.lines[0].allocatedOverhead).toBe(25.0); // 25kg = 25€
    expect(result.lines[1].allocatedOverhead).toBe(20.0); // 20kg = 20€
    expect(result.lines[2].allocatedOverhead).toBe(10.0); // 10kg = 10€
    expect(result.lines[0].effectiveUnitCost).toBe(2.3); // (32.5 + 25) / 25 = 2.30
  });

  it("4. Allocates by Units and Manual overrides", () => {
    const unitResult = allocateInboundCosts(sampleLines, 55.0, "units");
    expect(unitResult.lines[0].allocatedOverhead).toBe(25.0);

    const manualLines: InboundPurchaseLine[] = [
      { ...sampleLines[0], manualOverhead: 15.0 },
      { ...sampleLines[1], manualOverhead: 25.0 },
      { ...sampleLines[2], manualOverhead: 10.0 },
    ];
    const manualResult = allocateInboundCosts(manualLines, 50.0, "manual");
    expect(manualResult.lines[0].allocatedOverhead).toBe(15.0);
    expect(manualResult.lines[1].allocatedOverhead).toBe(25.0);
    expect(manualResult.lines[2].allocatedOverhead).toBe(10.0);
  });

  it("5. Throws on invalid inputs (negative costs or manual mismatch)", () => {
    expect(() => allocateInboundCosts(sampleLines, -10, "value")).toThrow();

    const badManual: InboundPurchaseLine[] = [
      { ...sampleLines[0], manualOverhead: 10.0 },
      { ...sampleLines[1], manualOverhead: 10.0 },
    ];
    expect(() => allocateInboundCosts(badManual, 50.0, "manual")).toThrow();
  });
});
