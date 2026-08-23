import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  OrderService,
  clearOrderServiceIdempotencyForTests,
} from "@/modules/orders/application/order-service";
import { AuditService } from "@/services/audit-service";
import type { ServiceContext } from "@/services/types";

import type { OrderRow, OrderItemRow } from "@/modules/orders/infrastructure/order-repository";

vi.mock("@/services/feature-flag-service", () => ({
  FeatureFlagService: {
    isEnabled: vi.fn(async () => true),
  },
}));

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn(async () => undefined),
  },
}));

let insertDraftMock: ReturnType<typeof vi.fn>;

vi.mock("@/modules/weekly-menu/infrastructure/weekly-menu-repository", () => ({
  createWeeklyMenuRepository: vi.fn(() => ({
    findPublishedByWeekStart: vi.fn(async () => ({ id: "menu-01", week_start: "2026-08-31" })),
    listSlotsWithDishes: vi.fn(async () => [
      {
        day_date: "2026-08-31",
        dish_id: "dish-01",
        dishes: { id: "dish-01", name: "Dish 1", deleted_at: null },
      },
    ]),
  })),
}));

vi.mock("@/modules/dish-library/infrastructure/dish-repository", () => ({
  createDishRepository: vi.fn(() => ({
    listCatalogByIds: vi.fn(async () => [{ id: "dish-01", name: "Dish 1", price: 12.5 }]),
  })),
}));

vi.mock("@/modules/company-account/application/company-account-service", () => ({
  CompanyAccountService: {
    resolveOrderDemandContext: vi.fn(async () => ({
      demandChannel: "individual" as const,
      companyId: null,
      siteId: null,
      organizationalUnitId: null,
      deliveryGroupId: null,
    })),
    ensureIndividualCustomer: vi.fn(async () => "cust-01"),
  },
}));

vi.mock("@/modules/orders/infrastructure/order-repository", () => ({
  createOrderRepository: vi.fn(() => ({
    findCustomerIdForUser: vi.fn(async () => "cust-01"),
    insertDraft: insertDraftMock,
    findByIdWithItems: vi.fn(async () => null),
  })),
}));

function makeContext(tenantId: string, userId: string): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId,
    tenantId,
    roles: ["customer", "operations_manager"],
    capabilities: new Set(["orders.write", "orders.read"]),
    localization: null,
    ip: "127.0.0.1",
  };
}

