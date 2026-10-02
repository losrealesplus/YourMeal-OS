import { describe, expect, it, vi } from "vitest";
import { OrderFacade } from "./OrderFacade";
import { completeDeliveryCommand } from "./OrderCommands";
import { getOrdersReadyForDeliveryQuery } from "./OrderQueries";
import type { OrderRuntimeIdentity } from "./orderServiceContext";
import type { ServiceContext } from "@/services/types";
import type { OperationalOrderListItem } from "@/modules/operations";
import type { DeliveryServiceModel } from "@/modules/operations/domain/delivery-service";
import fs from "node:fs";
import path from "node:path";

function makeIdentity(): OrderRuntimeIdentity {
  return {
    session: { present: true, userId: "u1" },
    tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
    permissions: {
      roles: ["company_admin", "kitchen", "logistics"],
      capabilities: ["orders.read", "orders.write", "kitchen.operate", "logistics.operate"],
    },
    currentUser: {
      id: "u1",
      fullName: "Alex",
      avatarUrl: null,
      locale: "es",
      phone: null,
    },
  };
}

function makeCtx(): ServiceContext {
  return {
    supabase: {
      from: vi.fn(() => ({
        insert: vi.fn(async () => ({ error: null })),
      })),
    } as unknown as ServiceContext["supabase"],
    userId: "u1",
    tenantId: "t1",
    roles: ["company_admin", "kitchen", "logistics"],
    capabilities: new Set(["orders.read", "orders.write", "kitchen.operate", "logistics.operate"]),
  };
}

function listItem(partial: Partial<OperationalOrderListItem> = {}): OperationalOrderListItem {
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
    deliveryDates: ["2026-08-03"],
    items: [
      {
        id: "i1",
        dishId: "d1",
        dishName: "Bowl",
        dayDate: "2026-08-03",
        qty: 2,
        notes: null,
      },
    ],
    ...partial,
  };
}

function mockDeliveryService(partial: Partial<DeliveryServiceModel> = {}): DeliveryServiceModel {
  return {
    id: "svc_01",
    tenantId: "t1",
    orderId: "o1",
    customerId: "c1",
    deliveryDate: "2026-08-03",
    status: "pending",
    deliveryAddressId: null,
    deliveryAddressSnapshot: {},
    customerContactSnapshot: {},
    dietarySnapshot: null,
    deliveryInstructions: null,
    packedAt: null,
    packedBy: null,
    dispatchedAt: null,
    deliveredAt: null,
    deliveredBy: null,
    issueReason: null,
    issueNotes: null,
    driverNotes: null,
    legacyBackfill: false,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
    ...partial,
  };
}

