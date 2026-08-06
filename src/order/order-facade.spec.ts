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
  getOrderQuery,
  searchOrdersQuery,
} from "./OrderQueries";
import type { OrderRuntimeIdentity } from "./orderServiceContext";
import type { ServiceContext } from "@/services/types";
import type { OperationalOrderListItem } from "@/modules/operations";

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

describe("OrderFacade process API", () => {
  afterEach(() => {
    resetOrderFacade();
  });

  it("PlanWeeklyOrder composes OrderIntakeService.intakeDraft", async () => {
    const intakeDraft = vi.fn(async () => ({
      order: { id: "o1", status: "draft" },
      items: [],
    }));
    const getOrder = vi.fn(async () => listItem({ status: "draft" }));
    const facade = new OrderFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      intake: { intakeDraft } as never,
      orders: {} as never,
      operations: { getOrder } as never,
    });

    const result = await facade.planWeeklyOrder(
      identity(),
      planWeeklyOrderCommand({
        weekStart: "2026-08-03",
        items: [{ dishId: "d1", dayDate: "2026-08-05", qty: 1 }],
      }),
    );

    expect(intakeDraft).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
    expect(result.orderId).toBe("o1");
    expect(result.status).toBe("draft");
  });

  it("ConfirmOrder composes OrderService.confirm", async () => {
    const confirm = vi.fn(async () => ({ id: "o1", status: "confirmed" }));
    const getOrder = vi.fn(async () => listItem({ status: "confirmed" }));
    const facade = new OrderFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      intake: {} as never,
      orders: { confirm } as never,
      operations: { getOrder } as never,
    });

    const result = await facade.confirmOrder(
      identity(),
      confirmOrderCommand({ orderId: "o1" }),
    );
    expect(confirm).toHaveBeenCalledWith(expect.anything(), "o1");
    expect(result.ok).toBe(true);
    expect(result.status).toBe("confirmed");
  });

  it("ScheduleProduction / ReadyForKitchen / ReadyForDelivery compose OperationsService", async () => {
    const startProduction = vi.fn(async () => "in_production");
    const completeProduction = vi.fn(async () => "prepared");
    const transitionKitchen = vi.fn(async () => "ready_for_delivery");
    const getOrder = vi.fn(async () =>
      listItem({ status: "ready_for_delivery" }),
    );
    const facade = new OrderFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      intake: {} as never,
      orders: {} as never,
      operations: {
        startProduction,
        completeProduction,
        transitionKitchen,
        getOrder,
      } as never,
    });

    expect(
      (
        await facade.scheduleProduction(
          identity(),
          scheduleProductionCommand({ orderId: "o1" }),
        )
      ).status,
    ).toBe("in_production");
    expect(
      (
        await facade.readyForKitchen(
          identity(),
          readyForKitchenCommand({ orderId: "o1" }),
        )
      ).status,
    ).toBe("prepared");
    expect(
      (
        await facade.readyForDelivery(
          identity(),
          readyForDeliveryCommand({ orderId: "o1" }),
        )
      ).status,
    ).toBe("ready_for_delivery");
  });

  it("CompleteDelivery advances ready → out → delivered", async () => {
    const getOrder = vi
      .fn()
      .mockResolvedValueOnce(listItem({ status: "ready_for_delivery" }))
      .mockResolvedValue(listItem({ status: "delivered" }));
    const transitionDelivery = vi
      .fn()
      .mockResolvedValueOnce("out_for_delivery")
      .mockResolvedValueOnce("delivered");
    const facade = new OrderFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      intake: {} as never,
      orders: {} as never,
      operations: { getOrder, transitionDelivery } as never,
    });

    const result = await facade.completeDelivery(
      identity(),
      completeDeliveryCommand({ orderId: "o1" }),
    );
    expect(transitionDelivery).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    expect(result.status).toBe("delivered");
  });

  it("CancelOrder / CloseOrder return expected UNIMPLEMENTED", async () => {
    const facade = new OrderFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      intake: {} as never,
      orders: {} as never,
      operations: {} as never,
    });
    const cancel = await facade.cancelOrder(
      identity(),
      cancelOrderCommand({ orderId: "o1" }),
    );
    const close = await facade.closeOrder(
      identity(),
      closeOrderCommand({ orderId: "o1" }),
    );
    expect(cancel.errors[0]?.code).toBe("UNIMPLEMENTED");
    expect(close.errors[0]?.code).toBe("UNIMPLEMENTED");
  });

  it("GetOrder / SearchOrders / GetKitchenQueue map summaries", async () => {
    const row = listItem();
    const facade = new OrderFacade({
      resolveContext: async () => ({ ok: true, ctx: ctx() }),
      intake: {} as never,
      orders: {} as never,
      operations: {
        getOrder: vi.fn(async () => row),
        listKitchenOrders: vi.fn(async () => [row]),
        listDeliveryOrders: vi.fn(async () => []),
      } as never,
    });

    const got = await facade.getOrder(
      identity(),
      getOrderQuery({ orderId: "o1" }),
    );
    expect(got.ok).toBe(true);
    expect(got.context?.details.summary.partyRef.displayName).toBe("María");

    const search = await facade.searchOrders(
      identity(),
      searchOrdersQuery({ weekStart: "2026-08-03" }),
    );
    expect(search.summaries).toHaveLength(1);

    const queue = await facade.getKitchenQueue(
      identity(),
      getKitchenQueueQuery({}),
    );
    expect(queue.ok).toBe(true);
    expect(queue.summaries[0]?.id).toBe("o1");
  });

  it("rejects without session", async () => {
    const facade = new OrderFacade({
      resolveContext: async () => ({
        ok: false,
        error: {
          code: "PERMISSION_DENIED",
          message: "Authenticated session required for Order operations",
          recoverable: true,
        },
      }),
    });
    const result = await facade.searchOrders(
      identity({ session: { present: false, userId: null } }),
      searchOrdersQuery({}),
    );
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("PERMISSION_DENIED");
  });
});