describe("H1 — Order Idempotency & Mutation Integrity", () => {
  beforeEach(() => {
    clearOrderServiceIdempotencyForTests();
    vi.clearAllMocks();
    let orderCounter = 1;
    insertDraftMock = vi.fn(async (input) => ({
      order: {
        id: `ord-${orderCounter++}`,
        tenant_id: "tenant-1",
        customer_id: input.customerId,
        week_start: input.weekStart,
        total: input.total,
        status: "draft",
        created_at: new Date().toISOString(),
      } as unknown as OrderRow,
      items: input.items.map(
        (i: { dishId: string; dayDate: string; qty: number }, idx: number) => ({
          id: `item-${idx + 1}`,
          dish_id: i.dishId,
          day_date: i.dayDate,
          qty: i.qty,
        }),
      ) as unknown as OrderItemRow[],
    }));
  });

  it("1. Same request ID sequential retry resolves to the exact same order (0 duplicate writes)", async () => {
    const ctxA = makeContext("tenant-1", "user-1");
    const command = {
      weekStart: "2026-08-31",
      customerId: "cust-01",
      clientRequestId: "req-intent-101",
      items: [{ dishId: "dish-01", dayDate: "2026-08-31", qty: 2 }],
    };

    // First attempt
    const res1 = await OrderService.programDraftItems(ctxA, command);
    expect(res1.order.id).toBe("ord-1");
    expect(insertDraftMock).toHaveBeenCalledTimes(1);
    expect(AuditService.write).toHaveBeenCalledTimes(1);

    // Sequential retry of the same mutation intent
    const res2 = await OrderService.programDraftItems(ctxA, command);
    expect(res2.order.id).toBe("ord-1");
    // DB insert was NOT called a second time
    expect(insertDraftMock).toHaveBeenCalledTimes(1);
    // Audit write was NOT called a second time
    expect(AuditService.write).toHaveBeenCalledTimes(1);
  });

  it("2. Same request ID concurrent execution resolves to exactly 1 order", async () => {
    const ctxA = makeContext("tenant-1", "user-1");
    const command = {
      weekStart: "2026-08-31",
      customerId: "cust-01",
      clientRequestId: "req-intent-concurrent-999",
      items: [{ dishId: "dish-01", dayDate: "2026-08-31", qty: 2 }],
    };

    // Two simultaneous requests with identical clientRequestId
    const [resA, resB] = await Promise.all([
      OrderService.programDraftItems(ctxA, command),
      OrderService.programDraftItems(ctxA, command),
    ]);

    expect(resA.order.id).toBe(resB.order.id);
    expect(insertDraftMock).toHaveBeenCalledTimes(1);
    expect(AuditService.write).toHaveBeenCalledTimes(1);
  });

  it("3. Different request IDs create independent orders", async () => {
    const ctxA = makeContext("tenant-1", "user-1");

    const res1 = await OrderService.programDraftItems(ctxA, {
      weekStart: "2026-08-31",
      customerId: "cust-01",
      clientRequestId: "req-order-A",
      items: [{ dishId: "dish-01", dayDate: "2026-08-31", qty: 1 }],
    });

    const res2 = await OrderService.programDraftItems(ctxA, {
      weekStart: "2026-08-31",
      customerId: "cust-01",
      clientRequestId: "req-order-B",
      items: [{ dishId: "dish-01", dayDate: "2026-08-31", qty: 2 }],
    });

    expect(res1.order.id).toBe("ord-1");
    expect(res2.order.id).toBe("ord-2");
    expect(insertDraftMock).toHaveBeenCalledTimes(2);
    expect(AuditService.write).toHaveBeenCalledTimes(2);
  });

  it("4. Same request ID across different tenants creates isolated orders", async () => {
    const ctxTenant1 = makeContext("tenant-alpha", "user-alpha");
    const ctxTenant2 = makeContext("tenant-beta", "user-beta");

    const command1 = {
      weekStart: "2026-08-31",
      customerId: "cust-alpha",
      clientRequestId: "shared-request-key-123",
      items: [{ dishId: "dish-01", dayDate: "2026-08-31", qty: 1 }],
    };

    const command2 = {
      weekStart: "2026-08-31",
      customerId: "cust-beta",
      clientRequestId: "shared-request-key-123",
      items: [{ dishId: "dish-01", dayDate: "2026-08-31", qty: 1 }],
    };

    const resAlpha = await OrderService.programDraftItems(ctxTenant1, command1);
    const resBeta = await OrderService.programDraftItems(ctxTenant2, command2);

    expect(resAlpha.order.id).toBe("ord-1");
    expect(resBeta.order.id).toBe("ord-2");
    expect(insertDraftMock).toHaveBeenCalledTimes(2);
  });

  it("5. Verifies order items and pricing are never duplicated on retry", async () => {
    const ctxA = makeContext("tenant-1", "user-1");
    const command = {
      weekStart: "2026-08-31",
      customerId: "cust-01",
      clientRequestId: "req-item-check-777",
      items: [{ dishId: "dish-01", dayDate: "2026-08-31", qty: 3 }],
    };

    const res1 = await OrderService.programDraftItems(ctxA, command);
    const res2 = await OrderService.programDraftItems(ctxA, command);

    expect(res1.items).toHaveLength(1);
    expect(res2.items).toHaveLength(1);
    expect(res1.items[0].qty).toBe(3);
    expect(res2.items[0].qty).toBe(3);
  });
});