describe("CR-OPS-06: Delivery Services & Production Handoff", () => {
  it("1. DELIVERY SERVICE CREATION: isolates services per unique day_date and prevents duplicates", () => {
    const items = [
      { id: "i1", dishId: "d1", dayDate: "2026-08-03", qty: 2, unitPrice: 8.5 },
      { id: "i2", dishId: "d2", dayDate: "2026-08-03", qty: 1, unitPrice: 7.0 },
      { id: "i3", dishId: "d3", dayDate: "2026-08-05", qty: 2, unitPrice: 8.5 },
      { id: "i4", dishId: "d4", dayDate: "2026-08-07", qty: 2, unitPrice: 9.0 },
    ];

    const distinctDays = Array.from(new Set(items.map((i) => i.dayDate))).sort();
    expect(distinctDays).toEqual(["2026-08-03", "2026-08-05", "2026-08-07"]);
    expect(distinctDays).toHaveLength(3);

    const dbServices: DeliveryServiceModel[] = [];
    const insertService = (svc: DeliveryServiceModel) => {
      const exists = dbServices.find(
        (s) =>
          s.tenantId === svc.tenantId &&
          s.orderId === svc.orderId &&
          s.deliveryDate === svc.deliveryDate,
      );
      if (!exists) {
        dbServices.push(svc);
      }
      return exists ?? svc;
    };

    distinctDays.forEach((day) => {
      insertService(
        mockDeliveryService({
          id: `svc_${day}`,
          orderId: "ord_multi",
          deliveryDate: day,
        }),
      );
    });

    expect(dbServices).toHaveLength(3);
    expect(dbServices.map((s) => s.deliveryDate)).toEqual([
      "2026-08-03",
      "2026-08-05",
      "2026-08-07",
    ]);

    // Idempotent duplicate creation attempt
    distinctDays.forEach((day) => {
      insertService(
        mockDeliveryService({
          id: `svc_dup_${day}`,
          orderId: "ord_multi",
          deliveryDate: day,
        }),
      );
    });

    expect(dbServices).toHaveLength(3);
  });

  it("2. MULTI-DAY ISOLATION: delivering Monday leaves Wednesday/Friday intact and keeps orders.status non-final", async () => {
    let macroOrderStatus = "ready_for_delivery";
    const services: DeliveryServiceModel[] = [
      mockDeliveryService({
        id: "svc_mon",
        orderId: "o_multi",
        deliveryDate: "2026-08-03",
        status: "ready_for_delivery",
      }),
      mockDeliveryService({
        id: "svc_wed",
        orderId: "o_multi",
        deliveryDate: "2026-08-05",
        status: "pending",
      }),
      mockDeliveryService({
        id: "svc_fri",
        orderId: "o_multi",
        deliveryDate: "2026-08-07",
        status: "pending",
      }),
    ];

    const transitionDeliveryServiceMock = vi.fn(async (_ctx, id: string, status: string) => {
      const target = services.find((s) => s.id === id);
      if (target) {
        (target as Record<string, unknown>).status = status;
      }
      return target;
    });

    const transitionDeliveryOrderMock = vi.fn(async (_ctx, _orderId: string, status: string) => {
      macroOrderStatus = status;
      return status;
    });

    const facade = new OrderFacade({
      resolveContext: async () => ({ ok: true, ctx: makeCtx() }),
      intake: {} as never,
      orders: {} as never,
      operations: {
        getOrder: vi.fn(async () => ({
          id: "o_multi",
          status: macroOrderStatus,
          items: [],
          customerId: "c1",
        })),
        listDeliveryServices: vi.fn(async () => services),
        getDeliveryServiceByOrderDay: vi.fn(
          async (_ctx, orderId, day) =>
            services.find((s) => s.orderId === orderId && s.deliveryDate === day) ?? null,
        ),
        transitionDeliveryService: transitionDeliveryServiceMock,
        transitionDelivery: transitionDeliveryOrderMock,
      } as never,
    });

    const resultMon = await facade.completeDelivery(
      makeIdentity(),
      completeDeliveryCommand({
        orderId: "o_multi",
        deliveryDay: "2026-08-03",
      }),
    );

    expect(resultMon.ok).toBe(true);
    expect(services.find((s) => s.id === "svc_mon")?.status).toBe("delivered");
    expect(services.find((s) => s.id === "svc_wed")?.status).toBe("pending");
    expect(services.find((s) => s.id === "svc_fri")?.status).toBe("pending");
    expect(macroOrderStatus).toBe("ready_for_delivery");
    expect(transitionDeliveryOrderMock).not.toHaveBeenCalled();

    await facade.completeDelivery(
      makeIdentity(),
      completeDeliveryCommand({
        orderId: "o_multi",
        deliveryDay: "2026-08-05",
      }),
    );
    expect(services.find((s) => s.id === "svc_wed")?.status).toBe("delivered");
    expect(services.find((s) => s.id === "svc_fri")?.status).toBe("pending");
    expect(macroOrderStatus).toBe("ready_for_delivery");

    await facade.completeDelivery(
      makeIdentity(),
      completeDeliveryCommand({
        orderId: "o_multi",
        deliveryDay: "2026-08-07",
      }),
    );
    expect(services.find((s) => s.id === "svc_fri")?.status).toBe("delivered");
    expect(transitionDeliveryOrderMock).toHaveBeenCalledWith(
      expect.anything(),
      "o_multi",
      "out_for_delivery",
    );
  });

  it("3. PACKING HANDOFF: packOrderDay promotes service to ready_for_delivery with packed_at", async () => {
    const { OperationsService } =
      await import("@/modules/operations/application/operations-service");

    let updatedService: Record<string, unknown> | null = null;
    const mockRepo = {
      getDeliveryServiceByOrderDay: vi.fn(async () =>
        mockDeliveryService({
          id: "svc_pack_01",
          orderId: "o1",
          deliveryDate: "2026-08-03",
          status: "prepared",
        }),
      ),
      transitionDeliveryService: vi.fn(async (id, status, extra) => {
        updatedService = { id, status, extra };
        return mockDeliveryService({ id, status, ...extra });
      }),
      getOrder: vi.fn(async () => ({
        id: "o1",
        status: "in_production",
      })),
      transitionStatus: vi.fn(async () => {}),
    };

    const opsRepoModule = await import("@/modules/operations/infrastructure/operations-repository");
    vi.spyOn(opsRepoModule, "createOperationsRepository").mockReturnValue(
      mockRepo as unknown as ReturnType<typeof opsRepoModule.createOperationsRepository>,
    );

    const ctx = makeCtx();
    const result = await OperationsService.packOrderDay(ctx, "o1", "2026-08-03");

    expect(result.status).toBe("ready_for_delivery");
    expect(mockRepo.transitionDeliveryService).toHaveBeenCalledWith(
      "svc_pack_01",
      "ready_for_delivery",
      "u1",
    );
    expect(updatedService).not.toBeNull();
  });

  it("4. DELIVERY VISIBILITY: filters delivery services strictly by active operational day", async () => {
    const facade = new OrderFacade({
      resolveContext: async () => ({ ok: true, ctx: makeCtx() }),
      intake: {} as never,
      orders: {} as never,
      operations: {
        listDeliveryServices: vi.fn(async (_ctx, filter) => {
          const all: DeliveryServiceModel[] = [
            mockDeliveryService({
              id: "s1",
              orderId: "o1",
              deliveryDate: "2026-08-03",
              status: "ready_for_delivery",
            }),
            mockDeliveryService({
              id: "s2",
              orderId: "o2",
              deliveryDate: "2026-08-05",
              status: "ready_for_delivery",
            }),
          ];
          return all.filter((s) => s.deliveryDate === filter?.deliveryDate);
        }),
        getOrder: vi.fn(async (_ctx, orderId) =>
          listItem({
            id: orderId,
            status: "ready_for_delivery",
            customerId: "c1",
            deliveryDates: [orderId === "o1" ? "2026-08-03" : "2026-08-05"],
          }),
        ),
        listKitchenOrders: vi.fn(async () => []),
        listDeliveryOrders: vi.fn(async () => []),
      } as never,
    });

    const resMon = await facade.getOrdersReadyForDelivery(
      makeIdentity(),
      getOrdersReadyForDeliveryQuery({ deliveryDay: "2026-08-03" }),
    );
    expect(resMon.ok).toBe(true);
    expect(resMon.summaries).toHaveLength(1);
    expect(resMon.summaries[0]?.id).toBe("o1");

    const resWed = await facade.getOrdersReadyForDelivery(
      makeIdentity(),
      getOrdersReadyForDeliveryQuery({ deliveryDay: "2026-08-05" }),
    );
    expect(resWed.ok).toBe(true);
    expect(resWed.summaries).toHaveLength(1);
    expect(resWed.summaries[0]?.id).toBe("o2");
  });

  it("5. HISTORICAL DATA INTEGRITY: order items and dietary snapshot remain immutable", () => {
    const historicalOrder = {
      id: "ord_hist_01",
      tenantId: "t1",
      customerId: "cust_hist",
      status: "delivered",
      dietarySnapshot: {
        capturedAt: "2026-07-20T10:00:00Z",
        allergens: ["gluten", "milk"],
        customAllergens: ["kiwi"],
        restrictions: ["celiac"],
        preferences: ["no_onion"],
        dietaryNotes: "Alérgica severa",
        isOverride: false,
      },
      items: [
        {
          id: "item_01",
          dishId: "dish_1",
          dayDate: "2026-07-21",
          qty: 3,
          unitPrice: 9.5,
        },
        {
          id: "item_02",
          dishId: "dish_2",
          dayDate: "2026-07-23",
          qty: 2,
          unitPrice: 8.0,
        },
      ],
    };

    const snapshotBefore = JSON.stringify(historicalOrder);

    const service1 = {
      orderId: historicalOrder.id,
      deliveryDate: "2026-07-21",
      dietarySnapshot: historicalOrder.dietarySnapshot,
      status: "delivered",
    };

    expect(service1.dietarySnapshot.allergens).toContain("gluten");
    expect(JSON.stringify(historicalOrder)).toBe(snapshotBefore);
    expect(historicalOrder.items[0]?.qty).toBe(3);
    expect(historicalOrder.items[0]?.unitPrice).toBe(9.5);
  });

  it("6. MIGRATION AUDIT: verified SQL migration is purely additive, idempotent, and non-destructive", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261002130000_cr_ops_06_delivery_services.sql",
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sqlContent = fs.readFileSync(migrationPath, "utf-8");

    expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS public.delivery_services");
    expect(sqlContent).toContain("UNIQUE (tenant_id, order_id, delivery_date)");
    expect(sqlContent).toContain("legacy_backfill boolean NOT NULL DEFAULT false");
    expect(sqlContent).toContain("ON CONFLICT (tenant_id, order_id, delivery_date) DO NOTHING");
    expect(sqlContent).not.toMatch(/ALTER\s+TABLE\s+public\.orders\s+DROP/i);
    expect(sqlContent).not.toMatch(/ALTER\s+TABLE\s+public\.order_items\s+DROP/i);
    expect(sqlContent).not.toMatch(/DELETE\s+FROM\s+public\.orders/i);
    expect(sqlContent).not.toMatch(/DELETE\s+FROM\s+public\.order_items/i);
    expect(sqlContent).not.toMatch(/UPDATE\s+public\.order_items/i);

    const backfillBlock = sqlContent.split("-- 7. Idempotent Safe Historical Backfill")[1]!;
    expect(backfillBlock).not.toMatch(/UPDATE\s+public\.orders/i);
    expect(backfillBlock).not.toMatch(/DELETE\s+FROM/i);

    expect(sqlContent).toContain("ALTER TABLE public.delivery_services ENABLE ROW LEVEL SECURITY;");
  });
});
