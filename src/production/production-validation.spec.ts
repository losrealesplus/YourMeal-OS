/**
 * OPERATIONAL-004 Phase 3 — Production Engineering Certification Matrix.
 * No UI. No Kitchen/Delivery/Billing. Asserts ProductionFacade work API + Laws.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ProductionFacade,
  resetProductionFacade,
} from "./ProductionFacade";
import {
  assignBatchCommand,
  closeBatchCommand,
  generateProductionBatchCommand,
  generateProductionPlanCommand,
  markBatchReadyCommand,
  rescheduleBatchCommand,
} from "./ProductionCommands";
import {
  getProductionCapacityQuery,
  getProductionLoadQuery,
  getProductionPlanQuery,
  getProductionQueueQuery,
  getReadyBatchesQuery,
} from "./ProductionQueries";
import type { ProductionRuntimeIdentity } from "./productionServiceContext";
import type { ServiceContext } from "@/services/types";
import type { ProductionReportModel } from "@/modules/operations";
import type { OrderFacade } from "@/order/OrderFacade";
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
export const PRODUCTION_VALIDATION_MATRIX: ValidationRow[] = [];

function record(row: ValidationRow) {
  PRODUCTION_VALIDATION_MATRIX.push(row);
  expect(row.verdict).not.toBe("FAIL");
}

function identity(
  partial: Partial<ProductionRuntimeIdentity> = {},
): ProductionRuntimeIdentity {
  return {
    session: { present: true, userId: "u1" },
    tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
    permissions: {
      roles: ["kitchen", "company_admin"],
      capabilities: [
        "kitchen.operate",
        "orders.read",
        "production.read",
        "production.plan",
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

function ctx(): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "u1",
    tenantId: "t1",
    roles: ["kitchen"],
    capabilities: new Set(["kitchen.operate"]),
  };
}

function report(
  partial: Partial<ProductionReportModel> = {},
): ProductionReportModel {
  return {
    deliveryDate: "2026-08-05",
    generatedAt: "2026-08-05T08:00:00Z",
    standardDishes: [
      {
        dishId: "d1",
        dishName: "Bowl",
        totalQty: 10,
        customers: [
          {
            orderId: "o1",
            orderStatus: "confirmed",
            customerId: "c1",
            customerName: "María",
            qty: 10,
            note: null,
          },
        ],
        allergens: ["gluten"],
        prepMinutes: 5,
        weightG: 400,
        orderStatuses: ["confirmed"],
        batchStatus: "pending",
        batchUpdatedAt: null,
      },
    ],
    customizations: [],
    ingredientSummary: [],
    totals: {
      orderCount: 1,
      portionCount: 10,
      dishCount: 1,
      customizationCount: 0,
    },
    ...partial,
  };
}

function facadeWith(
  overrides: {
    reports?: Record<string, unknown>;
    kitchen?: Record<string, unknown>;
    orders?: Partial<OrderFacade> | Record<string, unknown>;
    resolveContext?: (
      identity: ProductionRuntimeIdentity,
    ) => Promise<
      | { ok: true; ctx: ServiceContext }
      | {
          ok: false;
          error: {
            code: "PERMISSION_DENIED" | "TENANT_MISMATCH" | "UNKNOWN";
            message: string;
            recoverable: boolean;
          };
        }
    >;
  } = {},
) {
  return new ProductionFacade({
    resolveContext:
      overrides.resolveContext ??
      (async () => ({ ok: true as const, ctx: ctx() })),
    reports: {
      buildForDay: vi.fn(async () => report()),
      ...overrides.reports,
    } as never,
    kitchen: {
      transitionBatch: vi.fn(async () => "preparing"),
      ...overrides.kitchen,
    } as never,
    orders: {
      getOperationalCalendar: vi.fn(async () => ({
        ok: true as const,
        calendar: {
          weekStart: "2026-08-03",
          orderIds: ["o1"],
          deliveryDays: ["2026-08-05"],
        },
        errors: [],
      })),
      ...overrides.orders,
    } as never,
  });
}

describe("OPERATIONAL-004 Production Engineering Certification Matrix", () => {
  afterEach(() => {
    resetProductionFacade();
  });

  it("V01 GenerateProductionPlan", async () => {
    const buildForDay = vi.fn(async () => report());
    const facade = facadeWith({ reports: { buildForDay } });
    const result = await facade.generateProductionPlan(
      identity(),
      generateProductionPlanCommand({ dayDate: "2026-08-05" }),
    );
    const ok =
      result.ok &&
      result.planId === "plan:2026-08-05" &&
      result.context?.queue.batches[0]?.dishName === "Bowl" &&
      result.context.queue.batches[0]?.status === "queued" &&
      buildForDay.mock.calls.length === 1;
    record({
      id: "V01",
      name: "GenerateProductionPlan",
      expected: "ok · Work batches · delegates ProductionReportService",
      observed: `ok=${result.ok} planId=${result.planId} dish=${result.context?.queue.batches[0]?.dishName} calls=${buildForDay.mock.calls.length}`,
      evidence: "ProductionFacade.generateProductionPlan",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V02 GenerateProductionBatch (expected UNIMPLEMENTED)", async () => {
    const facade = facadeWith();
    const result = await facade.generateProductionBatch(
      identity(),
      generateProductionBatchCommand({
        dayDate: "2026-08-05",
        dishId: "d1",
      }),
    );
    const ok =
      !result.ok &&
      result.errors[0]?.code === "UNIMPLEMENTED" &&
      result.errors[0]?.recoverable === true;
    record({
      id: "V02",
      name: "GenerateProductionBatch (expected UNIMPLEMENTED)",
      expected: "UNIMPLEMENTED · recoverable · intent frozen",
      observed: `ok=${result.ok} code=${result.errors[0]?.code} recoverable=${result.errors[0]?.recoverable}`,
      evidence: "ProductionFacade.generateProductionBatch",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V03 GetProductionQueue", async () => {
    const facade = facadeWith();
    const result = await facade.getProductionQueue(
      identity(),
      getProductionQueueQuery({ dayDate: "2026-08-05" }),
    );
    const ok =
      result.ok &&
      (result.context?.queue.batches.length ?? 0) >= 1 &&
      result.context?.queue.batches[0]?.id.startsWith("batch:") === true;
    record({
      id: "V03",
      name: "GetProductionQueue",
      expected: "ok · Work queue batches (not Order list)",
      observed: `ok=${result.ok} n=${result.context?.queue.batches.length} id=${result.context?.queue.batches[0]?.id}`,
      evidence: "ProductionFacade.getProductionQueue",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V04 GetProductionPlan", async () => {
    const facade = facadeWith();
    const result = await facade.getProductionPlan(
      identity(),
      getProductionPlanQuery({ dayDate: "2026-08-05" }),
    );
    const ok =
      result.ok &&
      result.context?.summary.id === "plan:2026-08-05" &&
      result.context.summary.load.portionCount === 10;
    record({
      id: "V04",
      name: "GetProductionPlan",
      expected: "ok · ProductionContext · plan + load",
      observed: `ok=${result.ok} plan=${result.context?.summary.id} portions=${result.context?.summary.load.portionCount}`,
      evidence: "ProductionFacade.getProductionPlan",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V05 GetProductionLoad", async () => {
    const facade = facadeWith();
    const result = await facade.getProductionLoad(
      identity(),
      getProductionLoadQuery({ dayDate: "2026-08-05" }),
    );
    const ok =
      result.ok &&
      result.load?.portionCount === 10 &&
      result.load.batchCount === 1;
    record({
      id: "V05",
      name: "GetProductionLoad",
      expected: "ok · ProductionLoad (portions · batches)",
      observed: `ok=${result.ok} portions=${result.load?.portionCount} batches=${result.load?.batchCount}`,
      evidence: "ProductionFacade.getProductionLoad",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V06 GetProductionCapacity (expected UNIMPLEMENTED)", async () => {
    const facade = facadeWith();
    const result = await facade.getProductionCapacity(
      identity(),
      getProductionCapacityQuery({ dayDate: "2026-08-05" }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V06",
      name: "GetProductionCapacity (expected UNIMPLEMENTED)",
      expected: "UNIMPLEMENTED · no capacity engine yet",
      observed: `ok=${result.ok} code=${result.errors[0]?.code}`,
      evidence: "ProductionFacade.getProductionCapacity",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V07 AssignBatch (expected UNIMPLEMENTED)", async () => {
    const facade = facadeWith();
    const result = await facade.assignBatch(
      identity(),
      assignBatchCommand({ dayDate: "2026-08-05", dishId: "d1" }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V07",
      name: "AssignBatch (expected UNIMPLEMENTED)",
      expected: "UNIMPLEMENTED · intent frozen",
      observed: `ok=${result.ok} code=${result.errors[0]?.code}`,
      evidence: "ProductionFacade.assignBatch",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V08 RescheduleBatch (expected UNIMPLEMENTED)", async () => {
    const facade = facadeWith();
    const result = await facade.rescheduleBatch(
      identity(),
      rescheduleBatchCommand({
        dayDate: "2026-08-05",
        dishId: "d1",
        targetDayDate: "2026-08-06",
      }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V08",
      name: "RescheduleBatch (expected UNIMPLEMENTED)",
      expected: "UNIMPLEMENTED · intent frozen",
      observed: `ok=${result.ok} code=${result.errors[0]?.code}`,
      evidence: "ProductionFacade.rescheduleBatch",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V09 MarkBatchReady", async () => {
    const transitionBatch = vi.fn(async () => "preparing");
    const buildForDay = vi.fn(async () =>
      report({
        standardDishes: [
          { ...report().standardDishes[0]!, batchStatus: "preparing" },
        ],
      }),
    );
    const facade = facadeWith({
      kitchen: { transitionBatch },
      reports: { buildForDay },
    });
    const result = await facade.markBatchReady(
      identity(),
      markBatchReadyCommand({ dayDate: "2026-08-05", dishId: "d1" }),
    );
    const ok =
      result.ok &&
      result.status === "released" &&
      transitionBatch.mock.calls[0]?.[1]?.toStatus === "preparing";
    record({
      id: "V09",
      name: "MarkBatchReady",
      expected: "ok · released · KitchenExecutionService.preparing",
      observed: `ok=${result.ok} status=${result.status} to=${transitionBatch.mock.calls[0]?.[1]?.toStatus}`,
      evidence: "ProductionFacade.markBatchReady",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V10 CloseBatch", async () => {
    const transitionBatch = vi.fn(async () => "finished");
    const buildForDay = vi.fn(async () =>
      report({
        standardDishes: [
          { ...report().standardDishes[0]!, batchStatus: "finished" },
        ],
      }),
    );
    const facade = facadeWith({
      kitchen: { transitionBatch },
      reports: { buildForDay },
    });
    const result = await facade.closeBatch(
      identity(),
      closeBatchCommand({ dayDate: "2026-08-05", dishId: "d1" }),
    );
    const ok =
      result.ok &&
      result.status === "done" &&
      transitionBatch.mock.calls[0]?.[1]?.toStatus === "finished";
    record({
      id: "V10",
      name: "CloseBatch",
      expected: "ok · done · KitchenExecutionService.finished",
      observed: `ok=${result.ok} status=${result.status} to=${transitionBatch.mock.calls[0]?.[1]?.toStatus}`,
      evidence: "ProductionFacade.closeBatch",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V11 Order integration", async () => {
    const getOperationalCalendar = vi.fn(async () => ({
      ok: true as const,
      calendar: {
        weekStart: "2026-08-03",
        orderIds: ["o1"],
        deliveryDays: ["2026-08-05", "2026-08-07"],
      },
      errors: [],
    }));
    const facade = facadeWith({
      orders: { getOperationalCalendar },
    });
    const calendar = await facade.getProductionCalendar(identity(), {
      type: "GetProductionCalendar",
      weekStart: "2026-08-03",
    });
    const plan = await facade.generateProductionPlan(
      identity(),
      generateProductionPlanCommand({ dayDate: "2026-08-05" }),
    );
    const ok =
      calendar.ok &&
      calendar.calendar.dayDates.includes("2026-08-05") &&
      getOperationalCalendar.mock.calls.length === 1 &&
      plan.ok &&
      plan.context?.sourceOrders.orderIds.includes("o1") === true;
    record({
      id: "V11",
      name: "Order integration",
      expected:
        "Calendar via OrderFacade · plan carries source orderIds · no Order mutation",
      observed: `calendarOk=${calendar.ok} days=${calendar.calendar.dayDates.join(",")} sourceOrders=${plan.context?.sourceOrders.orderIds.join(",")}`,
      evidence: "getProductionCalendar · generateProductionPlan.sourceOrders",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V12 Identity integration", async () => {
    const denied = await facadeWith({
      resolveContext: async () => ({
        ok: false as const,
        error: {
          code: "PERMISSION_DENIED" as const,
          message: "Authenticated session required for Production operations",
          recoverable: true,
        },
      }),
    }).getProductionLoad(
      identity({ session: { present: false, userId: null } }),
      getProductionLoadQuery({ dayDate: "2026-08-05" }),
    );
    const mismatch = await facadeWith({
      resolveContext: async () => ({
        ok: false as const,
        error: {
          code: "TENANT_MISMATCH" as const,
          message: "Tenant required for Production operations",
          recoverable: true,
        },
      }),
    }).getProductionLoad(
      identity({ tenant: null }),
      getProductionLoadQuery({ dayDate: "2026-08-05" }),
    );
    const ok =
      denied.errors[0]?.code === "PERMISSION_DENIED" &&
      mismatch.errors[0]?.code === "TENANT_MISMATCH";
    record({
      id: "V12",
      name: "Identity integration",
      expected: "no session → PERMISSION_DENIED · no tenant → TENANT_MISMATCH",
      observed: `denied=${denied.errors[0]?.code} mismatch=${mismatch.errors[0]?.code}`,
      evidence: "resolveProductionServiceContext via Facade",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V13 Permission model", async () => {
    const facade = facadeWith();
    const reader = identity({
      permissions: {
        roles: ["support"],
        capabilities: ["orders.read"],
      },
    });
    const plan = await facade.getProductionPlan(
      reader,
      getProductionPlanQuery({ dayDate: "2026-08-05" }),
    );
    const ok =
      plan.ok &&
      plan.context?.permissions.canRead === true &&
      plan.context.permissions.canPlan === false &&
      plan.context.permissions.canViewKitchen === false;
    record({
      id: "V13",
      name: "Permission model",
      expected: "canRead/Plan/Release/ViewKitchen from Identity caps",
      observed: `canRead=${plan.context?.permissions.canRead} canPlan=${plan.context?.permissions.canPlan} canKitchen=${plan.context?.permissions.canViewKitchen}`,
      evidence: "productionCapabilityBitsFromIdentity",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V14 Service delegation", async () => {
    const buildForDay = vi.fn(async () => report());
    const transitionBatch = vi.fn(async () => "preparing");
    const getOperationalCalendar = vi.fn(async () => ({
      ok: true as const,
      calendar: {
        weekStart: "2026-08-03",
        orderIds: ["o1"],
        deliveryDays: ["2026-08-05"],
      },
      errors: [],
    }));
    const facade = facadeWith({
      reports: { buildForDay },
      kitchen: { transitionBatch },
      orders: { getOperationalCalendar },
    });
    await facade.generateProductionPlan(
      identity(),
      generateProductionPlanCommand({ dayDate: "2026-08-05" }),
    );
    await facade.markBatchReady(
      identity(),
      markBatchReadyCommand({ dayDate: "2026-08-05", dishId: "d1" }),
    );
    await facade.getProductionCalendar(identity(), {
      type: "GetProductionCalendar",
      weekStart: "2026-08-03",
    });
    const ok =
      buildForDay.mock.calls.length >= 1 &&
      transitionBatch.mock.calls.length === 1 &&
      getOperationalCalendar.mock.calls.length === 1;
    record({
      id: "V14",
      name: "Service delegation",
      expected:
        "Facade composes Report + KitchenExecution + OrderFacade only",
      observed: `report=${buildForDay.mock.calls.length} kitchen=${transitionBatch.mock.calls.length} orders=${getOperationalCalendar.mock.calls.length}`,
      evidence: "injected service spies",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V15 Foundation Laws 001–004", async () => {
    const indexSrc = readFileSync(
      resolve(process.cwd(), "src/production/index.ts"),
      "utf8",
    );
    const useSrc = readFileSync(
      resolve(process.cwd(), "src/production/useProduction.ts"),
      "utf8",
    );
    const facadeSrc = readFileSync(
      resolve(process.cwd(), "src/production/ProductionFacade.ts"),
      "utf8",
    );
    const lawDoc = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/FOUNDATION_LOCK.md"),
      "utf8",
    );
    const publicExportsOk =
      indexSrc.includes("ProductionFacade") &&
      indexSrc.includes("useProduction") &&
      !indexSrc.includes("productionServiceContext") &&
      !indexSrc.includes("integrations/supabase");
    const uiPathOk =
      useSrc.includes("useIdentity") && !useSrc.includes("integrations/supabase");
    const workLanguage =
      facadeSrc.includes("GenerateProductionPlan") &&
      !facadeSrc.includes("CreateOrder") &&
      facadeSrc.includes("Never exposes Supabase") &&
      facadeSrc.includes("never manipulates Orders directly");
    const lawsPresent =
      lawDoc.includes("FOUNDATION LAW 001") &&
      lawDoc.includes("FOUNDATION LAW 002") &&
      lawDoc.includes("FOUNDATION LAW 003") &&
      lawDoc.includes("FOUNDATION LAW 004");
    const ok = publicExportsOk && uiPathOk && workLanguage && lawsPresent;
    record({
      id: "V15",
      name: "Foundation Laws 001–004",
      expected: "Facade-only API · work language · Laws documented",
      observed: `publicExportsOk=${publicExportsOk} uiPathOk=${uiPathOk} workLanguage=${workLanguage} lawsPresent=${lawsPresent}`,
      evidence: "index · useProduction · ProductionFacade · FOUNDATION_LOCK",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V16 Capability dependency integrity", async () => {
    const facadeSrc = readFileSync(
      resolve(process.cwd(), "src/production/ProductionFacade.ts"),
      "utf8",
    );
    const registry = readFileSync(
      resolve(process.cwd(), "docs/00-status/CAPABILITY_REGISTRY.md"),
      "utf8",
    );
    const consumesOrder =
      facadeSrc.includes("OrderFacade") || facadeSrc.includes("getOrderFacade");
    const noOrderMutation =
      !facadeSrc.includes("scheduleProduction") &&
      !facadeSrc.includes("confirmOrder") &&
      !facadeSrc.includes("planWeeklyOrder");
    const neverCooks =
      registry.includes("Production never cooks") ||
      facadeSrc.includes("never manipulates Orders");
    const kitchenConsumer = registry.includes("Consumida por") &&
      registry.includes("Kitchen");
    const ok = consumesOrder && noOrderMutation && neverCooks && kitchenConsumer;
    record({
      id: "V16",
      name: "Capability dependency integrity",
      expected:
        "Consumes OrderFacade · does not mutate Orders · Kitchen is consumer",
      observed: `consumesOrder=${consumesOrder} noOrderMutation=${noOrderMutation} neverCooks=${neverCooks} kitchenConsumer=${kitchenConsumer}`,
      evidence: "ProductionFacade source · CAPABILITY_REGISTRY dependency map",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V17 GetReadyBatches after MarkBatchReady", async () => {
    const buildForDay = vi.fn(async () =>
      report({
        standardDishes: [
          { ...report().standardDishes[0]!, batchStatus: "preparing" },
        ],
      }),
    );
    const facade = facadeWith({ reports: { buildForDay } });
    const ready = await facade.getReadyBatches(
      identity(),
      getReadyBatchesQuery({ dayDate: "2026-08-05" }),
    );
    const ok =
      ready.ok &&
      ready.batches.length === 1 &&
      ready.batches[0]?.status === "released";
    record({
      id: "V17",
      name: "GetReadyBatches",
      expected: "batches with released/in_progress status",
      observed: `ok=${ready.ok} n=${ready.batches.length} status=${ready.batches[0]?.status}`,
      evidence: "ProductionFacade.getReadyBatches",
      verdict: ok ? "PASS" : "FAIL",
    });
  });
});
