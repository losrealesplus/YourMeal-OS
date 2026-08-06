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
  recalculateLoadCommand,
  rescheduleBatchCommand,
} from "./ProductionCommands";
import {
  getOpenBatchesQuery,
  getProductionCalendarQuery,
  getProductionCapacityQuery,
  getProductionLoadQuery,
  getProductionPlanQuery,
} from "./ProductionQueries";
import type { ProductionRuntimeIdentity } from "./productionServiceContext";
import type { ServiceContext } from "@/services/types";
import type { ProductionReportModel } from "@/modules/operations";
import type { OrderFacade } from "@/order/OrderFacade";

function identity(
  partial: Partial<ProductionRuntimeIdentity> = {},
): ProductionRuntimeIdentity {
  return {
    session: { present: true, userId: "u1" },
    tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
    permissions: {
      roles: ["kitchen", "company_admin"],
      capabilities: ["kitchen.operate", "orders.read"],
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

describe("ProductionFacade work API", () => {
  afterEach(() => {
    resetProductionFacade();
  });

  it("GenerateProductionPlan composes ProductionReportService — returns Work not Orders", async () => {
    const buildForDay = vi.fn(async () => report());
    const facade = new ProductionFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      reports: { buildForDay } as never,
      kitchen: {} as never,
      orders: {} as never,
    });

    const result = await facade.generateProductionPlan(
      identity(),
      generateProductionPlanCommand({ dayDate: "2026-08-05" }),
    );

    expect(buildForDay).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
    expect(result.planId).toBe("plan:2026-08-05");
    expect(result.context?.queue.batches[0]?.dishName).toBe("Bowl");
    expect(result.context?.queue.batches[0]?.status).toBe("queued");
    expect(result.load?.portionCount).toBe(10);
    // Work language — batches, not order list as primary surface
    expect(result.context?.summary.batchCount).toBe(1);
  });

  it("RecalculateLoad re-derives load from day board", async () => {
    const buildForDay = vi.fn(async () => report());
    const facade = new ProductionFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      reports: { buildForDay } as never,
      kitchen: {} as never,
      orders: {} as never,
    });
    const result = await facade.recalculateLoad(
      identity(),
      recalculateLoadCommand({ dayDate: "2026-08-05" }),
    );
    expect(result.ok).toBe(true);
    expect(result.load?.portionCount).toBe(10);
  });

  it("MarkBatchReady / CloseBatch compose KitchenExecutionService", async () => {
    const transitionBatch = vi
      .fn()
      .mockResolvedValueOnce("preparing")
      .mockResolvedValueOnce("finished");
    const buildForDay = vi
      .fn()
      .mockResolvedValueOnce(
        report({
          standardDishes: [
            {
              ...report().standardDishes[0]!,
              batchStatus: "preparing",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        report({
          standardDishes: [
            {
              ...report().standardDishes[0]!,
              batchStatus: "finished",
            },
          ],
        }),
      );
    const facade = new ProductionFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      reports: { buildForDay } as never,
      kitchen: { transitionBatch } as never,
      orders: {} as never,
    });

    const ready = await facade.markBatchReady(
      identity(),
      markBatchReadyCommand({ dayDate: "2026-08-05", dishId: "d1" }),
    );
    expect(transitionBatch).toHaveBeenCalledWith(expect.anything(), {
      deliveryDate: "2026-08-05",
      dishId: "d1",
      toStatus: "preparing",
    });
    expect(ready.status).toBe("released");

    const closed = await facade.closeBatch(
      identity(),
      closeBatchCommand({ dayDate: "2026-08-05", dishId: "d1" }),
    );
    expect(closed.status).toBe("done");
  });

  it("AssignBatch / RescheduleBatch / GenerateProductionBatch are expected UNIMPLEMENTED", async () => {
    const facade = new ProductionFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      reports: {} as never,
      kitchen: {} as never,
      orders: {} as never,
    });
    expect(
      (
        await facade.assignBatch(
          identity(),
          assignBatchCommand({ dayDate: "2026-08-05", dishId: "d1" }),
        )
      ).errors[0]?.code,
    ).toBe("UNIMPLEMENTED");
    expect(
      (
        await facade.rescheduleBatch(
          identity(),
          rescheduleBatchCommand({
            dayDate: "2026-08-05",
            dishId: "d1",
            targetDayDate: "2026-08-06",
          }),
        )
      ).errors[0]?.code,
    ).toBe("UNIMPLEMENTED");
    expect(
      (
        await facade.generateProductionBatch(
          identity(),
          generateProductionBatchCommand({
            dayDate: "2026-08-05",
            dishId: "d1",
          }),
        )
      ).errors[0]?.code,
    ).toBe("UNIMPLEMENTED");
  });

  it("GetProductionPlan / Load / OpenBatches map work units", async () => {
    const buildForDay = vi.fn(async () => report());
    const facade = new ProductionFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      reports: { buildForDay } as never,
      kitchen: {} as never,
      orders: {} as never,
    });

    const plan = await facade.getProductionPlan(
      identity(),
      getProductionPlanQuery({ dayDate: "2026-08-05" }),
    );
    expect(plan.ok).toBe(true);
    expect(plan.context?.queue.batches).toHaveLength(1);

    const load = await facade.getProductionLoad(
      identity(),
      getProductionLoadQuery({ dayDate: "2026-08-05" }),
    );
    expect(load.load?.batchCount).toBe(1);

    const open = await facade.getOpenBatches(
      identity(),
      getOpenBatchesQuery({ dayDate: "2026-08-05" }),
    );
    expect(open.batches).toHaveLength(1);
  });

  it("GetProductionCapacity is expected UNIMPLEMENTED", async () => {
    const facade = new ProductionFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      reports: {} as never,
      kitchen: {} as never,
      orders: {} as never,
    });
    const result = await facade.getProductionCapacity(
      identity(),
      getProductionCapacityQuery({ dayDate: "2026-08-05" }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("UNIMPLEMENTED");
  });

  it("GetProductionCalendar consumes OrderFacade (commitments → days)", async () => {
    const getOperationalCalendar = vi.fn(async () => ({
      ok: true as const,
      calendar: {
        weekStart: "2026-08-03",
        orderIds: ["o1"],
        deliveryDays: ["2026-08-05", "2026-08-07"],
      },
      errors: [],
    }));
    const facade = new ProductionFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      reports: {} as never,
      kitchen: {} as never,
      orders: { getOperationalCalendar } as unknown as OrderFacade,
    });
    const result = await facade.getProductionCalendar(
      identity(),
      getProductionCalendarQuery({ weekStart: "2026-08-03" }),
    );
    expect(result.ok).toBe(true);
    expect(result.calendar.dayDates).toEqual(["2026-08-05", "2026-08-07"]);
    expect(result.calendar.planIds[0]).toBe("plan:2026-08-05");
  });

  it("rejects without session", async () => {
    const facade = new ProductionFacade({
      resolveContext: async () => ({
        ok: false,
        error: {
          code: "PERMISSION_DENIED",
          message: "Authenticated session required for Production operations",
          recoverable: true,
        },
      }),
    });
    const result = await facade.getProductionLoad(
      identity({ session: { present: false, userId: null } }),
      getProductionLoadQuery({ dayDate: "2026-08-05" }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("PERMISSION_DENIED");
  });

  it("future OptimizePlan is UNIMPLEMENTED via execute", async () => {
    const facade = new ProductionFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      reports: {} as never,
      kitchen: {} as never,
      orders: {} as never,
    });
    const result = await facade.execute(identity(), {
      type: "OptimizePlan",
      dayDate: "2026-08-05",
    });
    expect(result.errors[0]?.code).toBe("UNIMPLEMENTED");
  });
});
