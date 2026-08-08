/**
 * OPERATIONAL-005 Phase 3 — Kitchen Execution Engineering Certification Matrix.
 * No UI. No Delivery. No Billing. Asserts KitchenExecutionFacade + Laws 001–006-A.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  KitchenExecutionFacade,
  resetKitchenExecutionFacade,
} from "./KitchenExecutionFacade";
import {
  assignOperatorCommand,
  blockExecutionCommand,
  completeExecutionCommand,
  markExecutionReadyCommand,
  pauseExecutionCommand,
  resumeExecutionCommand,
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
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type ValidationVerdict =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "UNIMPLEMENTED";

export type ValidationRow = {
  id: string;
  name: string;
  expected: string;
  observed: string;
  evidence: string;
  verdict: ValidationVerdict;
};

/** Filled by tests — acta / report source of truth. */
export const KITCHEN_VALIDATION_MATRIX: ValidationRow[] = [];

function record(row: ValidationRow) {
  KITCHEN_VALIDATION_MATRIX.push(row);
  expect(row.verdict).not.toBe("FAIL");
}

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

function batch(partial: Partial<ProductionBatch> = {}): ProductionBatch {
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

function productionContext(batches: ProductionBatch[]): ProductionContext {
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
        batch({
          status: "released",
          readiness: { releasedToKitchen: true, blockedReason: null },
        }),
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
          readiness: { releasedToKitchen: true, blockedReason: null },
        }),
      ]),
      load: null,
      errors: [],
    })),
    ...overrides,
  } as unknown as ProductionFacade;
}

