import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DeliveryFacade,
  resetDeliveryFacade,
} from "./DeliveryFacade";
import {
  assignDeliveryCommand,
  closeDeliveryCommand,
  confirmDeliveryCommand,
  reportDeliveryExceptionCommand,
  startDeliveryCommand,
} from "./DeliveryCommands";
import {
  getCompletedDeliveriesQuery,
  getDeliveryAssignmentsQuery,
  getDeliveryContextQuery,
  getDeliveryRoutesQuery,
} from "./DeliveryQueries";
import type { DeliveryRuntimeIdentity } from "./deliveryServiceContext";
import type { OrderFacade } from "@/order/OrderFacade";
import type { OrderSummary } from "@/order/OrderContext";
import type { KitchenExecutionFacade } from "@/kitchen/KitchenExecutionFacade";

function identity(
  partial: Partial<DeliveryRuntimeIdentity> = {},
): DeliveryRuntimeIdentity {
  return {
    session: { present: true, userId: "u1" },
    tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
    permissions: {
      roles: ["logistics", "company_admin"],
      capabilities: ["logistics.operate", "orders.read", "orders.write"],
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

function summary(partial: Partial<OrderSummary> = {}): OrderSummary {
  return {
    id: "o1",
    week: { weekStart: "2026-08-03" },
    status: "ready_for_delivery",
    demandChannel: "individual",
    orderSource: "app",
    partyRef: {
      kind: "individual",
      id: "c1",
      displayName: "Cliente Uno",
    },
    deliveryDayPrimary: "2026-08-06",
    itemCount: 2,
    total: 20,
    currency: "EUR",
    tenantId: "t1",
    ...partial,
  };
}

function mockOrders(overrides: Partial<OrderFacade> = {}): OrderFacade {
  return {
    getOrdersReadyForDelivery: vi.fn(async () => ({
      ok: true,
      summaries: [summary()],
      errors: [],
    })),
    completeDelivery: vi.fn(async () => ({
      ok: true,
      orderId: "o1",
      status: "delivered",
      context: null,
      errors: [],
    })),
    searchOrders: vi.fn(async () => ({
      ok: true,
      summaries: [summary({ status: "delivered" })],
      errors: [],
    })),
    ...overrides,
  } as unknown as OrderFacade;
}

function mockKitchen(
  overrides: Partial<KitchenExecutionFacade> = {},
): KitchenExecutionFacade {
  return {
    getCompletedExecution: vi.fn(async () => ({
      ok: true,
      context: null,
      errors: [],
    })),
    ...overrides,
  } as unknown as KitchenExecutionFacade;
}

describe("DeliveryFacade fulfillment API", () => {
  afterEach(() => {
    resetDeliveryFacade();
  });

  it("GetDeliveryContext composes OrderFacade — returns DeliveryAssignments not Orders", async () => {
    const orders = mockOrders();
    const facade = new DeliveryFacade({
      orders,
      kitchen: mockKitchen(),
    });
    const result = await facade.getDeliveryContext(
      identity(),
      getDeliveryContextQuery({ operationalDay: "2026-08-06" }),
    );
    expect(result.ok).toBe(true);
    expect(orders.getOrdersReadyForDelivery).toHaveBeenCalled();
    expect(result.context?.assignments[0]?.id).toBe("assignment:o1");
    expect(result.context?.assignments[0]?.commitmentRef).toBe("o1");
    expect(result.context?.assignments[0]?.status).toBe("Planned");
    expect(result.context?.stops[0]?.destinationLabel).toBe("Cliente Uno");
  });

  it("ConfirmDelivery composes OrderFacade.completeDelivery", async () => {
    const orders = mockOrders();
    const facade = new DeliveryFacade({
      orders,
      kitchen: mockKitchen(),
    });
    const result = await facade.confirmDelivery(
      identity(),
      confirmDeliveryCommand({
        operationalDay: "2026-08-06",
        assignmentId: "assignment:o1",
        note: "ok",
      }),
    );
    expect(result.ok).toBe(true);
    expect(orders.completeDelivery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "CompleteDelivery", orderId: "o1" }),
    );
    expect(result.confirmation?.outcome).toBe("success");
    expect(result.status).toBe("Confirmed");
  });

  it("AssignDelivery / StartDelivery / Exception / Close are UNIMPLEMENTED", async () => {
    const facade = new DeliveryFacade({
      orders: mockOrders(),
      kitchen: mockKitchen(),
    });
    const id = identity();
    for (const cmd of [
      assignDeliveryCommand({
        operationalDay: "2026-08-06",
        commitmentRef: "o1",
      }),
      startDeliveryCommand({
        operationalDay: "2026-08-06",
        assignmentId: "assignment:o1",
      }),
      reportDeliveryExceptionCommand({
        operationalDay: "2026-08-06",
        assignmentId: "assignment:o1",
        code: "REFUSED",
        message: "customer absent",
      }),
      closeDeliveryCommand({
        operationalDay: "2026-08-06",
        assignmentId: "assignment:o1",
      }),
    ]) {
      const result = await facade.execute(id, cmd);
      expect(result.ok).toBe(false);
      expect(result.errors[0]?.code).toBe("UNIMPLEMENTED");
    }
  });

  it("GetDeliveryRoutes is UNIMPLEMENTED", async () => {
    const facade = new DeliveryFacade({
      orders: mockOrders(),
      kitchen: mockKitchen(),
    });
    const result = await facade.getDeliveryRoutes(
      identity(),
      getDeliveryRoutesQuery({ operationalDay: "2026-08-06" }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("UNIMPLEMENTED");
  });

  it("GetCompletedDeliveries composes OrderFacade.searchOrders + Kitchen", async () => {
    const orders = mockOrders();
    const kitchen = mockKitchen();
    const facade = new DeliveryFacade({ orders, kitchen });
    const result = await facade.getCompletedDeliveries(
      identity(),
      getCompletedDeliveriesQuery({ operationalDay: "2026-08-06" }),
    );
    expect(result.ok).toBe(true);
    expect(orders.searchOrders).toHaveBeenCalled();
    expect(kitchen.getCompletedExecution).toHaveBeenCalled();
    expect(result.context?.assignments[0]?.status).toBe("Confirmed");
  });

  it("GetDeliveryAssignments filters by status", async () => {
    const facade = new DeliveryFacade({
      orders: mockOrders({
        getOrdersReadyForDelivery: vi.fn(async () => ({
          ok: true,
          summaries: [
            summary({ id: "o1", status: "ready_for_delivery" }),
            summary({ id: "o2", status: "out_for_delivery" }),
          ],
          errors: [],
        })),
      }),
      kitchen: mockKitchen(),
    });
    const result = await facade.getDeliveryAssignments(
      identity(),
      getDeliveryAssignmentsQuery({
        operationalDay: "2026-08-06",
        status: "InTransit",
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.context?.assignments).toHaveLength(1);
    expect(result.context?.assignments[0]?.commitmentRef).toBe("o2");
  });

  it("missing session → PERMISSION_DENIED", async () => {
    const facade = new DeliveryFacade({
      orders: mockOrders(),
      kitchen: mockKitchen(),
    });
    const result = await facade.getDeliveryContext(
      identity({ session: { present: false, userId: null } }),
      getDeliveryContextQuery({ operationalDay: "2026-08-06" }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("PERMISSION_DENIED");
  });

  it("source hygiene: composes OrderFacade + KitchenExecutionFacade · no supabase", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/delivery/DeliveryFacade.ts"),
      "utf8",
    );
    expect(src).toMatch(/OrderFacade/);
    expect(src).toMatch(/KitchenExecutionFacade/);
    expect(src).not.toMatch(/supabase|\.from\(/);
    expect(src).not.toMatch(/@\/modules\//);
    expect(src).not.toMatch(/ProductionFacade/);
  });
});
