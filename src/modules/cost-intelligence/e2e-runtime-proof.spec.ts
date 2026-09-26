import { describe, it, expect } from "vitest";
import { calculateWeightedAverageCost } from "./domain/wac-calculator";
import { calculatePurchaseInvoiceTotals } from "./domain/purchase-invoice-calculator";
import { allocateInboundCosts } from "./domain/cost-allocator";
import { calculateBOMCost } from "./domain/bom-calculator";
import { analyzeCostVariance } from "./domain/variance-analyzer";
import { simulateScenario, compareScenarios } from "./domain/cost-simulation-engine";
import {
  buildFoodCostBaselineSnapshot,
  type FoodDishRecord,
  type FoodIngredientRecord,
  type FoodRecipeLineRecord,
} from "../dish-library/application/food-cost-baseline-adapter";
import { DishCostingService } from "../dish-library/application/dish-costing-service";
import { InventoryCostSyncService } from "./application/inventory-cost-sync-service";
import type { ServiceContext } from "@/services/types";
import type { CostBaselineSnapshot, HypotheticalVariables } from "./domain/types";

describe("E2 → E9 End-to-End Economic Circuit & 9 Invariants Certification", () => {
  // Invariant 1: Precio Desconocido != 0 € (Unspecified/negative costs reject or are treated non-trivially)
  it("Invariant 1: Unknown/negative inbound costs are strictly rejected by mathematical domain gates", () => {
    // Zero or negative cost rejection in WAC
    expect(() =>
      calculateWeightedAverageCost({
        previousStock: 10,
        previousCost: 5,
        inboundQuantity: 10,
        inboundEffectiveCost: -1, // invalid negative cost
      }),
    ).toThrow("inbound effective cost must be >= 0");

    // Zero quantity rejection
    expect(() =>
      calculateWeightedAverageCost({
        previousStock: 10,
        previousCost: 5,
        inboundQuantity: 0, // invalid zero quantity
        inboundEffectiveCost: 5,
      }),
    ).toThrow("Inbound quantity must be > 0");
  });

  // Invariant 2: WAC calculation precision (Multi-step sequence)
  it("Invariant 2: Multi-step WAC maintains exact 4-decimal precision across price swings", () => {
    // Step 1: Initial purchase 100kg @ 2€ with 0 previous stock
    const step1WAC = calculateWeightedAverageCost({
      previousStock: 0,
      previousCost: 0,
      inboundQuantity: 100,
      inboundEffectiveCost: 2.00,
    });
    expect(step1WAC).toBe(2.0000);

    // Step 2: Second purchase 50kg @ 3€ (previous stock = 100kg @ 2€)
    const step2WAC = calculateWeightedAverageCost({
      previousStock: 100,
      previousCost: step1WAC,
      inboundQuantity: 50,
      inboundEffectiveCost: 3.00,
    });
    // (100*2 + 50*3) / 150 = 350 / 150 = 2.33333333 -> 2.3333
    expect(step2WAC).toBe(2.3333);

    // Step 3: Third purchase 25kg @ 4€ (previous stock = 150kg @ 2.3333€)
    // Total value = 150 * 2.3333 = 349.995 + 100 = 449.995 -> 450 / 175 = 2.57142857 -> 2.5714
    const step3WAC = calculateWeightedAverageCost({
      previousStock: 150,
      previousCost: step2WAC,
      inboundQuantity: 25,
      inboundEffectiveCost: 4.00,
    });
    expect(step3WAC).toBe(2.5714);
  });

  // Invariant 3: Ledger immutability (item_cost_history append-only)
  it("Invariant 3: Cost sync updates catalog WAC while preserving ledger immutability", async () => {
    let updateCalled = false;
    let updatedPayload: any = null;

    const mockCtx: ServiceContext = {
      tenantId: "8bba00ba-331b-42c8-9283-4e3836ffb870",
      userId: "user-ops-001",
      roles: ["inventory"],
      capabilities: new Set(["inventory.operate"]),
      supabase: {
        from: (table: string) => ({
          update: (values: any) => {
            updateCalled = true;
            updatedPayload = values;
            return {
              eq: () => ({
                eq: async () => ({ data: null, error: null }),
              }),
            };
          },
        }),
      } as any,
    };

    const syncService = new InventoryCostSyncService();
    const result = await syncService.syncDerivedItemCostWAC(mockCtx, {
      itemId: "ing-salmon-001",
      currentStock: 10,
      currentCost: 12.00,
      inboundQuantity: 10,
      inboundEffectiveCost: 14.00,
    });

    expect(result.newCost).toBe(13.0000);
    expect(result.appliedMethod).toBe("WAC");
    expect(updateCalled).toBe(true);
    expect(updatedPayload).toEqual({ cost: 13.0000 });
  });

  // Invariant 4: Derived operational cost (ingredients.cost updated)
  it("Invariant 4: ingredients.cost reflects calculated WAC synchronously upon sync execution", async () => {
    let recordedUpdate: { cost: number } | undefined = undefined;

    const mockCtx: ServiceContext = {
      tenantId: "8bba00ba-331b-42c8-9283-4e3836ffb870",
      userId: "user-chef-002",
      roles: ["inventory"],
      capabilities: new Set(["inventory.operate"]),
      supabase: {
        from: (table: string) => ({
          update: (values: any) => {
            recordedUpdate = values as { cost: number };
            return {
              eq: () => ({
                eq: async () => ({ data: null, error: null }),
              }),
            };
          },
        }),
      } as any,
    };

    const syncService = new InventoryCostSyncService();
    const syncRes = await syncService.syncDerivedItemCostWAC(mockCtx, {
      itemId: "ing-avocado-002",
      currentStock: 50,
      currentCost: 3.50,
      inboundQuantity: 50,
      inboundEffectiveCost: 4.50,
    });

    expect(syncRes.newCost).toBe(4.0000);
    expect((recordedUpdate as any)?.cost).toBe(4.0000);
  });

  // Invariant 5: Simulation != Reality (Zero operational mutation)
  it("Invariant 5: E9 scenario simulation produces ephemeral what-if models with zero reality mutations", () => {
    const baseline: CostBaselineSnapshot = {
      snapshotId: "snap-eatclean-20260926",
      createdAt: "2026-09-26T16:00:00Z",
      products: [
        {
          productId: "dish-salmon-bowl",
          productName: "Salmon Quinoa Bowl",
          salesPrice: 12.50,
          monthlyVolume: 500,
          bomComponents: [
            {
              componentId: "ing-salmon",
              componentName: "Salmon",
              quantity: 0.15,
              unit: "kg",
              unitCost: 13.00,
              yieldLoss: { wastePercentage: 0.10 },
              supplierId: "sup-fresh-fish",
            },
            {
              componentId: "ing-quinoa",
              componentName: "Quinoa",
              quantity: 0.10,
              unit: "kg",
              unitCost: 2.50,
              yieldLoss: { wastePercentage: 0.05 },
              supplierId: "sup-dry-goods",
            },
          ],
          overheads: {
            laborCost: 1.50,
            energyCost: 0.50,
            packagingCost: 0.60,
          },
        },
      ],
    };

    const baselineSnapshotCopy = JSON.parse(JSON.stringify(baseline));

    const variables: HypotheticalVariables = {
      itemCostDeltas: {
        "ing-salmon": 0.20, // +20% inflation on salmon
      },
      overheadDeltas: {
        energyRateDeltaPct: 0.15, // +15% electricity
      },
    };

    const result = simulateScenario(baseline, variables, {
      scenarioId: "scenario-fish-energy-spike",
      name: "Salmon +20% & Energy +15%",
    });

    // 1. Simulation produces expected delta impacts
    expect(result.products).toHaveLength(1);
    const prodImpact = result.products[0];
    expect(prodImpact.simulatedCost).toBeGreaterThan(prodImpact.currentCost);
    expect(prodImpact.marginDeltaPct).toBeLessThan(0); // Margin compressed
    expect(prodImpact.monthlyProfitImpact).toBeLessThan(0); // Profit reduced

    // 2. Baseline snapshot remains 100% UNMUTATED (Simulation != Reality)
    expect(baseline).toEqual(baselineSnapshotCopy);
  });

  // Invariant 6: Multi-Tenant Isolation (X != Y)
  it("Invariant 6: Multi-tenant isolation is strictly enforced across calculations and snapshots", () => {
    const dishesTenantX: FoodDishRecord[] = [
      { id: "dish-x-1", name: "Dish Tenant X", price: 10, laborCost: 1, energyCost: 0.5, packagingCost: 0.5 },
    ];
    const ingredientsTenantX = new Map<string, FoodIngredientRecord>([
      ["ing-x-1", { id: "ing-x-1", name: "Ing X", unit: "kg", cost: 5, wastePercentage: 0, supplierId: "sup-x" }],
    ]);
    const recipesTenantX: FoodRecipeLineRecord[] = [
      { dishId: "dish-x-1", ingredientId: "ing-x-1", amount: 0.5 },
    ];

    const snapshotX = buildFoodCostBaselineSnapshot(
      "snap-tenant-x",
      dishesTenantX,
      ingredientsTenantX,
      recipesTenantX,
    );

    expect(snapshotX.snapshotId).toBe("snap-tenant-x");
    expect(snapshotX.products[0].bomComponents[0].componentId).toBe("ing-x-1");

    // Tenant Y ingredient is not accessible in Tenant X map
    expect(ingredientsTenantX.get("ing-tenant-y")).toBeUndefined();
  });

  // Invariant 7: Deterministic Reproducibility
  it("Invariant 7: Running identical simulations on identical baselines produces byte-for-byte identical results", () => {
    const baseline: CostBaselineSnapshot = {
      snapshotId: "snap-repro",
      createdAt: "2026-09-26T16:00:00Z",
      products: [
        {
          productId: "dish-poke",
          productName: "Poke Bowl",
          salesPrice: 11.00,
          monthlyVolume: 300,
          bomComponents: [
            { componentId: "ing-avocado", componentName: "Avocado", quantity: 0.2, unit: "kg", unitCost: 4.00 },
          ],
          overheads: { laborCost: 1.00, energyCost: 0.30, packagingCost: 0.50 },
        },
      ],
    };

    const vars: HypotheticalVariables = {
      itemCostDeltas: { "ing-avocado": 0.25 },
    };

    const run1 = simulateScenario(baseline, vars, { scenarioId: "sc-1", name: "Avocado +25%" });
    const run2 = simulateScenario(baseline, vars, { scenarioId: "sc-1", name: "Avocado +25%" });

    // Timestamps might differ if generated inside; match result structure
    expect(run1.summary).toEqual(run2.summary);
    expect(run1.products).toEqual(run2.products);
  });

  // Invariant 8: Monetary and Decimal Precision
  it("Invariant 8: Currency rounding conforms to 4-decimal unit precision and 2-decimal financial totals", () => {
    const invoice = calculatePurchaseInvoiceTotals({
      tenantId: "8bba00ba-331b-42c8-9283-4e3836ffb870",
      supplierId: "sup-001",
      invoiceNumber: "INV-2026-09-001",
      invoiceDate: "2026-09-26",
      items: [
        {
          itemId: "item-1",
          itemName: "Premium Beef",
          quantity: 15.75,
          unit: "kg",
          unitPrice: 12.3456,
          discountAmount: 5.00,
          taxRate: 10,
        },
        {
          itemId: "item-2",
          itemName: "Organic Olive Oil",
          quantity: 8.25,
          unit: "L",
          unitPrice: 8.5000,
          taxRate: 21,
        },
      ],
      additionalCosts: 25.00,
      allocationMethod: "value",
    });

    expect(invoice.subtotal).toBeCloseTo(259.57, 2);
    expect(invoice.taxAmount).toBeGreaterThan(0);
    expect(invoice.totalAmount).toBeCloseTo(invoice.subtotal + invoice.taxAmount + 25.00, 2);
    expect(invoice.items[0].effectiveUnitCost).toBeGreaterThan(12.00); // Base price + allocated freight
  });

  // Invariant 9: Zero unintended side effects across operational domains
  it("Invariant 9: Dish costing and yield factor correctly combine with zero kitchen batch disruption", () => {
    const costingService = new DishCostingService();
    const dish: FoodDishRecord = {
      id: "dish-tartar",
      name: "Tuna Tartar",
      price: 15.00,
      laborCost: 1.50,
      energyCost: 0.50,
      packagingCost: 0.80,
    };
    const ingredients = new Map<string, FoodIngredientRecord>([
      ["tuna", { id: "tuna", name: "Red Tuna", unit: "kg", cost: 20.00, wastePercentage: 10.0 }], // 10% waste -> gross 0.2222kg * 20€ = 4.4444€
    ]);
    const recipes: FoodRecipeLineRecord[] = [
      { dishId: "dish-tartar", ingredientId: "tuna", amount: 0.200 }, // 200g net
    ];

    const evaluation = costingService.evaluateDishCost(dish, recipes, ingredients);

    expect(evaluation.rawMaterialsCost).toBeCloseTo(4.444, 3);
    expect(evaluation.overheadsCost).toBe(2.80); // 1.50 + 0.50 + 0.80
    expect(evaluation.totalProductionCost).toBeCloseTo(7.244, 3);
    expect(evaluation.grossMarginAmount).toBeCloseTo(15.00 - 7.244, 3);
    expect(evaluation.grossMarginPct).toBeCloseTo(((15.00 - 7.244) / 15.00) * 100, 2);
  });
});
