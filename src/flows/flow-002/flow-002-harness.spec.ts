/**
 * OPERATIONAL-FLOW-002 Phase 2 — Flow Harness integrity + orchestration.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Flow002Harness,
  resetFlow002Harness,
} from "./Flow002Harness";
import type { Flow002RuntimeIdentity } from "./Flow002Context";
import type { OrderFacade } from "@/order/OrderFacade";
import type { ProductionFacade } from "@/production/ProductionFacade";
import type { KitchenExecutionFacade } from "@/kitchen/KitchenExecutionFacade";
import type { DeliveryFacade } from "@/delivery/DeliveryFacade";

function identity(
  partial: Partial<Flow002RuntimeIdentity> = {},
): Flow002RuntimeIdentity {
  return {
    session: { present: true, userId: "u1" },
    tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
    permissions: {
      roles: ["logistics", "kitchen", "company_admin"],
      capabilities: [
        "orders.read",
        "orders.write",
        "kitchen.operate",
        "production.operate",
        "logistics.operate",
      ],
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
      planId: "plan:2026-08-06",
      batchId: null,
      status: "planned",
      context: {
        queue: {
          batches: [{ id: "batch:2026-08-06:d1" }],
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
        dayDate: "2026-08-06",
        queue: {
          dayDate: "2026-08-06",
          units: [
            {
              id: "batch:2026-08-06:d1",
              productionBatchId: "batch:2026-08-06:d1",
              dayDate: "2026-08-06",
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
      unitId: "batch:2026-08-06:d1",
      status: "READY",
      context: null,
      progress: null,
      errors: [],
    })),
    completeExecution: vi.fn(async () => ({
      ok: true,
      unitId: "batch:2026-08-06:d1",
      status: "COMPLETED",
      context: null,
      progress: null,
      errors: [],
    })),
  } as unknown as KitchenExecutionFacade;

  const delivery = {
    getDeliveryContext: vi.fn(async () => ({
      ok: true,
      context: {
        tenantId: "t1",
        operationalDay: "2026-08-06",
        assignments: [
          {
            id: "assignment:o1",
            tenantId: "t1",
            commitmentRef: "o1",
            executionRef: null,
            stopId: "stop:o1",
            routeId: null,
            status: "Planned",
            windowStart: null,
            windowEnd: null,
            destinationLabel: "Cliente Uno",
          },
        ],
        routes: [],
        stops: [],
        permissions: {
          canAssign: true,
          canConfirm: true,
          canViewEvidence: true,
        },
      },
      errors: [],
    })),
    confirmDelivery: vi.fn(async () => ({
      ok: true,
      assignmentId: "assignment:o1",
      status: "Confirmed",
      confirmation: {
        id: "confirmation:o1",
        tenantId: "t1",
        assignmentId: "assignment:o1",
        stopId: "stop:o1",
        confirmedAt: "2026-08-06T12:00:00.000Z",
        confirmedBy: "u1",
        outcome: "success",
        note: null,
      },
      context: null,
      errors: [],
    })),
  } as unknown as DeliveryFacade;

  return { orders, production, kitchen, delivery };
}

describe("OPERATIONAL-FLOW-002 Flow002Harness", () => {
  afterEach(() => {
    resetFlow002Harness();
  });

  it("runCommitmentToConfirmedDelivery orchestrates full fulfillment chain", async () => {
    const deps = mockDeps();
    const harness = new Flow002Harness(deps);
    const result = await harness.runCommitmentToConfirmedDelivery(identity(), {
      dayDate: "2026-08-06",
    });

    expect(result.ok).toBe(true);
    expect(result.context?.orderIds).toEqual(["o1", "o2"]);
    expect(result.context?.productionPlanId).toBe("plan:2026-08-06");
    expect(result.context?.completedUnitId).toBe("batch:2026-08-06:d1");
    expect(result.context?.assignmentIds).toEqual(["assignment:o1"]);
    expect(result.context?.confirmationId).toBe("confirmation:o1");
    expect(result.steps.map((s) => s.transition)).toEqual([
      "IdentityGate",
      "OrderHop",
      "ProductionHop",
      "KitchenHop",
      "ExecutionComplete",
      "DeliveryHop",
      "ConfirmationHop",
    ]);
    expect(result.steps.every((s) => s.ok)).toBe(true);
    expect(deps.orders.getOrdersByDeliveryDay).toHaveBeenCalledOnce();
    expect(deps.production.generateProductionPlan).toHaveBeenCalledOnce();
    expect(deps.kitchen.getExecutionQueue).toHaveBeenCalledOnce();
    expect(deps.kitchen.completeExecution).toHaveBeenCalledOnce();
    expect(deps.delivery.getDeliveryContext).toHaveBeenCalledOnce();
    expect(deps.delivery.confirmDelivery).toHaveBeenCalledOnce();
  });

  it("reports which transition failed — never invents business why", async () => {
    const deps = mockDeps();
    (
      deps.delivery.confirmDelivery as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      ok: false,
      assignmentId: "assignment:o1",
      status: null,
      confirmation: null,
      context: null,
      errors: [
        {
          code: "INVALID_STATE",
          message: "order not ready",
          recoverable: true,
        },
      ],
    });
    const harness = new Flow002Harness(deps);
    const result = await harness.runCommitmentToConfirmedDelivery(identity(), {
      dayDate: "2026-08-06",
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("TRANSITION_FAILED");
    expect(result.errors[0]?.transition).toBe("ConfirmationHop");
    expect(result.steps.find((s) => s.transition === "ConfirmationHop")?.ok).toBe(
      false,
    );
  });

  it("rejects missing session / tenant at IdentityGate", async () => {
    const harness = new Flow002Harness(mockDeps());
    const denied = await harness.runCommitmentToConfirmedDelivery(
      identity({ session: { present: false, userId: null } }),
      { dayDate: "2026-08-06" },
    );
    const mismatch = await harness.runCommitmentToConfirmedDelivery(
      identity({ tenant: null }),
      { dayDate: "2026-08-06" },
    );
    expect(denied.ok).toBe(false);
    expect(denied.errors[0]?.code).toBe("PERMISSION_DENIED");
    expect(mismatch.errors[0]?.code).toBe("TENANT_MISMATCH");
  });

  it("transitionKitchenToDelivery and transitionDeliveryToConfirmation compose Facades", async () => {
    const deps = mockDeps();
    const harness = new Flow002Harness(deps);
    const kd = await harness.transitionKitchenToDelivery(identity(), {
      dayDate: "2026-08-06",
    });
    const dc = await harness.transitionDeliveryToConfirmation(identity(), {
      dayDate: "2026-08-06",
    });
    expect(kd.ok).toBe(true);
    expect(kd.context?.assignmentIds).toEqual(["assignment:o1"]);
    expect(dc.ok).toBe(true);
    expect(dc.context?.confirmationId).toBe("confirmation:o1");
  });

  it("source never imports Supabase / repositories / Billing / business services", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/flows/flow-002/Flow002Harness.ts"),
      "utf8",
    );
    expect(src).toContain("OrderFacade");
    expect(src).toContain("ProductionFacade");
    expect(src).toContain("KitchenExecutionFacade");
    expect(src).toContain("DeliveryFacade");
    expect(src).not.toMatch(/BillingFacade|calculateInvoice/);
    expect(src).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(src).not.toMatch(/from ["']@\/services\//);
    expect(src).not.toMatch(/from ["']@\/modules\/operations/);
    expect(src).not.toMatch(/\.from\(/);
    expect(src).toContain("Owns no business behaviour");
  });

  it("architecture + behaviours: Flow owns collaboration · Behaviour names achievement", () => {
    const arch = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/OPERATIONAL_FLOW_002.md"),
      "utf8",
    );
    const behaviours = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/OPERATIONAL_BEHAVIOURS.md"),
      "utf8",
    );
    expect(arch).toContain("FLOW validates transitions");
    expect(arch).toContain("Operational Fulfillment Flow");
    expect(arch).toContain("Delivery Confirmation");
    expect(behaviours).toContain("Fulfill Weekly Commitment");
    expect(behaviours).toContain("Operational Commitment Fulfilled");
    expect(behaviours).toContain("Behaviour   → names what the system achieves");
  });
});
