/**
 * OPERATIONAL-003 Phase 3 — Order Validation Matrix (automated).
 * No UI. No CRUD screens. Asserts OrderFacade process commands/queries + Laws.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { OrderFacade, resetOrderFacade } from "./OrderFacade";
import {
  cancelOrderCommand,
  closeOrderCommand,
  completeDeliveryCommand,
  confirmOrderCommand,
  planWeeklyOrderCommand,
  readyForDeliveryCommand,
  readyForKitchenCommand,
  scheduleProductionCommand,
} from "./OrderCommands";
import {
  getKitchenQueueQuery,
  getOperationalCalendarQuery,
  getOrderQuery,
  getOrdersByCustomerQuery,
  getOrdersByDeliveryDayQuery,
  getOrdersByWeekQuery,
  getOrdersPendingProductionQuery,
  getOrdersReadyForDeliveryQuery,
  searchOrdersQuery,
} from "./OrderQueries";
import type { OrderRuntimeIdentity } from "./orderServiceContext";
import type { ServiceContext } from "@/services/types";
import type { OperationalOrderListItem } from "@/modules/operations";
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
export const ORDER_VALIDATION_MATRIX: ValidationRow[] = [];

function record(row: ValidationRow) {
  ORDER_VALIDATION_MATRIX.push(row);
  expect(row.verdict).not.toBe("FAIL");
}

function identity(
  partial: Partial<OrderRuntimeIdentity> = {},
): OrderRuntimeIdentity {
  return {
    session: { present: true, userId: "u1" },
    tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
    permissions: {
      roles: ["company_admin", "kitchen", "logistics"],
      capabilities: [
        "orders.read",
        "orders.write",
        "kitchen.operate",
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

function ctx(): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "u1",
    tenantId: "t1",
    roles: ["company_admin", "kitchen", "logistics"],
    capabilities: new Set([
      "orders.read",
      "orders.write",
      "kitchen.operate",
      "logistics.operate",
    ]),
  };
}

function listItem(
  partial: Partial<OperationalOrderListItem> = {},
): OperationalOrderListItem {
  return {
    id: "o1",
    tenantId: "t1",
    status: "confirmed",
    weekStart: "2026-08-03",
    notes: null,
    total: 42,
    createdAt: "2026-08-01T00:00:00Z",
    demandChannel: "individual",
    customerId: "c1",
    customerName: "María",
    customerEmail: "m@ex.com",
    companyId: null,
    companyName: null,
    siteId: null,
    siteName: null,
    siteAddress: null,
    organizationalUnitId: null,
    organizationalUnitName: null,
    deliveryGroupId: null,
    deliveryGroupName: null,
    deliveryDates: ["2026-08-05"],
    items: [
      {
        id: "i1",
        dishId: "d1",
        dishName: "Bowl",
        dayDate: "2026-08-05",
        qty: 2,
        notes: null,
      },
    ],
    ...partial,
  };
}

function facadeWith(
  overrides: {
    intake?: Record<string, unknown>;
    orders?: Record<string, unknown>;
    operations?: Record<string, unknown>;
    resolveContext?: (
      identity: OrderRuntimeIdentity,
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
  return new OrderFacade({
    resolveContext:
      overrides.resolveContext ??
      (async () => ({ ok: true as const, ctx: ctx() })),
    intake: {
      intakeDraft: vi.fn(async () => ({
        order: { id: "o1", status: "draft" },
        items: [],
      })),
      ...overrides.intake,
    } as never,
    orders: {
      confirm: vi.fn(async () => ({ id: "o1", status: "confirmed" })),
      ...overrides.orders,
    } as never,
    operations: {
      getOrder: vi.fn(async () => listItem()),
      startProduction: vi.fn(async () => "in_production"),
      completeProduction: vi.fn(async () => "prepared"),
      transitionKitchen: vi.fn(async () => "ready_for_delivery"),
      transitionDelivery: vi.fn(async () => "delivered"),
      listKitchenOrders: vi.fn(async () => [listItem()]),
      listDeliveryOrders: vi.fn(async () => []),
      ...overrides.operations,
    } as never,
  });
}

describe("OPERATIONAL-003 Order Validation Matrix", () => {
  afterEach(() => {
    resetOrderFacade();
  });

  it("V01 PlanWeeklyOrder", async () => {
    const intakeDraft = vi.fn(async () => ({
      order: { id: "o1", status: "draft" },
      items: [],
    }));
    const getOrder = vi.fn(async () => listItem({ status: "draft" }));
    const facade = facadeWith({
      intake: { intakeDraft },
      operations: { getOrder },
    });
    const result = await facade.planWeeklyOrder(
      identity(),
      planWeeklyOrderCommand({
        weekStart: "2026-08-03",
        items: [{ dishId: "d1", dayDate: "2026-08-05", qty: 1 }],
        targetCustomerId: "c1",
      }),
    );
    const ok =
      result.ok &&
      result.orderId === "o1" &&
      result.status === "draft" &&
      intakeDraft.mock.calls.length === 1;
    record({
      id: "V01",
      name: "PlanWeeklyOrder",
      expected: "ok · draft · delegates OrderIntakeService.intakeDraft",
      observed: `ok=${result.ok} id=${result.orderId} status=${result.status} intakeCalls=${intakeDraft.mock.calls.length}`,
      evidence: "OrderFacade.planWeeklyOrder",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V02 ConfirmOrder", async () => {
    const confirm = vi.fn(async () => ({ id: "o1", status: "confirmed" }));
    const getOrder = vi.fn(async () => listItem({ status: "confirmed" }));
    const facade = facadeWith({
      orders: { confirm },
      operations: { getOrder },
    });
    const result = await facade.confirmOrder(
      identity(),
      confirmOrderCommand({ orderId: "o1" }),
    );
    const ok =
      result.ok &&
      result.status === "confirmed" &&
      confirm.mock.calls[0]?.[1] === "o1";
    record({
      id: "V02",
      name: "ConfirmOrder",
      expected: "ok · confirmed · delegates OrderService.confirm",
      observed: `ok=${result.ok} status=${result.status} confirmId=${confirm.mock.calls[0]?.[1]}`,
      evidence: "OrderFacade.confirmOrder",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V03 ScheduleProduction", async () => {
    const startProduction = vi.fn(async () => "in_production");
    const getOrder = vi.fn(async () =>
      listItem({ status: "in_production" }),
    );
    const facade = facadeWith({
      operations: { startProduction, getOrder },
    });
    const result = await facade.scheduleProduction(
      identity(),
      scheduleProductionCommand({ orderId: "o1" }),
    );
    const ok =
      result.ok &&
      result.status === "in_production" &&
      startProduction.mock.calls.length === 1;
    record({
      id: "V03",
      name: "ScheduleProduction",
      expected: "ok · in_production · OperationsService.startProduction",
      observed: `ok=${result.ok} status=${result.status} calls=${startProduction.mock.calls.length}`,
      evidence: "OrderFacade.scheduleProduction",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V04 ReadyForKitchen", async () => {
    const completeProduction = vi.fn(async () => "prepared");
    const getOrder = vi.fn(async () => listItem({ status: "prepared" }));
    const facade = facadeWith({
      operations: { completeProduction, getOrder },
    });
    const result = await facade.readyForKitchen(
      identity(),
      readyForKitchenCommand({ orderId: "o1" }),
    );
    const ok =
      result.ok &&
      result.status === "prepared" &&
      completeProduction.mock.calls.length === 1;
    record({
      id: "V04",
      name: "ReadyForKitchen",
      expected: "ok · prepared · OperationsService.completeProduction",
      observed: `ok=${result.ok} status=${result.status} calls=${completeProduction.mock.calls.length}`,
      evidence: "OrderFacade.readyForKitchen",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V05 ReadyForDelivery", async () => {
    const transitionKitchen = vi.fn(async () => "ready_for_delivery");
    const getOrder = vi.fn(async () =>
      listItem({ status: "ready_for_delivery" }),
    );
    const facade = facadeWith({
      operations: { transitionKitchen, getOrder },
    });
    const result = await facade.readyForDelivery(
      identity(),
      readyForDeliveryCommand({ orderId: "o1" }),
    );
    const ok =
      result.ok &&
      result.status === "ready_for_delivery" &&
      transitionKitchen.mock.calls[0]?.[2] === "ready_for_delivery";
    record({
      id: "V05",
      name: "ReadyForDelivery",
      expected: "ok · ready_for_delivery · transitionKitchen",
      observed: `ok=${result.ok} status=${result.status} to=${transitionKitchen.mock.calls[0]?.[2]}`,
      evidence: "OrderFacade.readyForDelivery",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V06 CompleteDelivery", async () => {
    const getOrder = vi
      .fn()
      .mockResolvedValueOnce(listItem({ status: "ready_for_delivery" }))
      .mockResolvedValue(listItem({ status: "delivered" }));
    const transitionDelivery = vi
      .fn()
      .mockResolvedValueOnce("out_for_delivery")
      .mockResolvedValueOnce("delivered");
    const facade = facadeWith({
      operations: { getOrder, transitionDelivery },
    });
    const result = await facade.completeDelivery(
      identity(),
      completeDeliveryCommand({ orderId: "o1" }),
    );
    const ok =
      result.ok &&
      result.status === "delivered" &&
      transitionDelivery.mock.calls.length === 2;
    record({
      id: "V06",
      name: "CompleteDelivery",
      expected: "ok · ready→out→delivered via transitionDelivery",
      observed: `ok=${result.ok} status=${result.status} transitions=${transitionDelivery.mock.calls.length}`,
      evidence: "OrderFacade.completeDelivery",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V07 CloseOrder (expected UNIMPLEMENTED)", async () => {
    const facade = facadeWith();
    const result = await facade.closeOrder(
      identity(),
      closeOrderCommand({ orderId: "o1" }),
    );
    const ok =
      !result.ok &&
      result.errors[0]?.code === "UNIMPLEMENTED" &&
      result.errors[0]?.recoverable === true;
    record({
      id: "V07",
      name: "CloseOrder (expected UNIMPLEMENTED)",
      expected: "UNIMPLEMENTED · recoverable · intent frozen",
      observed: `ok=${result.ok} code=${result.errors[0]?.code} recoverable=${result.errors[0]?.recoverable}`,
      evidence: "OrderFacade.closeOrder",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V08 CancelOrder (expected UNIMPLEMENTED)", async () => {
    const facade = facadeWith();
    const result = await facade.cancelOrder(
      identity(),
      cancelOrderCommand({ orderId: "o1", reason: "test" }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V08",
      name: "CancelOrder (expected UNIMPLEMENTED)",
      expected: "UNIMPLEMENTED · intent frozen · no invented cancel substrate",
      observed: `ok=${result.ok} code=${result.errors[0]?.code}`,
      evidence: "OrderFacade.cancelOrder",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V09 Operational Week", async () => {
    const row = listItem({ weekStart: "2026-08-03" });
    const facade = facadeWith({
      operations: {
        listKitchenOrders: vi.fn(async () => [row]),
        listDeliveryOrders: vi.fn(async () => []),
      },
    });
    const byWeek = await facade.getOrdersByWeek(
      identity(),
      getOrdersByWeekQuery({ weekStart: "2026-08-03" }),
    );
    const calendar = await facade.getOperationalCalendar(
      identity(),
      getOperationalCalendarQuery({ weekStart: "2026-08-03" }),
    );
    const weekOk =
      byWeek.ok &&
      byWeek.summaries[0]?.week.weekStart === "2026-08-03";
    const calendarOk =
      calendar.ok &&
      calendar.calendar.weekStart === "2026-08-03" &&
      calendar.calendar.orderIds.includes("o1") &&
      calendar.calendar.deliveryDays.includes("2026-08-05");
    const ok = weekOk && calendarOk;
    record({
      id: "V09",
      name: "Operational Week",
      expected: "GetOrdersByWeek + GetOperationalCalendar for weekStart",
      observed: `byWeek=${byWeek.ok} week=${byWeek.summaries[0]?.week.weekStart} calendarOk=${calendarOk} days=${calendar.calendar.deliveryDays.join(",")}`,
      evidence: "OrderFacade.getOrdersByWeek / getOperationalCalendar",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V10 Delivery Day", async () => {
    const row = listItem({ deliveryDates: ["2026-08-05"] });
    const listKitchen = vi.fn(async () => [row]);
    const listDelivery = vi.fn(async () => [row]);
    const facade = facadeWith({
      operations: {
        listKitchenOrders: listKitchen,
        listDeliveryOrders: listDelivery,
      },
    });
    const byDay = await facade.getOrdersByDeliveryDay(
      identity(),
      getOrdersByDeliveryDayQuery({ deliveryDay: "2026-08-05" }),
    );
    const pending = await facade.getOrdersPendingProduction(
      identity(),
      getOrdersPendingProductionQuery({ deliveryDay: "2026-08-05" }),
    );
    const ready = await facade.getOrdersReadyForDelivery(
      identity(),
      getOrdersReadyForDeliveryQuery({ deliveryDay: "2026-08-05" }),
    );
    const ok =
      byDay.ok &&
      byDay.summaries.length >= 1 &&
      listKitchen.mock.calls.some((c) => c[1]?.deliveryDate === "2026-08-05") &&
      pending.ok &&
      ready.ok;
    record({
      id: "V10",
      name: "Delivery Day",
      expected:
        "ByDeliveryDay · PendingProduction · ReadyForDelivery filter by day",
      observed: `byDay=${byDay.ok} pending=${pending.ok} ready=${ready.ok} kitchenFilter=${listKitchen.mock.calls[0]?.[1]?.deliveryDate}`,
      evidence: "OrderFacade delivery-day queries",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V11 Customer relationship", async () => {
    const row = listItem({ customerId: "c1", customerName: "María" });
    const facade = facadeWith({
      operations: {
        getOrder: vi.fn(async () => row),
        listKitchenOrders: vi.fn(async () => [row]),
        listDeliveryOrders: vi.fn(async () => []),
      },
    });
    const got = await facade.getOrder(
      identity(),
      getOrderQuery({ orderId: "o1" }),
    );
    const byCustomer = await facade.getOrdersByCustomer(
      identity(),
      getOrdersByCustomerQuery({ customerId: "c1" }),
    );
    const ok =
      got.ok &&
      got.context?.details.summary.partyRef.id === "c1" &&
      got.context.details.summary.partyRef.displayName === "María" &&
      byCustomer.ok &&
      byCustomer.summaries.every((s) => s.partyRef.id === "c1");
    record({
      id: "V11",
      name: "Customer relationship",
      expected: "OrderContext.partyRef · GetOrdersByCustomer filters Demand Party",
      observed: `party=${got.context?.details.summary.partyRef.id}:${got.context?.details.summary.partyRef.displayName} byCustomerN=${byCustomer.summaries.length}`,
      evidence: "mapListItemToContext · getOrdersByCustomer",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V12 Identity relationship", async () => {
    const denied = await facadeWith({
      resolveContext: async () => ({
        ok: false as const,
        error: {
          code: "PERMISSION_DENIED" as const,
          message: "Authenticated session required for Order operations",
          recoverable: true,
        },
      }),
    }).searchOrders(
      identity({ session: { present: false, userId: null } }),
      searchOrdersQuery({}),
    );
    const mismatch = await facadeWith({
      resolveContext: async () => ({
        ok: false as const,
        error: {
          code: "TENANT_MISMATCH" as const,
          message: "Tenant required for Order operations",
          recoverable: true,
        },
      }),
    }).searchOrders(identity({ tenant: null }), searchOrdersQuery({}));
    const ok =
      denied.errors[0]?.code === "PERMISSION_DENIED" &&
      mismatch.errors[0]?.code === "TENANT_MISMATCH";
    record({
      id: "V12",
      name: "Identity relationship",
      expected: "no session → PERMISSION_DENIED · no tenant → TENANT_MISMATCH",
      observed: `denied=${denied.errors[0]?.code} mismatch=${mismatch.errors[0]?.code}`,
      evidence: "resolveOrderServiceContext via Facade",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V13 Permission checks", async () => {
    const facade = facadeWith();
    const reader = identity({
      permissions: {
        roles: ["support"],
        capabilities: ["orders.read"],
      },
    });
    const got = await facade.getOrder(
      reader,
      getOrderQuery({ orderId: "o1" }),
    );
    const ok =
      got.ok &&
      got.context?.permissions.canRead === true &&
      got.context.permissions.canWrite === false &&
      got.context.permissions.canKitchen === false &&
      got.context.permissions.canLogistics === false;
    record({
      id: "V13",
      name: "Permission checks",
      expected: "canRead/Write/Kitchen/Logistics from Identity caps",
      observed: `canRead=${got.context?.permissions.canRead} canWrite=${got.context?.permissions.canWrite} canKitchen=${got.context?.permissions.canKitchen} canLogistics=${got.context?.permissions.canLogistics}`,
      evidence: "orderCapabilityBitsFromIdentity → OrderContext.permissions",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V14 Bootstrap interaction", async () => {
    const facadeSrc = readFileSync(
      resolve(process.cwd(), "src/order/OrderFacade.ts"),
      "utf8",
    );
    const useSrc = readFileSync(
      resolve(process.cwd(), "src/order/useOrder.ts"),
      "utf8",
    );
    const ok =
      !facadeSrc.includes("BootstrapOrchestrator") &&
      !facadeSrc.includes("BootstrapIdentityStore") &&
      !useSrc.includes("supabase") &&
      useSrc.includes("useIdentity");
    record({
      id: "V14",
      name: "Bootstrap interaction",
      expected: "Order consumes Identity · does not own Bootstrap load",
      observed: `facadeOwnsBootstrap=${facadeSrc.includes("BootstrapOrchestrator")} useOrderUsesIdentity=${useSrc.includes("useIdentity")} useOrderImportsSupabase=${useSrc.includes("supabase")}`,
      evidence: "static source inspection OrderFacade / useOrder",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V15 Facade integrity", async () => {
    const facade = facadeWith({
      operations: {
        getOrder: vi.fn(async () => listItem({ status: "draft" })),
      },
    });
    const viaExecute = await facade.execute(
      identity(),
      planWeeklyOrderCommand({
        weekStart: "2026-08-03",
        items: [{ dishId: "d1", dayDate: "2026-08-05", qty: 1 }],
      }),
    );
    const viaQuery = await facade.query(
      identity(),
      getKitchenQueueQuery({}),
    );
    const future = await facade.execute(identity(), {
      type: "DuplicateWeek",
      sourceWeekStart: "2026-08-03",
      targetWeekStart: "2026-08-10",
    });
    const ok =
      viaExecute.ok &&
      "summaries" in viaQuery &&
      viaQuery.ok &&
      future.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V15",
      name: "Facade integrity",
      expected: "execute/query route process intents · future cmds UNIMPLEMENTED",
      observed: `executeOk=${viaExecute.ok} queryOk=${"ok" in viaQuery && viaQuery.ok} future=${future.errors[0]?.code}`,
      evidence: "OrderFacade.execute / query",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V16 Service delegation", async () => {
    const intakeDraft = vi.fn(async () => ({
      order: { id: "o1", status: "draft" },
      items: [],
    }));
    const confirm = vi.fn(async () => ({ id: "o1", status: "confirmed" }));
    const startProduction = vi.fn(async () => "in_production");
    const completeProduction = vi.fn(async () => "prepared");
    const transitionKitchen = vi.fn(async () => "ready_for_delivery");
    const getOrder = vi.fn(async () => listItem());
    const listKitchenOrders = vi.fn(async () => [listItem()]);
    const listDeliveryOrders = vi.fn(async () => []);
    const facade = facadeWith({
      intake: { intakeDraft },
      orders: { confirm },
      operations: {
        startProduction,
        completeProduction,
        transitionKitchen,
        getOrder,
        listKitchenOrders,
        listDeliveryOrders,
      },
    });

    await facade.planWeeklyOrder(
      identity(),
      planWeeklyOrderCommand({
        weekStart: "2026-08-03",
        items: [{ dishId: "d1", dayDate: "2026-08-05", qty: 1 }],
      }),
    );
    await facade.confirmOrder(identity(), confirmOrderCommand({ orderId: "o1" }));
    await facade.scheduleProduction(
      identity(),
      scheduleProductionCommand({ orderId: "o1" }),
    );
    await facade.readyForKitchen(
      identity(),
      readyForKitchenCommand({ orderId: "o1" }),
    );
    await facade.readyForDelivery(
      identity(),
      readyForDeliveryCommand({ orderId: "o1" }),
    );
    await facade.getKitchenQueue(identity(), getKitchenQueueQuery({}));
    await facade.searchOrders(identity(), searchOrdersQuery({}));

    const ok =
      intakeDraft.mock.calls.length === 1 &&
      confirm.mock.calls.length === 1 &&
      startProduction.mock.calls.length === 1 &&
      completeProduction.mock.calls.length === 1 &&
      transitionKitchen.mock.calls.length === 1 &&
      listKitchenOrders.mock.calls.length >= 1;
    record({
      id: "V16",
      name: "Service delegation",
      expected:
        "Facade composes Intake + OrderService + OperationsService only",
      observed: `intake=${intakeDraft.mock.calls.length} confirm=${confirm.mock.calls.length} start=${startProduction.mock.calls.length} complete=${completeProduction.mock.calls.length} kitchen=${transitionKitchen.mock.calls.length} listKitchen=${listKitchenOrders.mock.calls.length}`,
      evidence: "injected service spies",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V17 Foundation Law compliance", async () => {
    const indexSrc = readFileSync(
      resolve(process.cwd(), "src/order/index.ts"),
      "utf8",
    );
    const useSrc = readFileSync(
      resolve(process.cwd(), "src/order/useOrder.ts"),
      "utf8",
    );
    const facadeSrc = readFileSync(
      resolve(process.cwd(), "src/order/OrderFacade.ts"),
      "utf8",
    );
    const publicExportsOk =
      indexSrc.includes("OrderFacade") &&
      indexSrc.includes("useOrder") &&
      !indexSrc.includes("orderServiceContext") &&
      !indexSrc.includes("integrations/supabase");
    const uiPathOk =
      useSrc.includes("useIdentity") && !useSrc.includes("integrations/supabase");
    const lawDoc = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/FOUNDATION_LOCK.md"),
      "utf8",
    );
    const lawPresent =
      lawDoc.includes("FOUNDATION LAW 002") &&
      lawDoc.includes("FOUNDATION LAW 003") &&
      lawDoc.includes("FOUNDATION LAW 004");
    const processLanguage =
      facadeSrc.includes("PlanWeeklyOrder") &&
      !facadeSrc.includes("CreateOrder") &&
      facadeSrc.includes("Never exposes Supabase");
    const ok =
      publicExportsOk && uiPathOk && lawPresent && processLanguage;
    record({
      id: "V17",
      name: "Foundation Law compliance",
      expected:
        "public API = Facade only · Laws 002–004 · process language · no CRUD",
      observed: `publicExportsOk=${publicExportsOk} uiPathOk=${uiPathOk} lawPresent=${lawPresent} processLanguage=${processLanguage}`,
      evidence: "index.ts · useOrder.ts · FOUNDATION_LOCK.md · OrderFacade.ts",
      verdict: ok ? "PASS" : "FAIL",
    });
  });
});
