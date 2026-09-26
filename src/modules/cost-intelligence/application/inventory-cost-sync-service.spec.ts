import { describe, expect, it } from "vitest";
import { ServiceContext } from "@/services/types";
import { InventoryCostSyncService } from "./inventory-cost-sync-service";

describe("InventoryCostSyncService (CR-COST-02)", () => {
  const service = new InventoryCostSyncService();

  const tenantA = "8bba00ba-331b-42c8-9283-4e3836ffb870";
  const tenantB = "7cba00ba-221b-32c8-8183-3e2826ffb999";

  const makeCtx = (tenantId: string): ServiceContext => ({
    tenantId,
    userId: `user-${tenantId}`,
    roles: ["company_admin"],
    capabilities: new Set(["inventory.operate"]),
    supabase: {
      from: () => ({
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    } as any,
  });

  it("1. Synchronizes item cost to new WAC across sequential purchases", async () => {
    const ctx = makeCtx(tenantA);

    // Step 1: 100kg @ 2.00€ + 50kg @ 3.00€
    const step1 = await service.syncDerivedItemCostWAC(ctx, {
      itemId: "ING-POLLO",
      currentStock: 100,
      currentCost: 2.0,
      inboundQuantity: 50,
      inboundEffectiveCost: 3.0,
    });

    expect(step1.newCost).toBe(2.3333);
    expect(step1.appliedMethod).toBe("WAC");

    // Step 2: 150kg @ 2.3333€ + 25kg @ 4.00€
    const step2 = await service.syncDerivedItemCostWAC(ctx, {
      itemId: "ING-POLLO",
      currentStock: 150,
      currentCost: 2.3333,
      inboundQuantity: 25,
      inboundEffectiveCost: 4.0,
    });

    expect(step2.newCost).toBe(2.5714);
  });

  it("2. Multi-tenant isolation: Tenant A cost sync does not affect Tenant B", async () => {
    const ctxA = makeCtx(tenantA);
    const ctxB = makeCtx(tenantB);

    const resA = await service.syncDerivedItemCostWAC(ctxA, {
      itemId: "ING-ARROZ",
      currentStock: 50,
      currentCost: 1.5,
      inboundQuantity: 50,
      inboundEffectiveCost: 2.5,
    });

    const resB = await service.syncDerivedItemCostWAC(ctxB, {
      itemId: "ING-ARROZ",
      currentStock: 10,
      currentCost: 1.0,
      inboundQuantity: 10,
      inboundEffectiveCost: 1.2,
    });

    expect(resA.newCost).toBe(2.0); // (50*1.5 + 50*2.5)/100 = 200/100 = 2.0
    expect(resB.newCost).toBe(1.1); // (10*1.0 + 10*1.2)/20 = 22/20 = 1.1
    expect(resA.newCost).not.toBe(resB.newCost);
  });
});
