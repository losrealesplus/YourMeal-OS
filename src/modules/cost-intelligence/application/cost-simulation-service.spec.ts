import { beforeEach, describe, expect, it } from "vitest";
import { CostSimulationService } from "./cost-simulation-service";
import { CostBaselineSnapshot } from "../domain/types";

describe("Cost Simulation Application Service (E9)", () => {
  let service: CostSimulationService;

  const sampleBaseline: CostBaselineSnapshot = {
    snapshotId: "SNAP-DEMO-01",
    createdAt: "2026-09-26T12:00:00Z",
    products: [
      {
        productId: "PROD-1",
        productName: "Menu Ejecutivo",
        salesPrice: 12.5,
        monthlyVolume: 800,
        bomComponents: [
          { componentId: "ING-1", componentName: "Carne", quantity: 0.25, unit: "kg", unitCost: 8.0, supplierId: "SUPP-MEAT" },
        ],
        overheads: { laborCost: 1.0, energyCost: 0.3, packagingCost: 0.4 },
      },
    ],
  };

  beforeEach(() => {
    service = new CostSimulationService();
  });

  it("1. Executes and stores simulation scenarios", () => {
    const result = service.executeSimulation({
      scenarioId: "SCEN-01",
      name: "Meat Price Surge",
      baseline: sampleBaseline,
      variables: {
        supplierCostDeltas: { "SUPP-MEAT": 0.15 },
      },
    });

    expect(result.scenarioId).toBe("SCEN-01");
    expect(result.summary.totalMonthlyCostDelta).toBeGreaterThan(0);

    // Retrieve from store
    const retrieved = service.getScenario("SCEN-01");
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe("Meat Price Surge");
  });

  it("2. Compares multiple stored scenarios against baseline", () => {
    service.executeSimulation({
      scenarioId: "SCEN-A",
      name: "Inflation Scenario",
      baseline: sampleBaseline,
      variables: {
        supplierCostDeltas: { "SUPP-MEAT": 0.1 },
        overheadDeltas: { energyRateDeltaPct: 0.2 },
      },
    });

    service.executeSimulation({
      scenarioId: "SCEN-B",
      name: "Renegotiation Scenario",
      baseline: sampleBaseline,
      variables: {
        supplierCostDeltas: { "SUPP-MEAT": -0.05 },
      },
    });

    const comparison = service.compareStoredScenarios(sampleBaseline.snapshotId, ["SCEN-A", "SCEN-B"]);

    expect(comparison.scenarios.length).toBe(2);
    expect(comparison.scenarios.find((s) => s.scenarioId === "SCEN-A")?.monthlyProfitImpact).toBeLessThan(0);
    expect(comparison.scenarios.find((s) => s.scenarioId === "SCEN-B")?.monthlyProfitImpact).toBeGreaterThan(0);
  });
});
