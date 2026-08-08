/**
 * OPERATIONAL-FLOW-002 Phase 3 — Engineering Certification Matrix.
 * Validates transitions only. Never re-certifies individual Capabilities.
 * No UI. No Billing. No FLOW-003.
 * Behaviour: BH-001 Fulfill Weekly Commitment.
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
export const FLOW_002_VALIDATION_MATRIX: ValidationRow[] = [];

function record(row: ValidationRow) {
  FLOW_002_VALIDATION_MATRIX.push(row);
  expect(row.verdict).not.toBe("FAIL");
}

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

function mockDeps(overrides: {
  orders?: Partial<OrderFacade>;
  production?: Partial<ProductionFacade>;
  kitchen?: Partial<KitchenExecutionFacade>;
  delivery?: Partial<DeliveryFacade>;
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
      planId: "plan:2026-08-06",
      batchId: null,
      status: "planned",
      context: {
        queue: { batches: [{ id: "batch:2026-08-06:d1" }] },
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
          canAssign: true,
          canBlock: true,
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
    ...overrides.kitchen,
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
    ...overrides.delivery,
  } as unknown as DeliveryFacade;

  return { orders, production, kitchen, delivery };
}

describe("OPERATIONAL-FLOW-002 Engineering Certification Matrix", () => {
  afterEach(() => {
    resetFlow002Harness();
  });

  it("F01 KitchenExecutionFacade → DeliveryFacade", async () => {
    const deps = mockDeps();
    const harness = new Flow002Harness(deps);
    const result = await harness.transitionKitchenToDelivery(identity(), {
      dayDate: "2026-08-06",
    });
    const ok =
      result.ok &&
      result.context?.executionUnitIds.length === 1 &&
      result.context.assignmentIds[0] === "assignment:o1" &&
      (deps.kitchen.getExecutionQueue as ReturnType<typeof vi.fn>).mock.calls
        .length === 1 &&
      (deps.delivery.getDeliveryContext as ReturnType<typeof vi.fn>).mock.calls
        .length === 1 &&
      (deps.delivery.confirmDelivery as ReturnType<typeof vi.fn>).mock.calls
        .length === 0 &&
      (deps.orders.getOrdersByDeliveryDay as ReturnType<typeof vi.fn>).mock
        .calls.length === 0;
    record({
      id: "F01",
      name: "KitchenExecutionFacade → DeliveryFacade",
      expected: "Kitchen then Delivery · Confirm not called · Order not required",
      observed: `ok=${result.ok} assignments=${result.context?.assignmentIds.length} confirmCalls=${(deps.delivery.confirmDelivery as ReturnType<typeof vi.fn>).mock.calls.length}`,
      evidence: "transitionKitchenToDelivery",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F02 DeliveryFacade → Confirmation", async () => {
    const deps = mockDeps();
    const harness = new Flow002Harness(deps);
    const result = await harness.transitionDeliveryToConfirmation(identity(), {
      dayDate: "2026-08-06",
    });
    const ok =
      result.ok &&
      result.context?.confirmationId === "confirmation:o1" &&
      (deps.delivery.getDeliveryContext as ReturnType<typeof vi.fn>).mock.calls
        .length === 1 &&
      (deps.delivery.confirmDelivery as ReturnType<typeof vi.fn>).mock.calls
        .length === 1 &&
      (deps.kitchen.getExecutionQueue as ReturnType<typeof vi.fn>).mock.calls
        .length === 0;
    record({
      id: "F02",
      name: "DeliveryFacade → Confirmation",
      expected: "Delivery hop then ConfirmDelivery · Kitchen not required",
      observed: `ok=${result.ok} confirmation=${result.context?.confirmationId}`,
      evidence: "transitionDeliveryToConfirmation",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F03 Hop integrity (full fulfillment chain)", async () => {
    const deps = mockDeps();
    const harness = new Flow002Harness(deps);
    const result = await harness.runCommitmentToConfirmedDelivery(identity(), {
      dayDate: "2026-08-06",
    });
    const names = result.steps.map((s) => s.transition);
    const ok =
      result.ok &&
      names[0] === "IdentityGate" &&
      names[1] === "OrderHop" &&
      names[2] === "ProductionHop" &&
      names[3] === "KitchenHop" &&
      names[4] === "ExecutionComplete" &&
      names[5] === "DeliveryHop" &&
      names[6] === "ConfirmationHop" &&
      result.steps.every((s) => s.ok) &&
      result.context?.confirmationId === "confirmation:o1";
    record({
      id: "F03",
      name: "Hop integrity",
      expected:
        "Identity → Order → Production → Kitchen → Complete → Delivery → Confirmation",
      observed: names.join(" → "),
      evidence: "runCommitmentToConfirmedDelivery steps",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F04 Operational Context propagation", async () => {
    const deps = mockDeps();
    const harness = new Flow002Harness(deps);
    const result = await harness.runCommitmentToConfirmedDelivery(identity(), {
      dayDate: "2026-08-06",
    });
    const ok =
      result.ok &&
      result.context?.scope.dayDate === "2026-08-06" &&
      result.context.tenantId === "t1" &&
      result.context.operatorId === "u1" &&
      result.context.orderIds.includes("o1") &&
      result.context.productionPlanId === "plan:2026-08-06" &&
      result.context.completedUnitId === "batch:2026-08-06:d1" &&
      result.context.assignmentIds.includes("assignment:o1") &&
      result.context.confirmationId === "confirmation:o1";
    record({
      id: "F04",
      name: "Operational Context propagation",
      expected:
        "day · tenant · operator · orders · plan · unit · assignment · confirmation survive",
      observed: `day=${result.context?.scope.dayDate} confirmation=${result.context?.confirmationId}`,
      evidence: "runCommitmentToConfirmedDelivery context",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F05 Tenant propagation", async () => {
    const deps = mockDeps();
    const harness = new Flow002Harness(deps);
    const mismatch = await harness.runCommitmentToConfirmedDelivery(
      identity({ tenant: null }),
      { dayDate: "2026-08-06" },
    );
    const okRun = await harness.runCommitmentToConfirmedDelivery(identity(), {
      dayDate: "2026-08-06",
    });
    const ok =
      !mismatch.ok &&
      mismatch.errors[0]?.code === "TENANT_MISMATCH" &&
      okRun.ok &&
      okRun.context?.tenantId === "t1";
    record({
      id: "F05",
      name: "Tenant propagation",
      expected: "missing tenant fails · present tenant propagates",
      observed: `mismatch=${mismatch.errors[0]?.code} okTenant=${okRun.context?.tenantId}`,
      evidence: "IdentityGate",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F06 Permission propagation (IdentityGate session)", async () => {
    const deps = mockDeps();
    const harness = new Flow002Harness(deps);
    const denied = await harness.runCommitmentToConfirmedDelivery(
      identity({ session: { present: false, userId: null } }),
      { dayDate: "2026-08-06" },
    );
    const ok =
      !denied.ok &&
      denied.errors[0]?.code === "PERMISSION_DENIED" &&
      denied.steps[0]?.transition === "IdentityGate";
    record({
      id: "F06",
      name: "Permission propagation",
      expected: "unauthenticated session blocked at IdentityGate",
      observed: `code=${denied.errors[0]?.code} step=${denied.steps[0]?.transition}`,
      evidence: "IdentityGate",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F07 Evidence propagation", async () => {
    const deps = mockDeps();
    const harness = new Flow002Harness(deps);
    const result = await harness.runCommitmentToConfirmedDelivery(identity(), {
      dayDate: "2026-08-06",
    });
    const transitions = result.steps.map((s) => s.transition);
    const allHaveFields = result.steps.every(
      (s) => s.expected && s.observed && s.evidence && typeof s.ok === "boolean",
    );
    const ok =
      result.ok &&
      allHaveFields &&
      transitions.includes("DeliveryHop") &&
      transitions.includes("ConfirmationHop");
    record({
      id: "F07",
      name: "Evidence propagation",
      expected: "Expected/Observed/Evidence on every hop",
      observed: `steps=${result.steps.length} transitions=${transitions.join(",")}`,
      evidence: "Flow002EvidenceStep[]",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F08 Foundation Laws 001–007", async () => {
    const harnessSrc = readFileSync(
      resolve(process.cwd(), "src/flows/flow-002/Flow002Harness.ts"),
      "utf8",
    );
    const lockSrc = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/FOUNDATION_LOCK.md"),
      "utf8",
    );
    const flowSrc = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/OPERATIONAL_FLOW_002.md"),
      "utf8",
    );
    const ok =
      harnessSrc.includes("OrderFacade") &&
      harnessSrc.includes("ProductionFacade") &&
      harnessSrc.includes("KitchenExecutionFacade") &&
      harnessSrc.includes("DeliveryFacade") &&
      harnessSrc.includes("Owns no business behaviour") &&
      !harnessSrc.includes("BillingFacade") &&
      !harnessSrc.includes("calculateInvoice") &&
      !harnessSrc.includes("@/integrations/supabase") &&
      !harnessSrc.includes("@/modules/operations") &&
      lockSrc.includes("FOUNDATION LAW 007") &&
      flowSrc.includes("FLOW validates transitions") &&
      flowSrc.includes("Business behaviour never migrates");
    record({
      id: "F08",
      name: "Foundation Laws 001–007",
      expected: "Harness compose-only · LAW 007 · no Billing · Flow≠Capability",
      observed: `noBilling=${!harnessSrc.includes("BillingFacade")} law007=${lockSrc.includes("LAW 007")}`,
      evidence: "Harness · FOUNDATION_LOCK · OPERATIONAL_FLOW_002",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F09 Operational Flow integrity (no Capability re-test)", async () => {
    const report = readFileSync(
      resolve(
        process.cwd(),
        "docs/10-validation/FLOW_002_VALIDATION_REPORT.md",
      ),
      "utf8",
    );
    const arch = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/OPERATIONAL_FLOW_002.md"),
      "utf8",
    );
    const ok =
      report.includes("validates transitions") &&
      report.includes("never validates individual Capabilities") &&
      arch.includes("Harnesses orchestrate certified Facades") &&
      !arch.includes("Does Delivery work?");
    record({
      id: "F09",
      name: "Operational Flow integrity",
      expected: "Flow certifies collaboration · not Capability re-certification",
      observed: `reportTransitions=${report.includes("validates transitions")}`,
      evidence: "FLOW_002_VALIDATION_REPORT · OPERATIONAL_FLOW_002",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F10 No Billing boundary", async () => {
    const harnessSrc = readFileSync(
      resolve(process.cwd(), "src/flows/flow-002/Flow002Harness.ts"),
      "utf8",
    );
    const arch = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/OPERATIONAL_FLOW_002.md"),
      "utf8",
    );
    const board = readFileSync(
      resolve(process.cwd(), "docs/00-status/OPERATIONAL_ENGINE_BOARD.md"),
      "utf8",
    );
    const ok =
      !harnessSrc.includes("BillingFacade") &&
      !harnessSrc.includes("calculateInvoice") &&
      !harnessSrc.includes("@/billing") &&
      arch.includes("Delivery Confirmation") &&
      (arch.includes("not Invoice") ||
        arch.includes("Never Billing") ||
        arch.includes("never Billing")) &&
      board.includes("FLOW-003");
    record({
      id: "F10",
      name: "No Billing boundary",
      expected: "FLOW-002 ends at Confirmation · Billing/FLOW-003 gated",
      observed: `noBillingFacade=${!harnessSrc.includes("BillingFacade")} boardFlow003=${board.includes("FLOW-003")}`,
      evidence: "Harness · OPERATIONAL_FLOW_002 · Board",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F11 Confirmation hop failure surfaces TRANSITION_FAILED", async () => {
    const deps = mockDeps({
      delivery: {
        confirmDelivery: vi.fn(async () => ({
          ok: false,
          assignmentId: "assignment:o1",
          status: null,
          confirmation: null,
          context: null,
          errors: [
            {
              code: "INVALID_STATE",
              message: "not ready",
              recoverable: true,
            },
          ],
        })),
      } as never,
    });
    const harness = new Flow002Harness(deps);
    const result = await harness.runCommitmentToConfirmedDelivery(identity(), {
      dayDate: "2026-08-06",
    });
    const ok =
      !result.ok &&
      result.errors[0]?.code === "TRANSITION_FAILED" &&
      result.errors[0]?.transition === "ConfirmationHop";
    record({
      id: "F11",
      name: "Hop failure integrity",
      expected: "failed Confirmation hop → TRANSITION_FAILED · which hop named",
      observed: `code=${result.errors[0]?.code} transition=${result.errors[0]?.transition}`,
      evidence: "confirmationHop fail path",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F12 Empty assignment honesty (no Confirm call)", async () => {
    const deps = mockDeps({
      delivery: {
        getDeliveryContext: vi.fn(async () => ({
          ok: true,
          context: {
            tenantId: "t1",
            operationalDay: "2026-08-06",
            assignments: [],
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
        confirmDelivery: vi.fn(),
      } as never,
    });
    const harness = new Flow002Harness(deps);
    const result = await harness.runCommitmentToConfirmedDelivery(identity(), {
      dayDate: "2026-08-06",
    });
    const confirmStep = result.steps.find(
      (s) => s.transition === "ConfirmationHop",
    );
    const ok =
      result.ok &&
      confirmStep?.ok === true &&
      (deps.delivery.confirmDelivery as ReturnType<typeof vi.fn>).mock.calls
        .length === 0;
    record({
      id: "F12",
      name: "Empty assignment honesty",
      expected: "empty assignments · flow ok · Confirmation noted · no Confirm call",
      observed: `ok=${result.ok} confirmCalls=${(deps.delivery.confirmDelivery as ReturnType<typeof vi.fn>).mock.calls.length}`,
      evidence: "ConfirmationHop empty path",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F13 Behaviour BH-001 documented", async () => {
    const behaviours = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/OPERATIONAL_BEHAVIOURS.md"),
      "utf8",
    );
    const board = readFileSync(
      resolve(process.cwd(), "docs/00-status/OPERATIONAL_BEHAVIOUR_BOARD.md"),
      "utf8",
    );
    const ok =
      behaviours.includes("Fulfill Weekly Commitment") &&
      behaviours.includes("Operational Commitment Fulfilled") &&
      behaviours.includes("Delivery Confirmation") &&
      board.includes("BH-001") &&
      board.includes("Fulfill Weekly Commitment");
    record({
      id: "F13",
      name: "Behaviour BH-001",
      expected: "BH-001 named · completion Confirmation · outcome Fulfilled",
      observed: `bh001=${behaviours.includes("Fulfill Weekly Commitment")} board=${board.includes("BH-001")}`,
      evidence: "OPERATIONAL_BEHAVIOURS · OPERATIONAL_BEHAVIOUR_BOARD",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F14 ConfirmDelivery UNIMPLEMENTED surfaces as TRANSITION_FAILED (expected gap honesty)", async () => {
    const deps = mockDeps({
      delivery: {
        confirmDelivery: vi.fn(async () => ({
          ok: false,
          assignmentId: "assignment:o1",
          status: null,
          confirmation: null,
          context: null,
          errors: [
            {
              code: "UNIMPLEMENTED",
              message: "ConfirmDelivery gap",
              recoverable: true,
            },
          ],
        })),
      } as never,
    });
    const harness = new Flow002Harness(deps);
    const result = await harness.runCommitmentToConfirmedDelivery(identity(), {
      dayDate: "2026-08-06",
    });
    // Flow does not invent business why — it names the failed transition.
    const ok =
      !result.ok &&
      result.errors[0]?.code === "TRANSITION_FAILED" &&
      result.errors[0]?.transition === "ConfirmationHop" &&
      result.steps.some(
        (s) => s.transition === "ConfirmationHop" && s.ok === false,
      );
    record({
      id: "F14",
      name: "Capability UNIMPLEMENTED honesty",
      expected:
        "UNIMPLEMENTED from DeliveryFacade → TRANSITION_FAILED at ConfirmationHop (EXPECTED GAP surface)",
      observed: `code=${result.errors[0]?.code} transition=${result.errors[0]?.transition}`,
      evidence: "confirmationHop UNIMPLEMENTED path",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("F15 Scenario reserved · FLOW-003 gated", async () => {
    const scenarios = readFileSync(
      resolve(process.cwd(), "docs/00-status/OPERATIONAL_SCENARIO_REGISTRY.md"),
      "utf8",
    );
    const registry = readFileSync(
      resolve(process.cwd(), "docs/00-status/OPERATIONAL_FLOW_REGISTRY.md"),
      "utf8",
    );
    const ok =
      scenarios.includes("RESERVED") &&
      scenarios.includes("Weekly Catering Cycle") &&
      registry.includes("FLOW-003") &&
      registry.includes("Pending");
    record({
      id: "F15",
      name: "Scenario reserved · FLOW-003 gated",
      expected: "Scenarios reserved · FLOW-003 Pending · no Billing open",
      observed: `reserved=${scenarios.includes("RESERVED")} flow003Pending=${registry.includes("Pending")}`,
      evidence: "OPERATIONAL_SCENARIO_REGISTRY · FLOW_REGISTRY",
      verdict: ok ? "PASS" : "FAIL",
    });
  });
});