describe("OPERATIONAL-005 Kitchen Execution Engineering Certification Matrix", () => {
  afterEach(() => {
    resetKitchenExecutionFacade();
  });

  it("V01 Execution Queue", async () => {
    const production = mockProduction();
    const facade = new KitchenExecutionFacade({ production });
    const result = await facade.getExecutionQueue(
      identity(),
      getExecutionQueueQuery({ dayDate: "2026-08-05" }),
    );
    const ok =
      result.ok &&
      result.context?.queue.dayDate === "2026-08-05" &&
      result.context.queue.units.length === 1 &&
      result.context.queue.units[0]?.id === "batch:2026-08-05:d1" &&
      (production.getProductionPlan as ReturnType<typeof vi.fn>).mock.calls
        .length === 1;
    record({
      id: "V01",
      name: "Execution Queue",
      expected: "ok · ExecutionUnits from Production plan · not Orders",
      observed: `ok=${result.ok} units=${result.context?.queue.units.length} id=${result.context?.queue.units[0]?.id}`,
      evidence: "getExecutionQueue → ProductionFacade.getProductionPlan",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V02 Execution Units", async () => {
    const production = mockProduction({
      getProductionPlan: vi.fn(async () => ({
        ok: true,
        context: productionContext([
          batch(),
          batch({
            id: "batch:2026-08-05:d2",
            dishId: "d2",
            dishName: "Soup",
            status: "in_progress",
          }),
        ]),
        errors: [],
      })),
    });
    const facade = new KitchenExecutionFacade({ production });
    const all = await facade.getExecutionUnits(
      identity(),
      getExecutionUnitsQuery({ dayDate: "2026-08-05" }),
    );
    const filtered = await facade.getExecutionUnits(
      identity(),
      getExecutionUnitsQuery({
        dayDate: "2026-08-05",
        status: "IN_PROGRESS",
      }),
    );
    const ok =
      all.ok &&
      all.units.length === 2 &&
      all.units.every((u) => u.productionBatchId) &&
      filtered.ok &&
      filtered.units.length === 1 &&
      filtered.units[0]?.status === "IN_PROGRESS";
    record({
      id: "V02",
      name: "Execution Units",
      expected: "ExecutionUnit list · filter by status · not KitchenBatch",
      observed: `all=${all.units.length} inProgress=${filtered.units.length} label=${all.units[0]?.label}`,
      evidence: "getExecutionUnits",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V03 Execution Progress", async () => {
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
    const ok =
      result.ok &&
      result.progress?.status === "IN_PROGRESS" &&
      result.progress.percent === 50;
    record({
      id: "V03",
      name: "Execution Progress",
      expected: "operational percent · never recipe steps",
      observed: `status=${result.progress?.status} percent=${result.progress?.percent}`,
      evidence: "getExecutionProgress",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V04 MarkExecutionReady", async () => {
    const production = mockProduction();
    const facade = new KitchenExecutionFacade({ production });
    const result = await facade.markExecutionReady(
      identity(),
      markExecutionReadyCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
      }),
    );
    const ok =
      result.ok &&
      result.unitId === "batch:2026-08-05:d1" &&
      result.status === "READY" &&
      (production.markBatchReady as ReturnType<typeof vi.fn>).mock.calls
        .length === 1;
    record({
      id: "V04",
      name: "MarkExecutionReady",
      expected: "ok · READY · composes ProductionFacade.markBatchReady",
      observed: `ok=${result.ok} status=${result.status}`,
      evidence: "markExecutionReady",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V05 CompleteExecution", async () => {
    const production = mockProduction();
    const facade = new KitchenExecutionFacade({ production });
    const result = await facade.completeExecution(
      identity(),
      completeExecutionCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
      }),
    );
    const ok =
      result.ok &&
      result.status === "COMPLETED" &&
      (production.closeBatch as ReturnType<typeof vi.fn>).mock.calls.length ===
        1;
    record({
      id: "V05",
      name: "CompleteExecution",
      expected: "ok · COMPLETED · composes ProductionFacade.closeBatch",
      observed: `ok=${result.ok} status=${result.status}`,
      evidence: "completeExecution",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V06 StartExecution (expected UNIMPLEMENTED)", async () => {
    const facade = new KitchenExecutionFacade({
      production: mockProduction(),
    });
    const result = await facade.startExecution(
      identity(),
      startExecutionCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
      }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V06",
      name: "StartExecution",
      expected: "UNIMPLEMENTED (mid-execution substrate gap)",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "startExecution",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V07 PauseExecution (expected UNIMPLEMENTED)", async () => {
    const facade = new KitchenExecutionFacade({
      production: mockProduction(),
    });
    const result = await facade.pauseExecution(
      identity(),
      pauseExecutionCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
      }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V07",
      name: "PauseExecution",
      expected: "UNIMPLEMENTED",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "pauseExecution",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V08 ResumeExecution (expected UNIMPLEMENTED)", async () => {
    const facade = new KitchenExecutionFacade({
      production: mockProduction(),
    });
    const result = await facade.resumeExecution(
      identity(),
      resumeExecutionCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
      }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V08",
      name: "ResumeExecution",
      expected: "UNIMPLEMENTED",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "resumeExecution",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V09 AssignOperator (expected UNIMPLEMENTED)", async () => {
    const facade = new KitchenExecutionFacade({
      production: mockProduction(),
    });
    const result = await facade.assignOperator(
      identity(),
      assignOperatorCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
        operatorId: "op1",
      }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V09",
      name: "AssignOperator",
      expected: "UNIMPLEMENTED",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "assignOperator",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V10 BlockExecution (expected UNIMPLEMENTED)", async () => {
    const facade = new KitchenExecutionFacade({
      production: mockProduction(),
    });
    const result = await facade.blockExecution(
      identity(),
      blockExecutionCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
        reason: "allergen hold",
      }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V10",
      name: "BlockExecution",
      expected: "UNIMPLEMENTED",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "blockExecution",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V11 Production integration", async () => {
    const production = mockProduction();
    const facade = new KitchenExecutionFacade({ production });
    await facade.getExecutionQueue(
      identity(),
      getExecutionQueueQuery({ dayDate: "2026-08-05" }),
    );
    await facade.markExecutionReady(
      identity(),
      markExecutionReadyCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
      }),
    );
    await facade.completeExecution(
      identity(),
      completeExecutionCommand({
        dayDate: "2026-08-05",
        unitId: "batch:2026-08-05:d1",
      }),
    );
    const planCalls = (production.getProductionPlan as ReturnType<typeof vi.fn>)
      .mock.calls.length;
    const readyCalls = (production.markBatchReady as ReturnType<typeof vi.fn>)
      .mock.calls.length;
    const closeCalls = (production.closeBatch as ReturnType<typeof vi.fn>).mock
      .calls.length;
    const ok = planCalls >= 1 && readyCalls === 1 && closeCalls === 1;
    record({
      id: "V11",
      name: "Production integration",
      expected: "Queue/Ready/Complete only via ProductionFacade",
      observed: `plan=${planCalls} ready=${readyCalls} close=${closeCalls}`,
      evidence: "injected ProductionFacade spies",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V12 Identity integration", async () => {
    const facade = new KitchenExecutionFacade({
      production: mockProduction(),
    });
    const denied = await facade.getExecutionQueue(
      identity({ session: { present: false, userId: null } }),
      getExecutionQueueQuery({ dayDate: "2026-08-05" }),
    );
    const mismatch = await facade.getExecutionQueue(
      identity({ tenant: null }),
      getExecutionQueueQuery({ dayDate: "2026-08-05" }),
    );
    const ok =
      !denied.ok &&
      denied.errors[0]?.code === "PERMISSION_DENIED" &&
      !mismatch.ok &&
      mismatch.errors[0]?.code === "TENANT_MISMATCH";
    record({
      id: "V12",
      name: "Identity integration",
      expected: "AUTH / TENANT errors via Facade",
      observed: `denied=${denied.errors[0]?.code} mismatch=${mismatch.errors[0]?.code}`,
      evidence: "requireSession",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V13 Permission model", async () => {
    const facade = new KitchenExecutionFacade({
      production: mockProduction(),
    });
    const operator = identity({
      permissions: {
        roles: ["kitchen"],
        capabilities: ["kitchen.operate"],
      },
    });
    const reader = identity({
      permissions: {
        roles: ["support"],
        capabilities: ["orders.read"],
      },
    });
    const withOperate = await facade.getExecutionQueue(
      operator,
      getExecutionQueueQuery({ dayDate: "2026-08-05" }),
    );
    const withoutOperate = await facade.getExecutionQueue(
      reader,
      getExecutionQueueQuery({ dayDate: "2026-08-05" }),
    );
    const ok =
      withOperate.ok &&
      withOperate.context?.permissions.canReadQueue === true &&
      withOperate.context.permissions.canOperate === true &&
      withOperate.context.permissions.canAssign === true &&
      withoutOperate.ok &&
      withoutOperate.context?.permissions.canReadQueue === false &&
      withoutOperate.context.permissions.canOperate === false &&
      withoutOperate.context.permissions.canAssign === false;
    record({
      id: "V13",
      name: "Permission model",
      expected:
        "kitchen.operate → all bits; without kitchen.operate → none (canonical)",
      observed: `operateBits=${JSON.stringify(withOperate.context?.permissions)} supportBits=${JSON.stringify(withoutOperate.context?.permissions)}`,
      evidence: "kitchenCapabilityBitsFromIdentity",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V14 Repository delegation (ProductionFacade only)", async () => {
    const production = mockProduction();
    const facade = new KitchenExecutionFacade({ production });
    await facade.getExecutionQueue(
      identity(),
      getExecutionQueueQuery({ dayDate: "2026-08-05" }),
    );
    await facade.getBlockedExecution(
      identity(),
      getBlockedExecutionQuery({ dayDate: "2026-08-05" }),
    );
    await facade.getCompletedExecution(
      identity(),
      getCompletedExecutionQuery({ dayDate: "2026-08-05" }),
    );
    const src = readFileSync(
      resolve(process.cwd(), "src/kitchen/KitchenExecutionFacade.ts"),
      "utf8",
    );
    const ok =
      (production.getProductionPlan as ReturnType<typeof vi.fn>).mock.calls
        .length >= 3 &&
      !src.includes("@/order") &&
      !src.includes("OrderFacade") &&
      !src.includes("supabase") &&
      !src.includes(".from(") &&
      src.includes("ProductionFacade");
    record({
      id: "V14",
      name: "Repository delegation",
      expected: "ProductionFacade only · no Order · no storage",
      observed: `planCalls=${(production.getProductionPlan as ReturnType<typeof vi.fn>).mock.calls.length} noOrder=${!src.includes("OrderFacade")} noStorage=${!src.includes("supabase")}`,
      evidence: "KitchenExecutionFacade.ts + spies",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V15 Foundation Laws 001–006-A", async () => {
    const indexSrc = readFileSync(
      resolve(process.cwd(), "src/kitchen/index.ts"),
      "utf8",
    );
    const facadeSrc = readFileSync(
      resolve(process.cwd(), "src/kitchen/KitchenExecutionFacade.ts"),
      "utf8",
    );
    const lockSrc = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/FOUNDATION_LOCK.md"),
      "utf8",
    );
    const ok =
      indexSrc.includes("LAW 001") &&
      indexSrc.includes("ExecutionUnit") &&
      facadeSrc.includes("ProductionFacade") &&
      facadeSrc.includes("LAW 006") &&
      !facadeSrc.includes("GenerateProductionPlan") &&
      lockSrc.includes("FOUNDATION LAW 006") &&
      (lockSrc.includes("006-A") || lockSrc.includes("LAW 006-A"));
    record({
      id: "V15",
      name: "Foundation Laws 001–006-A",
      expected: "Facade-only · ExecutionUnit · one question · 006-A",
      observed: `indexLaws=${indexSrc.includes("LAW")} lock006=${lockSrc.includes("FOUNDATION LAW 006")} lock006A=${lockSrc.includes("006-A")}`,
      evidence: "index · facade · FOUNDATION_LOCK",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V16 Capability dependency integrity", async () => {
    const registry = readFileSync(
      resolve(process.cwd(), "docs/00-status/CAPABILITY_REGISTRY.md"),
      "utf8",
    );
    const capability = readFileSync(
      resolve(
        process.cwd(),
        "docs/05-architecture/KITCHEN_EXECUTION_CAPABILITY.md",
      ),
      "utf8",
    );
    const canonicalBlock = capability.slice(
      capability.indexOf("Canonical question"),
      capability.indexOf("Canonical question") + 400,
    );
    const ok =
      registry.includes("Kitchen Execution") &&
      registry.includes("ProductionFacade") &&
      capability.includes("ProductionFacade only") &&
      capability.includes("¿Qué trabajo debe ejecutarse ahora?") &&
      canonicalBlock.includes("¿Qué trabajo debe ejecutarse ahora?") &&
      !canonicalBlock.includes("¿Qué trabajo debemos generar?");
    record({
      id: "V16",
      name: "Capability dependency integrity",
      expected: "Consumes Production · provides Delivery · one question",
      observed: `registry=${registry.includes("Kitchen Execution")} productionOnly=${capability.includes("ProductionFacade only")} canonicalKitchen=${canonicalBlock.includes("ejecutarse ahora")}`,
      evidence: "CAPABILITY_REGISTRY · KITCHEN_EXECUTION_CAPABILITY",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V17 GetOperatorAssignments (expected UNIMPLEMENTED)", async () => {
    const facade = new KitchenExecutionFacade({
      production: mockProduction(),
    });
    const result = await facade.getOperatorAssignments(
      identity(),
      getOperatorAssignmentsQuery({ dayDate: "2026-08-05" }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V17",
      name: "GetOperatorAssignments",
      expected: "UNIMPLEMENTED",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "getOperatorAssignments",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V18 LAW 006-A — Kitchen never answers Production question", async () => {
    const facadeSrc = readFileSync(
      resolve(process.cwd(), "src/kitchen/KitchenExecutionFacade.ts"),
      "utf8",
    );
    const commandsSrc = readFileSync(
      resolve(process.cwd(), "src/kitchen/KitchenCommands.ts"),
      "utf8",
    );
    const ok =
      !facadeSrc.includes("GenerateProductionPlan") &&
      !facadeSrc.includes("RecalculateLoad") &&
      !commandsSrc.includes("GenerateProduction") &&
      !commandsSrc.includes("CreateOrder") &&
      facadeSrc.includes("¿Qué trabajo debe ejecutarse ahora?");
    record({
      id: "V18",
      name: "LAW 006-A question boundary",
      expected: "Kitchen never answers Production / Order questions",
      observed: `noPlan=${!facadeSrc.includes("GenerateProductionPlan")} hasKitchenQ=${facadeSrc.includes("ejecutarse ahora")}`,
      evidence: "KitchenExecutionFacade · KitchenCommands",
      verdict: ok ? "PASS" : "FAIL",
    });
  });
});
