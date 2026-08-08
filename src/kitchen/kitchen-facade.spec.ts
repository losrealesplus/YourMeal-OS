import { afterEach, describe, expect, it, vi } from "vitest";
import {
  KitchenExecutionFacade,
  resetKitchenExecutionFacade,
} from "./KitchenExecutionFacade";
import {
  assignOperatorCommand,
  completeExecutionCommand,
  markExecutionReadyCommand,
  pauseExecutionCommand,
  startExecutionCommand,
} from "./KitchenCommands";
import {
  getBlockedExecutionQuery,
  getCompletedExecutionQuery,
  getExecutionProgressQuery,
  getExecutionQueueQuery,
  getExecutionUnitsQuery,
  getOperatorAssignmentsQuery,
} from "./KitchenQueries";
import type { KitchenRuntimeIdentity } from "./kitchenServiceContext";
import type { ProductionFacade } from "@/production/ProductionFacade";
import type {
  ProductionBatch,
  ProductionContext,
} from "@/production/ProductionContext";

function identity(
  partial: Partial<KitchenRuntimeIdentity> = {},
): KitchenRuntimeIdentity {
  return {
    session: { present: true, userId: "u1" },
    tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
    permissions: {
      roles: ["kitchen", "company_admin"],
      capabilities: ["kitchen.operate"],
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

function batch(
  partial: Partial<ProductionBatch> = {},
): ProductionBatch {
  return {
    id: "batch:2026-08-05:d1",
    scope: { dayDate: "2026-08-05" },
    dishId: "d1",
    dishName: "Bowl",
    portionCount: 10,
    status: "queued",
    orderIds: ["o1"],
    constraints: {
      allergens: [],
      modifications: [],
      isCustom: false,
    },
    readiness: {
      releasedToKitchen: false,
      blockedReason: null,
    },
    ...partial,
  };
}

function productionContext(
  batches: ProductionBatch[],
): ProductionContext {
  return {
    summary: {
      id: "plan:2026-08-05",
      scope: { dayDate: "2026-08-05" },
      status: "planned",
      load: {
        scope: { dayDate: "2026-08-05" },
        portionCount: 10,
        batchCount: batches.length,
        customLineCount: 0,
      },
      batchCount: batches.length,
      readiness: false,
      tenantId: "t1",
    },
    queue: { scope: { dayDate: "2026-08-05" }, batches },
    capacity: null,
    schedule: null,
    permissions: {
      canRead: true,
      canPlan: true,
      canRelease: true,
      canViewKitchen: true,
    },
    sourceOrders: { orderIds: ["o1"] },
  };
}

function mockProduction(
  overrides: Partial<ProductionFacade> = {},
): ProductionFacade {
  const ctx = productionContext([batch()]);
  return {
    getProductionPlan: vi.fn(async () => ({
      ok: true,
      context: ctx,
      errors: [],
    })),
    markBatchReady: vi.fn(async () => ({
      ok: true,
      planId: "plan:2026-08-05",
      batchId: "batch:2026-08-05:d1",
      status: "released",
      context: productionContext([
        batch({ status: "released", readiness: { releasedToKitchen: true } }),
      ]),
      load: null,
      errors: [],
    })),
    closeBatch: vi.fn(async () => ({
      ok: true,
      planId: "plan:2026-08-05",
      batchId: "batch:2026-08-05:d1",
      status: "done",
      context: productionContext([
        batch({
          status: "done",
          readiness: { releasedToKitchen: true },
        }),
      ]),
      load: null,
      errors: [],
    })),
    ...overrides,
  } as unknown as ProductionFacade;
}

describe("KitchenExecutionFacade execution API", () => {
  afterEach(() => {
    resetKitchenExecutionFacade();
  });

  it("GetExecutionQueue composes ProductionFacade — returns ExecutionUnits not Orders", async () => {
    const production = mockProduction();
    const facade = new KitchenExecutionFacade({ production });

    const result = await facade.getExecutionQueue(
      identity(),
      getExecutionQueueQuery({ dayDate: "2026-08-05" }),
    );

    expect(production.getProductionPlan).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
    expect(result.context?.queue.units).toHaveLength(1);
    expect(result.context?.queue.units[0]?.id).toBe("batch:2026-08-05:d1");
    expect(result.context?.queue.units[0]?.status).toBe("READY");
    expect(result.context?.queue.units[0]?.productionBatchId).toBe(
      "batch:2026-08-05:d1",
    );
  });

  it("MarkExecutionReady composes ProductionFacade.markBatchReady", async () => {
    const production = mockProduction();
    const facade = new KitchenExecutionFacade({ production });

    const result = await facade.markExecutionReady(
      identity(),
      markExecutionReadyCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
      }),
    );

    expect(production.markBatchReady).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: "MarkBatchReady",
        dayDate: "2026-08-05",
        dishId: "d1",
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.unitId).toBe("batch:2026-08-05:d1");
  });

  it("CompleteExecution composes ProductionFacade.closeBatch", async () => {
    const production = mockProduction();
    const facade = new KitchenExecutionFacade({ production });

    const result = await facade.completeExecution(
      identity(),
      completeExecutionCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
      }),
    );

    expect(production.closeBatch).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
    expect(result.status).toBe("COMPLETED");
  });

  it("StartExecution / PauseExecution / AssignOperator return UNIMPLEMENTED", async () => {
    const production = mockProduction();
    const facade = new KitchenExecutionFacade({ production });
    const id = identity();

    const start = await facade.startExecution(
      id,
      startExecutionCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
      }),
    );
    const pause = await facade.pauseExecution(
      id,
      pauseExecutionCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
      }),
    );
    const assign = await facade.assignOperator(
      id,
      assignOperatorCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
        operatorId: "op1",
      }),
    );

    expect(start.ok).toBe(false);
    expect(start.errors[0]?.code).toBe("UNIMPLEMENTED");
    expect(pause.errors[0]?.code).toBe("UNIMPLEMENTED");
    expect(assign.errors[0]?.code).toBe("UNIMPLEMENTED");
  });

  it("GetCompletedExecution filters COMPLETED units", async () => {
    const production = mockProduction({
      getProductionPlan: vi.fn(async () => ({
        ok: true,
        context: productionContext([
          batch({ status: "done" }),
          batch({
            id: "batch:2026-08-05:d2",
            dishId: "d2",
            status: "queued",
          }),
        ]),
        errors: [],
      })),
    });
    const facade = new KitchenExecutionFacade({ production });

    const result = await facade.getCompletedExecution(
      identity(),
      getCompletedExecutionQuery({ dayDate: "2026-08-05" }),
    );

    expect(result.ok).toBe(true);
    expect(result.units).toHaveLength(1);
    expect(result.units[0]?.status).toBe("COMPLETED");
  });

  it("GetExecutionProgress returns operational percent", async () => {
    const production = mockProduction({
      getProductionPlan: vi.fn(async () => ({
        ok: true,
        context: productionContext([batch({ status: "in_progress" })]),
        errors: [],
      })),
    });
    const facade = new KitchenExecutionFacade({ production });

    const result = await facade.getExecutionProgress(
      identity(),
      getExecutionProgressQuery({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.progress?.status).toBe("IN_PROGRESS");
    expect(result.progress?.percent).toBe(50);
  });

  it("GetOperatorAssignments is UNIMPLEMENTED", async () => {
    const facade = new KitchenExecutionFacade({ production: mockProduction() });
    const result = await facade.getOperatorAssignments(
      identity(),
      getOperatorAssignmentsQuery({ dayDate: "2026-08-05" }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("UNIMPLEMENTED");
  });

  it("rejects missing session", async () => {
    const facade = new KitchenExecutionFacade({ production: mockProduction() });
    const result = await facade.getExecutionQueue(
      identity({ session: { present: false, userId: null } }),
      getExecutionQueueQuery({ dayDate: "2026-08-05" }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("PERMISSION_DENIED");
  });

  it("GetExecutionUnits / GetBlockedExecution / query dispatch", async () => {
    const production = mockProduction({
      getProductionPlan: vi.fn(async () => ({
        ok: true,
        context: productionContext([
          batch({ status: "blocked" }),
          batch({
            id: "batch:2026-08-05:d2",
            dishId: "d2",
            status: "queued",
          }),
        ]),
        errors: [],
      })),
    });
    const facade = new KitchenExecutionFacade({ production });
    const id = identity();

    const units = await facade.getExecutionUnits(
      id,
      getExecutionUnitsQuery({ dayDate: "2026-08-05" }),
    );
    const blocked = await facade.getBlockedExecution(
      id,
      getBlockedExecutionQuery({ dayDate: "2026-08-05" }),
    );
    const viaQuery = await facade.query(
      id,
      getExecutionQueueQuery({ dayDate: "2026-08-05" }),
    );

    expect(units.units).toHaveLength(2);
    expect(blocked.units).toHaveLength(1);
    expect(blocked.units[0]?.status).toBe("BLOCKED");
    expect("context" in viaQuery && viaQuery.ok).toBe(true);
  });

  it("KitchenExecutionFacade source consumes ProductionFacade only", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const path = await import("node:path");
    const src = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "KitchenExecutionFacade.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/OrderFacade|@\/order/);
    expect(src).toMatch(/ProductionFacade/);
    expect(src).not.toMatch(/supabase|\.from\(/);
  });
});
