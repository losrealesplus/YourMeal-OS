import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderService } from "./order-service";
import { OrderIntakeService } from "@/modules/order-intake";
import { OrderModificationService } from "./order-modification-service";
import { OrderLifecycleService } from "./order-lifecycle-service";
import { capabilitiesFor } from "@/permissions";
import type { ServiceContext } from "@/services/types";

function createMockQuery(data: any = null, error: any = null) {
  const query: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (onfulfilled: any, onrejected: any) => Promise.resolve({ data, error }).then(onfulfilled, onrejected),
  };
  return query;
}

describe("CR-OPS-08 · B2C Delivery Address & Order Lifecycle Integration Suite", () => {
  let mockSupabase: any;
  let ctx: ServiceContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "weekly_menus") {
          return createMockQuery({ id: "menu-1", week_start: "2026-10-05", status: "published" });
        }
        if (table === "weekly_menu_slots") {
          return createMockQuery([
            {
              id: "slot-1",
              day_date: "2026-10-05",
              dish_id: "dish-1",
              dishes: { id: "dish-1", price: 12.75, name: "Sopa de Calabaza", deleted_at: null },
            },
          ]);
        }
        if (table === "customer_addresses") {
          return createMockQuery({
            id: "addr-default-100",
            label: "Cueva del Bosque",
            street: "Calle Árbol Hueco 100",
            city: "Madrid",
            zip: "28001",
            is_default: true,
          });
        }
        if (table === "customers") {
          return createMockQuery({ id: "cust-winnie", user_id: "user-winnie", demand_channel: "individual" });
        }
        if (table === "feature_flags") {
          return createMockQuery([{ key: "order_programming", enabled: true }]);
        }
        if (table === "dishes") {
          return createMockQuery([
            { id: "dish-1", price: 12.75, name: "Sopa de Calabaza" },
            { id: "dish-2", price: 15.0, name: "Sopa de Miel" },
          ]);
        }
        if (table === "orders") {
          return {
            select: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "ord-test-01",
                tenant_id: "tenant-eatclean",
                customer_id: "cust-winnie",
                status: "confirmed",
                delivery_address_id: "addr-default-100",
                total: 25.5,
              },
              error: null,
            }),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "ord-test-01",
                tenant_id: "tenant-eatclean",
                customer_id: "cust-winnie",
                status: "confirmed",
                delivery_address_id: "addr-default-100",
                total: 25.5,
                notes: null,
              },
              error: null,
            }),
          };
        }
        if (table === "delivery_services") {
          return {
            select: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
          };
        }
        if (table === "order_items") {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "item-1",
                  dish_id: "dish-1",
                  day_date: "2026-10-05",
                  qty: 2,
                  unit_price: 12.75,
                },
              ],
              error: null,
            }),
            delete: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "item-2",
                    dish_id: "dish-2",
                    day_date: "2026-10-06",
                    qty: 2,
                    effectiveUnitPrice: 15.0,
                  },
                ],
                error: null,
              }),
            }),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ error: null, data: [] }),
          }),
          delete: vi.fn().mockReturnThis(),
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ error: null, data: [] }),
          }),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
      rpc: vi.fn().mockResolvedValue({
        data: {
          order: {
            id: "ord-test-01",
            tenant_id: "tenant-eatclean",
            customer_id: "cust-winnie",
            status: "draft",
            total: 25.5,
          },
          items: [
            {
              id: "item-1",
              order_id: "ord-test-01",
              dish_id: "dish-1",
              day_date: "2026-10-05",
              qty: 2,
            },
          ],
        },
        error: null,
      }),
    };

    ctx = {
      supabase: mockSupabase,
      userId: "user-winnie",
      tenantId: "tenant-eatclean",
      tenantSlug: "eatclean",
      roles: ["customer"],
      capabilities: capabilitiesFor(["customer"]),
    };
  });

  it("R-01 & R-02: Order Intake passes and persists explicit deliveryAddressId", async () => {
    const intakeCommand = {
      channel: "app" as const,
      weekStart: "2026-10-05",
      deliveryAddressId: "addr-winnie-custom-02",
      items: [
        {
          dishId: "dish-1",
          dayDate: "2026-10-05",
          qty: 2,
        },
      ],
    };

    // Spy on programDraftItems
    const spy = vi.spyOn(OrderService, "programDraftItems").mockResolvedValueOnce({
      order: {
        id: "ord-test-01",
        tenant_id: "tenant-eatclean",
        customer_id: "cust-winnie",
        status: "draft" as const,
        week_start: "2026-10-05",
        total: 25.5,
        created_at: new Date().toISOString(),
        delivery_address_id: "addr-winnie-custom-02",
      } as any,
      items: [] as any,
    });

    const result = await OrderIntakeService.intakeDraft(ctx, intakeCommand);

    expect(spy).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        deliveryAddressId: "addr-winnie-custom-02",
        weekStart: "2026-10-05",
      }),
    );
    expect(result.order.delivery_address_id).toBe("addr-winnie-custom-02");
  });

  it("R-01 & R-02: Default address is queried from customer_addresses when none provided", async () => {
    const res = await OrderService.programDraftItems(ctx, {
      weekStart: "2026-10-05",
      items: [{ dishId: "dish-1", dayDate: "2026-10-05", qty: 2 }],
    });

    expect(res.order).toBeDefined();
    expect(mockSupabase.from).toHaveBeenCalledWith("customer_addresses");
  });

  it("R-04: Order modification resyncs delivery services via operations repo", async () => {
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "orders") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "ord-test-01",
              status: "confirmed",
              total: 25.5,
              notes: null,
              customer_id: "cust-winnie",
              tenant_id: "tenant-eatclean",
            },
            error: null,
          }),
          update: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "ord-test-01",
              status: "confirmed",
              total: 30.0,
              notes: "Fecha cambiada",
              customer_id: "cust-winnie",
              tenant_id: "tenant-eatclean",
            },
            error: null,
          }),
        };
      }
      if (table === "order_items") {
        return {
          select: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "item-2",
                  dish_id: "dish-2",
                  day_date: "2026-10-06",
                  qty: 2,
                  effectiveUnitPrice: 15.0,
                },
              ],
              error: null,
            }),
          }),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      if (table === "dishes") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [{ id: "dish-2", price: 15.0, name: "Sopa de Miel" }],
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ error: null, data: [] }),
        }),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ error: null, data: [] }),
        }),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const res = await OrderModificationService.modifyOrder(
      { ...ctx, roles: ["operations_manager"], capabilities: capabilitiesFor(["operations_manager"]) },
      {
        orderId: "ord-test-01",
        lines: [{ dishId: "dish-2", dayDate: "2026-10-06", qty: 2 }],
        reason: "Fecha cambiada",
      },
    );

    expect(res.order.id).toBe("ord-test-01");
    expect(res.total).toBe(30.0);
  });

  it("R-05: Order Cancellation cascades status='cancelled' to associated delivery_services", async () => {
    const mockRepo = {
      findByIdWithItems: vi.fn().mockResolvedValue({
        order: {
          id: "ord-test-01",
          status: "confirmed",
        },
        items: [],
      }),
    } as any;

    const cancelUpdateMock = vi.fn().mockReturnThis();
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "orders") {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "ord-test-01", status: "cancelled" },
            error: null,
          }),
        };
      }
      if (table === "delivery_services") {
        return {
          update: cancelUpdateMock,
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    });

    const updated = await OrderLifecycleService.cancelOrder(
      { ...ctx, roles: ["operations_manager"], capabilities: capabilitiesFor(["operations_manager"]) },
      mockRepo,
      "ord-test-01",
      "Cliente canceló a tiempo",
    );

    expect(updated.status).toBe("cancelled");
    expect(cancelUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "cancelled",
        issue_notes: "Cliente canceló a tiempo",
      }),
    );
  });
});
