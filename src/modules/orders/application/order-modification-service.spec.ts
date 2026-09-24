import { describe, expect, it, vi, beforeEach } from "vitest";
import { DomainError } from "@/domain/errors";
import {
  OrderModificationService,
  type ModifyConfirmedOrderDTO,
} from "./order-modification-service";
import { AuditService } from "@/services/audit-service";
import type { ServiceContext } from "@/services/types";

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn(async () => undefined),
  },
}));

vi.mock("@/modules/dish-library/infrastructure/dish-repository", () => ({
  createDishRepository: () => ({
    listCatalogByIds: vi.fn(async (ids: string[]) => {
      const mockCatalog: Record<string, { id: string; name: string; price: number }> = {
        "dish-pollo": { id: "dish-pollo", name: "Pollo Teriyaki", price: 11.9 },
        "dish-salmon": { id: "dish-salmon", name: "Salmón al Horno", price: 14.5 },
        "dish-quinoa": { id: "dish-quinoa", name: "Quinoa con Verduras", price: 9.0 },
      };
      return ids.map((id) => mockCatalog[id]).filter(Boolean);
    }),
  }),
}));

function createMockSupabase(initialData: {
  orders?: any[];
  orderItems?: any[];
} = {}) {
  const store = {
    orders: initialData.orders ?? [
      {
        id: "order-1042",
        tenant_id: "tenant-eatclean",
        customer_id: "cust-1",
        week_start: "2026-09-28",
        total: 23.8,
        notes: "Entregar por la tarde",
        status: "confirmed",
        deleted_at: null,
      },
    ],
    order_items: initialData.orderItems ?? [
      {
        id: "item-101",
        tenant_id: "tenant-eatclean",
        order_id: "order-1042",
        dish_id: "dish-pollo",
        day_date: "2026-09-29",
        qty: 2,
        comment: "Normal",
        deleted_at: null,
      },
    ],
  };

  const client = {
    from: (table: string) => {
      let currentTable = table;
      let filters: Array<(row: any) => boolean> = [];
      let updatePayload: any = null;
      let insertedPayload: any = null;

      const queryBuilder = {
        select: (_fields = "*") => queryBuilder,
        eq: (col: string, val: any) => {
          filters.push((row) => row[col] === val);
          return queryBuilder;
        },
        is: (col: string, val: any) => {
          filters.push((row) => (val === null ? row[col] == null : row[col] === val));
          return queryBuilder;
        },
        update: (payload: any) => {
          updatePayload = payload;
          return queryBuilder;
        },
        delete: () => {
          // Remove filtered rows
          (store as any)[currentTable] = ((store as any)[currentTable] || []).filter(
            (r: any) => !filters.every((f) => f(r)),
          );
          return queryBuilder;
        },
        insert: (payload: any) => {
          insertedPayload = payload;
          return queryBuilder;
        },
        single: async () => {
          if (updatePayload) {
            const idx = ((store as any)[currentTable] || []).findIndex((r: any) =>
              filters.every((f) => f(r)),
            );
            if (idx !== -1) {
              (store as any)[currentTable][idx] = {
                ...(store as any)[currentTable][idx],
                ...updatePayload,
              };
              return { data: (store as any)[currentTable][idx], error: null };
            }
          }
          const items = ((store as any)[currentTable] || []).filter((r: any) =>
            filters.every((f) => f(r)),
          );
          return { data: items[0] ?? null, error: null };
        },
        maybeSingle: async () => {
          const items = ((store as any)[currentTable] || []).filter((r: any) =>
            filters.every((f) => f(r)),
          );
          return { data: items[0] ?? null, error: null };
        },
        then: (resolve: (val: any) => any) => {
          if (insertedPayload) {
            const rows = Array.isArray(insertedPayload)
              ? insertedPayload.map((p) => ({
                  id: `${currentTable.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  ...p,
                }))
              : [{
                  id: `${currentTable.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  ...insertedPayload,
                }];
            (store as any)[currentTable]?.push(...rows);
            return Promise.resolve({ data: rows, error: null }).then(resolve);
          }
          const items = ((store as any)[currentTable] || []).filter((r: any) =>
            filters.every((f) => f(r)),
          );
          return Promise.resolve({ data: items, error: null }).then(resolve);
        },
      };

      return queryBuilder;
    },
  };

  return { client, store };
}

function mockCtx(overrides: Partial<ServiceContext> = {}, mockSupa?: any): ServiceContext {
  return {
    supabase: (mockSupa?.client ?? createMockSupabase().client) as any,
    userId: "staff-editor-1",
    tenantId: "tenant-eatclean",
    roles: ["operations_manager"],
    capabilities: new Set(["orders.write"]),
    localization: null,
    ip: "127.0.0.1",
    ...overrides,
  };
}

describe("OPS-01 G3 — OrderModificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails if user lacks orders.write capability", async () => {
    const ctx = mockCtx({ roles: ["kitchen"], capabilities: new Set() });
    const dto: ModifyConfirmedOrderDTO = {
      orderId: "order-1042",
      lines: [{ dayDate: "2026-09-29", dishId: "dish-pollo", qty: 2 }],
    };

    await expect(OrderModificationService.modifyOrder(ctx, dto)).rejects.toThrow();
  });

  it("fails if order does not exist in tenant", async () => {
    const ctx = mockCtx();
    const dto: ModifyConfirmedOrderDTO = {
      orderId: "non-existent-order",
      lines: [{ dayDate: "2026-09-29", dishId: "dish-pollo", qty: 2 }],
    };

    await expect(OrderModificationService.modifyOrder(ctx, dto)).rejects.toBeInstanceOf(DomainError);
  });

  it("modifies confirmed order, updates total, updates culinary comments and writes audit", async () => {
    const mockSupa = createMockSupabase();
    const ctx = mockCtx({}, mockSupa);

    const dto: ModifyConfirmedOrderDTO = {
      orderId: "order-1042",
      reason: "Cliente llamó para añadir 1 salmón y pedir pollo sin cebolla",
      orderNotes: "Dejar con el portero",
      lines: [
        { dayDate: "2026-09-29", dishId: "dish-pollo", qty: 2, comment: "⚠️ SIN CEBOLLA" },
        { dayDate: "2026-09-30", dishId: "dish-salmon", qty: 1, comment: "⭐ SALSA APARTE" },
      ],
    };

    const res = await OrderModificationService.modifyOrder(ctx, dto);

    // New total: 2 * 11.90 + 1 * 14.50 = 38.30
    expect(res.total).toBe(38.3);
    expect(res.order.total).toBe(38.3);
    expect(res.order.notes).toBe("Dejar con el portero");
    expect(res.items.length).toBe(2);
    expect(res.items[0].comment).toBe("⚠️ SIN CEBOLLA");
    expect(res.items[1].comment).toBe("⭐ SALSA APARTE");
    expect(res.auditWritten).toBe(true);

    // Verify AuditService was called with old and new snapshots
    expect(AuditService.write).toHaveBeenCalledTimes(1);
    expect(AuditService.write).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        entityType: "order",
        entityId: "order-1042",
        action: "update",
        oldData: expect.objectContaining({ total: 23.8 }),
        newData: expect.objectContaining({
          total: 38.3,
          modificationReason: "Cliente llamó para añadir 1 salmón y pedir pollo sin cebolla",
        }),
      }),
    );
  });

  it("applies order-scoped unitPriceOverride on modification without altering catalog", async () => {
    const mockSupa = createMockSupabase();
    const ctx = mockCtx({}, mockSupa);

    const dto: ModifyConfirmedOrderDTO = {
      orderId: "order-1042",
      lines: [
        // Pollo catalog price 11.90 overridden to 10.00
        { dayDate: "2026-09-29", dishId: "dish-pollo", qty: 3, unitPriceOverride: 10.0 },
      ],
    };

    const res = await OrderModificationService.modifyOrder(ctx, dto);

    expect(res.total).toBe(30.0); // 3 * 10.00
    expect(res.order.total).toBe(30.0);
  });
});
