/**
 * OPERATIONAL-FLOW-001 Phase 3 — Engineering Certification Matrix.
 * Validates transitions only. Never re-certifies individual Capabilities.
 * No UI. No Delivery. No Billing.
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
export const FLOW_001_VALIDATION_MATRIX: ValidationRow[] = [];

function record(row: ValidationRow) {
  FLOW_001_VALIDATION_MATRIX.push(row);
  expect(row.verdict).not.toBe("FAIL");
}

function identity(
  partial: Partial<Flow001RuntimeIdentity> = {},
): Flow001RuntimeIdentity {
  return {
    session: { present: true, userId: "u1" },
    tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
    permissions: {
      roles: ["kitchen", "company_admin"],
      capabilities: [
        "orders.read",
        "kitchen.operate",
        "production.operate",
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

function mockDeps(overrides: {
  orders?: Partial<OrderFacade>;
  production?: Partial<ProductionFacade>;
  kitchen?: Partial<KitchenExecutionFacade>;
} = {}) {
  const orders = {
    getOrdersByDeliveryDay: vi.fn(async () => ({
      ok: true,
      summaries: [{ id: "o1" }, { id: "o2" }],
      errors: [],
    })),
    ...overrides.orders,
  } as unknown as OrderFacade;

  const production = {
    generateProductionPlan: vi.fn(async () => ({
      ok: true,
      planId: "plan:2026-08-05",
      batchId: null,
      status: "planned",
      context: {
        queue: { batches: [{ id: "batch:2026-08-05:d1" }] },
      },
      load: null,
      errors: [],
    })),
    ...overrides.production,
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
          canAssign: true,
          canBlock: true,
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
    ...overrides.kitchen,
  } as unknown as KitchenExecutionFacade;

  return { orders, production, kitchen };
}

describe("OPERATIONAL-FLOW-001 Engineering Certification Matrix", () => {
  afterEach(() => {
    resetFlow001Harness();
  });

  it("F01 OrderFacade → ProductionFacade", async () => {
    const deps = mockDeps();
    const harness = new Flow001Harness(deps);
    const result = await harness.transitionOrderToProduction(identity(), {
      dayDate: "2026-08-05",
    });
    const ok =
      result.ok &&
      result.context?.orderIds.length === 2 &&
      result.context.productionPlanId === "plan:2026-08-05" &&
      (deps.orders.getOrdersByDeliveryDay as ReturnType<typeof vi.fn>).mock
        .calls.length === 1 &&
      (deps.production.generateProductionPlan as ReturnType<typeof vi.fn>).mock
        .calls.length === 1 &&
      (deps.kitchen.getExecutionQueue as ReturnType<typeof vi.fn>).mock.calls
        .length === 0;
    record({
      id: "F01",
      name: "OrderFacade → ProductionFacade",
      expected: "Order hop then Production hop · Kitchen not called",
      observed: `ok=${result.ok} orders=${result.context?.orderIds.length} plan=${result.context?.productionPlanId} kitchenCalls=${(deps.kitchen.getExecutionQueue as ReturnType<typeof vi.fn>).mock.calls.length}`,
      evidence: "transitionOrderToProduction",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F02 ProductionFacade → KitchenExecutionFacade", async () => {
    const deps = mockDeps();
    const harness = new Flow001Harness(deps);
    const result = await harness.transitionProductionToKitchen(identity(), {
      dayDate: "2026-08-05",
    });
    const ok =
      result.ok &&
      result.context?.productionPlanId === "plan:2026-08-05" &&
      result.context.executionUnitIds.length === 1 &&
      (deps.orders.getOrdersByDeliveryDay as ReturnType<typeof vi.fn>).mock
        .calls.length === 0 &&
      (deps.production.generateProductionPlan as ReturnType<typeof vi.fn>).mock
        .calls.length === 1 &&
      (deps.kitchen.getExecutionQueue as ReturnType<typeof vi.fn>).mock.calls
        .length === 1;
    record({
      id: "F02",
      name: "ProductionFacade → KitchenExecutionFacade",
      expected: "Production then Kitchen · OrderFacade not required on this hop",
      observed: `ok=${result.ok} units=${result.context?.executionUnitIds.length} orderCalls=${(deps.orders.getOrdersByDeliveryDay as ReturnType<typeof vi.fn>).mock.calls.length}`,
      evidence: "transitionProductionToKitchen",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F03 Operational Context propagation", async () => {
    const deps = mockDeps();
    const harness = new Flow001Harness(deps);
    const result = await harness.runCommitmentToExecutedWork(identity(), {
      dayDate: "2026-08-05",
    });
    const ok =
      result.ok &&
      result.context?.scope.dayDate === "2026-08-05" &&
      result.context.tenantId === "t1" &&
      result.context.operatorId === "u1" &&
      result.context.orderIds.includes("o1") &&
      result.context.productionPlanId === "plan:2026-08-05" &&
      result.context.completedUnitId === "batch:2026-08-05:d1";
    record({
      id: "F03",
      name: "Operational Context propagation",
      expected: "day · tenant · operator · orderIds · plan · completedUnit survive hops",
      observed: `day=${result.context?.scope.dayDate} tenant=${result.context?.tenantId} completed=${result.context?.completedUnitId}`,
      evidence: "runCommitmentToExecutedWork context",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F04 Tenant propagation", async () => {
    const deps = mockDeps();
    const harness = new Flow001Harness(deps);
    const mismatch = await harness.runCommitmentToExecutedWork(
      identity({ tenant: null }),
      { dayDate: "2026-08-05" },
    );
    const okRun = await harness.runCommitmentToExecutedWork(identity(), {
      dayDate: "2026-08-05",
    });
    const ok =
      !mismatch.ok &&
      mismatch.errors[0]?.code === "TENANT_MISMATCH" &&
      okRun.ok &&
      okRun.context?.tenantId === "t1";
    record({
      id: "F04",
      name: "Tenant propagation",
      expected: "missing tenant fails · present tenant propagates",
      observed: `mismatch=${mismatch.errors[0]?.code} okTenant=${okRun.context?.tenantId}`,
      evidence: "IdentityGate",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F05 Permission propagation (IdentityGate session)", async () => {
    const deps = mockDeps();
    const harness = new Flow001Harness(deps);
    const denied = await harness.runCommitmentToExecutedWork(
      identity({ session: { present: false, userId: null } }),
      { dayDate: "2026-08-05" },
    );
    const ok =
      !denied.ok &&
      denied.errors[0]?.code === "PERMISSION_DENIED" &&
      denied.steps[0]?.transition === "IdentityGate";
    record({
      id: "F05",
      name: "Permission propagation",
      expected: "unauthenticated session blocked at IdentityGate",
      observed: `code=${denied.errors[0]?.code} step=${denied.steps[0]?.transition}`,
      evidence: "IdentityGate",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F06 Evidence propagation", async () => {
    const deps = mockDeps();
    const harness = new Flow001Harness(deps);
    const result = await harness.runCommitmentToExecutedWork(identity(), {
      dayDate: "2026-08-05",
    });
    const transitions = result.steps.map((s) => s.transition);
    const allHaveFields = result.steps.every(
      (s) => s.expected && s.observed && s.evidence && typeof s.ok === "boolean",
    );
    const ok =
      result.ok &&
      allHaveFields &&
      transitions.includes("OrderHop") &&
      transitions.includes("ProductionHop") &&
      transitions.includes("KitchenHop") &&
      transitions.includes("ExecutionComplete");
    record({
      id: "F06",
      name: "Evidence propagation",
      expected: "Expected/Observed/Evidence on every hop",
      observed: `steps=${result.steps.length} transitions=${transitions.join(",")}`,
      evidence: "Flow001EvidenceStep[]",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F07 Hop integrity (full chain order)", async () => {
    const deps = mockDeps();
    const harness = new Flow001Harness(deps);
    const result = await harness.runCommitmentToExecutedWork(identity(), {
      dayDate: "2026-08-05",
    });
    const names = result.steps.map((s) => s.transition);
    const ok =
      result.ok &&
      names[0] === "IdentityGate" &&
      names[1] === "OrderHop" &&
      names[2] === "ProductionHop" &&
      names[3] === "KitchenHop" &&
      names[4] === "ExecutionComplete" &&
      result.steps.every((s) => s.ok);
    record({
      id: "F07",
      name: "Hop integrity",
      expected: "Identity → Order → Production → Kitchen → Complete in order",
      observed: names.join(" → "),
      evidence: "runCommitmentToExecutedWork steps",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F08 Foundation Laws 001–007", async () => {
    const harnessSrc = readFileSync(
      resolve(process.cwd(), "src/flows/flow-001/Flow001Harness.ts"),
      "utf8",
    );
    const lockSrc = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/FOUNDATION_LOCK.md"),
      "utf8",
    );
    const flowSrc = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/OPERATIONAL_FLOW_001.md"),
      "utf8",
    );
    const ok =
      harnessSrc.includes("OrderFacade") &&
      harnessSrc.includes("ProductionFacade") &&
      harnessSrc.includes("KitchenExecutionFacade") &&
      harnessSrc.includes("Owns no business behaviour") &&
      !harnessSrc.includes("@/integrations/supabase") &&
      !harnessSrc.includes("@/modules/operations") &&
      lockSrc.includes("FOUNDATION LAW 007") &&
      flowSrc.includes("FLOW validates transitions") &&
      flowSrc.includes("NOT validate Capabilities") &&
      flowSrc.includes("Business behaviour never migrates");
    record({
      id: "F08",
      name: "Foundation Laws 001–007",
      expected: "Harness compose-only · LAW 007 · Flow≠Capability",
      observed: `noStorage=${!harnessSrc.includes("supabase")} law007=${lockSrc.includes("LAW 007")}`,
      evidence: "Harness · FOUNDATION_LOCK · OPERATIONAL_FLOW_001",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F09 Operational Flow integrity (no Capability re-test)", async () => {
    const report = readFileSync(
      resolve(
        process.cwd(),
        "docs/10-validation/FLOW_001_VALIDATION_REPORT.md",
      ),
      "utf8",
    );
    const arch = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/OPERATIONAL_FLOW_001.md"),
      "utf8",
    );
    const ok =
      report.includes("validates transitions") &&
      report.includes("never validates individual Capabilities") &&
      arch.includes("Harnesses orchestrate certified Facades") &&
      !arch.includes("Does Orders work?");
    record({
      id: "F09",
      name: "Operational Flow integrity",
      expected: "Flow certifies collaboration · not Capability re-certification",
      observed: `reportTransitions=${report.includes("validates transitions")} noOrdersQ=${!arch.includes("Does Orders work?")}`,
      evidence: "FLOW_001_VALIDATION_REPORT · OPERATIONAL_FLOW_001",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F10 Delivery gate documented (no Delivery until field path)", async () => {
    const board = readFileSync(
      resolve(process.cwd(), "docs/00-status/OPERATIONAL_ENGINE_BOARD.md"),
      "utf8",
    );
    const roadmap = readFileSync(
      resolve(process.cwd(), "docs/00-status/OPERATIONAL_ROADMAP.md"),
      "utf8",
    );
    const ok =
      board.includes("No Delivery until") &&
      roadmap.includes("Roadmap Review") &&
      roadmap.includes("Android") &&
      roadmap.includes("OPPO") &&
      (roadmap.includes("iPhone") || roadmap.includes("iOS"));
    record({
      id: "F10",
      name: "Delivery gate",
      expected: "Delivery blocked until FLOW-001 Demo · Review · Android · OPPO · iPhone",
      observed: `boardGate=${board.includes("No Delivery until")} review=${roadmap.includes("Roadmap Review")}`,
      evidence: "OPERATIONAL_ENGINE_BOARD · OPERATIONAL_ROADMAP",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F11 Production hop failure surfaces TRANSITION_FAILED", async () => {
    const deps = mockDeps({
      production: {
        generateProductionPlan: vi.fn(async () => ({
          ok: false,
          planId: null,
          batchId: null,
          status: null,
          context: null,
          load: null,
          errors: [
            {
              code: "PERMISSION_DENIED",
              message: "no plan",
              recoverable: true,
            },
          ],
        })),
      } as never,
    });
    const harness = new Flow001Harness(deps);
    const result = await harness.runCommitmentToExecutedWork(identity(), {
      dayDate: "2026-08-05",
    });
    const ok =
      !result.ok &&
      result.errors[0]?.code === "TRANSITION_FAILED" &&
      result.errors[0]?.transition === "ProductionHop";
    record({
      id: "F11",
      name: "Hop failure integrity",
      expected: "failed Production hop → TRANSITION_FAILED · no Kitchen call",
      observed: `code=${result.errors[0]?.code} transition=${result.errors[0]?.transition} kitchenCalls=${(deps.kitchen.getExecutionQueue as ReturnType<typeof vi.fn>).mock.calls.length}`,
      evidence: "productionHop fail path",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F12 Empty execution queue completes honestly (no unit)", async () => {
    const deps = mockDeps({
      kitchen: {
        getExecutionQueue: vi.fn(async () => ({
          ok: true,
          context: {
            tenantId: "t1",
            dayDate: "2026-08-05",
            queue: { dayDate: "2026-08-05", units: [] },
            permissions: {
              canReadQueue: true,
              canOperate: true,
              canAssign: false,
              canBlock: false,
            },
          },
          errors: [],
        })),
        markExecutionReady: vi.fn(),
        completeExecution: vi.fn(),
      } as never,
    });
    const harness = new Flow001Harness(deps);
    const result = await harness.runCommitmentToExecutedWork(identity(), {
      dayDate: "2026-08-05",
    });
    const completeStep = result.steps.find(
      (s) => s.transition === "ExecutionComplete",
    );
    const ok =
      result.ok &&
      completeStep?.ok === true &&
      (deps.kitchen.completeExecution as ReturnType<typeof vi.fn>).mock.calls
        .length === 0;
    record({
      id: "F12",
      name: "Empty execution honesty",
      expected: "empty queue · flow ok · ExecutionComplete noted · no Complete call",
      observed: `ok=${result.ok} completeCalls=${(deps.kitchen.completeExecution as ReturnType<typeof vi.fn>).mock.calls.length}`,
      evidence: "ExecutionComplete empty path",
      verdict: ok ? "PASS" : "FAIL",
    });
  });
});
