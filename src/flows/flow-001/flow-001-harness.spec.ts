/**
 * OPERATIONAL-FLOW-001 Phase 2 — Flow Harness integrity + orchestration.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Flow001Harness,
  resetFlow001Harness,
} from "./Flow001Harness";
import type { Flow001RuntimeIdentity } from "./Flow001Context";
import type { OrderFacade } from "@/order/OrderFacade";
import type { ProductionFacade } from "@/production/ProductionFacade";
import type { KitchenExecutionFacade } from "@/kitchen/KitchenExecutionFacade";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function identity(
  partial: Partial<Flow001RuntimeIdentity> = {},
): Flow001RuntimeIdentity {
  return {
    session: { present: true, userId: "u1" },
    tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
    permissions: {
      roles: ["kitchen", "company_admin"],
      capabilities: ["orders.read", "kitchen.operate", "production.read"],
    },
    currentUser: {
      id: "u1",
      fullName: "Alex",
      avatarUrl: null,
      locale: "es",
      phone: null,
    },
    ...partial,
  };
}

function mockDeps() {
  const orders = {
    getOrdersByDeliveryDay: vi.fn(async () => ({
      ok: true,
      orders: [{ id: "o1" }, { id: "o2" }],
      errors: [],
    })),
  } as unknown as OrderFacade;

  const production = {
    generateProductionPlan: vi.fn(async () => ({
      ok: true,
      planId: "plan:2026-08-05",
      batchId: null,
      status: "planned",
      context: {
        queue: {
          batches: [{ id: "batch:2026-08-05:d1" }],
        },
      },
      load: null,
      errors: [],
    })),
  } as unknown as ProductionFacade;

  const kitchen = {
    getExecutionQueue: vi.fn(async () => ({
      ok: true,
      context: {
        tenantId: "t1",
        dayDate: "2026-08-05",
        queue: {
          dayDate: "2026-08-05",
          units: [
            {
              id: "batch:2026-08-05:d1",
              productionBatchId: "batch:2026-08-05:d1",
              dayDate: "2026-08-05",
              dishId: "d1",
              label: "Bowl",
              portionCount: 10,
              status: "READY",
            },
          ],
        },
        permissions: {
          canReadQueue: true,
          canOperate: true,
          canAssign: false,
          canBlock: false,
        },
      },
      errors: [],
    })),
    markExecutionReady: vi.fn(async () => ({
      ok: true,
      unitId: "batch:2026-08-05:d1",
      status: "READY",
      context: null,
      progress: null,
      errors: [],
    })),
    completeExecution: vi.fn(async () => ({
      ok: true,
      unitId: "batch:2026-08-05:d1",
      status: "COMPLETED",
      context: null,
      progress: null,
      errors: [],
    })),
  } as unknown as KitchenExecutionFacade;

  return { orders, production, kitchen };
}

describe("OPERATIONAL-FLOW-001 Flow001Harness", () => {
  afterEach(() => {
    resetFlow001Harness();
  });

  it("runCommitmentToExecutedWork orchestrates Order → Production → Kitchen → Complete", async () => {
    const deps = mockDeps();
    const harness = new Flow001Harness(deps);
    const result = await harness.runCommitmentToExecutedWork(identity(), {
      dayDate: "2026-08-05",
    });

    expect(result.ok).toBe(true);
    expect(result.context?.orderIds).toEqual(["o1", "o2"]);
    expect(result.context?.productionPlanId).toBe("plan:2026-08-05");
    expect(result.context?.completedUnitId).toBe("batch:2026-08-05:d1");
    expect(result.steps.map((s) => s.transition)).toEqual([
      "IdentityGate",
      "OrderHop",
      "ProductionHop",
      "KitchenHop",
      "ExecutionComplete",
    ]);
    expect(result.steps.every((s) => s.ok)).toBe(true);
    expect(deps.orders.getOrdersByDeliveryDay).toHaveBeenCalledOnce();
    expect(deps.production.generateProductionPlan).toHaveBeenCalledOnce();
    expect(deps.kitchen.getExecutionQueue).toHaveBeenCalledOnce();
    expect(deps.kitchen.completeExecution).toHaveBeenCalledOnce();
  });

  it("rejects missing session / tenant at IdentityGate", async () => {
    const harness = new Flow001Harness(mockDeps());
    const denied = await harness.runCommitmentToExecutedWork(
      identity({ session: { present: false, userId: null } }),
      { dayDate: "2026-08-05" },
    );
    const mismatch = await harness.runCommitmentToExecutedWork(
      identity({ tenant: null }),
      { dayDate: "2026-08-05" },
    );
    expect(denied.ok).toBe(false);
    expect(denied.errors[0]?.code).toBe("PERMISSION_DENIED");
    expect(mismatch.errors[0]?.code).toBe("TENANT_MISMATCH");
  });

  it("transitionOrderToProduction and transitionProductionToKitchen compose Facades", async () => {
    const deps = mockDeps();
    const harness = new Flow001Harness(deps);
    const op = await harness.transitionOrderToProduction(identity(), {
      dayDate: "2026-08-05",
    });
    const pk = await harness.transitionProductionToKitchen(identity(), {
      dayDate: "2026-08-05",
    });
    expect(op.ok).toBe(true);
    expect(op.context?.productionPlanId).toBe("plan:2026-08-05");
    expect(pk.ok).toBe(true);
    expect(pk.context?.executionUnitIds).toHaveLength(1);
  });

  it("source never imports Supabase / repositories / business services", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/flows/flow-001/Flow001Harness.ts"),
      "utf8",
    );
    expect(src).toContain("OrderFacade");
    expect(src).toContain("ProductionFacade");
    expect(src).toContain("KitchenExecutionFacade");
    expect(src).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(src).not.toMatch(/from ["']@\/services\//);
    expect(src).not.toMatch(/from ["']@\/modules\/operations/);
    expect(src).not.toMatch(/\.from\(/);
    expect(src).toContain("Owns no business behaviour");
  });

  it("official definition: Flow owns collaboration, not behaviour", () => {
    const arch = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/OPERATIONAL_FLOW_001.md"),
      "utf8",
    );
    expect(arch).toContain("FLOW validates transitions");
    expect(arch).toContain("NOT validate Capabilities");
    expect(arch).toContain("Operational Flow Harness");
    expect(arch).toContain("Business behaviour never migrates");
  });
});
