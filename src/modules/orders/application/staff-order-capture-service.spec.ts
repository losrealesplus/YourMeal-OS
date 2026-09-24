import { describe, expect, it, vi, beforeEach } from "vitest";
import { DomainError } from "@/domain/errors";
import { StaffOrderCaptureService, type UniversalOrderCaptureDTO } from "./staff-order-capture-service";
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

function createMockSupabase() {
  const store = {
    customers: [
      { id: "cust-1", tenant_id: "tenant-eatclean", display_name: "Juan Pérez", deleted_at: null },
    ],
    customer_phones: [] as any[],
    customer_addresses: [] as any[],
    customer_preferences: [] as any[],
    orders: [] as any[],
    order_items: [] as any[],
  };

  const client = {
    from: (table: string) => {
      let currentTable = table;
      let filters: Array<(row: any) => boolean> = [];
      let selectFields: string | null = null;
      let insertedPayload: any = null;

      const queryBuilder = {
        select: (fields = "*") => {
          selectFields = fields;
          return queryBuilder;
        },
        eq: (col: string, val: any) => {
          filters.push((row) => row[col] === val);
          return queryBuilder;
        },
        is: (col: string, val: any) => {
          filters.push((row) => (val === null ? row[col] == null : row[col] === val));
          return queryBuilder;
        },
        insert: (payload: any) => {
          insertedPayload = payload;
          return queryBuilder;
        },
        delete: () => {
          return queryBuilder;
        },
        single: async () => {
          if (insertedPayload) {
            const row = {
              id: `${currentTable.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              created_at: new Date().toISOString(),
              ...insertedPayload,
            };
            (store as any)[currentTable]?.push(row);
            return { data: row, error: null };
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
                  created_at: new Date().toISOString(),
                  ...p,
                }))
              : [{
                  id: `${currentTable.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  created_at: new Date().toISOString(),
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
    userId: "staff-user-1",
    tenantId: "tenant-eatclean",
    roles: ["operations_manager"],
    capabilities: new Set(["orders.write"]),
    localization: null,
    ip: "127.0.0.1",
    ...overrides,
  };
}

describe("OPS-01 G1 — StaffOrderCaptureService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails if user lacks orders.write capability", async () => {
    const ctx = mockCtx({ roles: ["kitchen"], capabilities: new Set() });
    const dto: UniversalOrderCaptureDTO = {
      customer: { mode: "existing", customerId: "cust-1" },
      weekStart: "2026-09-28",
      lines: [{ dayDate: "2026-09-29", dishId: "dish-pollo", qty: 2 }],
    };

    await expect(StaffOrderCaptureService.captureOrder(ctx, dto)).rejects.toThrow();
  });

  it("validates weekStart format and requires non-empty lines", async () => {
    const ctx = mockCtx();

    await expect(
      StaffOrderCaptureService.captureOrder(ctx, {
        customer: { mode: "existing", customerId: "cust-1" },
        weekStart: "invalid-date",
        lines: [{ dayDate: "2026-09-29", dishId: "dish-pollo", qty: 2 }],
      }),
    ).rejects.toBeInstanceOf(DomainError);

    await expect(
      StaffOrderCaptureService.captureOrder(ctx, {
        customer: { mode: "existing", customerId: "cust-1" },
        weekStart: "2026-09-28",
        lines: [],
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("captures order for existing customer with catalog prices (draft mode)", async () => {
    const mockSupa = createMockSupabase();
    const ctx = mockCtx({}, mockSupa);

    const dto: UniversalOrderCaptureDTO = {
      customer: { mode: "existing", customerId: "cust-1" },
      weekStart: "2026-09-28",
      orderNotes: "Dejar en conserjería",
      autoConfirm: false,
      lines: [
        { dayDate: "2026-09-29", dishId: "dish-pollo", qty: 2, comment: "Sin cebolla" },
        { dayDate: "2026-09-30", dishId: "dish-salmon", qty: 1 },
      ],
    };

    const res = await StaffOrderCaptureService.captureOrder(ctx, dto);

    // 2 * 11.90 + 1 * 14.50 = 23.80 + 14.50 = 38.30
    expect(res.total).toBe(38.3);
    expect(res.isNewCustomer).toBe(false);
    expect(res.customerId).toBe("cust-1");
    expect(res.order.status).toBe("draft");
    expect(res.order.notes).toBe("Dejar en conserjería");
    expect(res.items.length).toBe(2);
    expect(res.items[0].comment).toBe("Sin cebolla");
    expect(res.items[0].qty).toBe(2);
    expect(res.items[1].comment).toBeNull();
  });

  it("captures order and auto-confirms when autoConfirm is true", async () => {
    const mockSupa = createMockSupabase();
    const ctx = mockCtx({}, mockSupa);

    const dto: UniversalOrderCaptureDTO = {
      customer: { mode: "existing", customerId: "cust-1" },
      weekStart: "2026-09-28",
      autoConfirm: true,
      lines: [{ dayDate: "2026-09-29", dishId: "dish-quinoa", qty: 3 }],
    };

    const res = await StaffOrderCaptureService.captureOrder(ctx, dto);

    expect(res.total).toBe(27.0); // 3 * 9.00
    expect(res.order.status).toBe("confirmed");
  });

  it("provisions new customer síncronamente with minimal details (mode: 'new')", async () => {
    const mockSupa = createMockSupabase();
    const ctx = mockCtx({}, mockSupa);

    const dto: UniversalOrderCaptureDTO = {
      customer: {
        mode: "new",
        displayName: "María González",
        phone: "+34 600 111 222",
        street: "Calle Mayor 12",
        city: "Adeje",
        deliveryNotes: "Timbre 2B",
      },
      weekStart: "2026-09-28",
      autoConfirm: true,
      lines: [{ dayDate: "2026-09-29", dishId: "dish-pollo", qty: 1 }],
    };

    const res = await StaffOrderCaptureService.captureOrder(ctx, dto);

    expect(res.isNewCustomer).toBe(true);
    expect(res.customerId).toBeDefined();
    expect(mockSupa.store.customers.length).toBe(2);
    expect(mockSupa.store.customer_phones.length).toBe(1);
    expect(mockSupa.store.customer_phones[0].phone).toBe("+34 600 111 222");
    expect(mockSupa.store.customer_addresses.length).toBe(1);
    expect(mockSupa.store.customer_addresses[0].street).toBe("Calle Mayor 12");
    expect(mockSupa.store.customer_preferences.length).toBe(1);
    expect(mockSupa.store.customer_preferences[0].value).toBe("Timbre 2B");
  });

  it("applies order-scoped unitPriceOverride without mutating master catalog", async () => {
    const mockSupa = createMockSupabase();
    const ctx = mockCtx({}, mockSupa);

    const dto: UniversalOrderCaptureDTO = {
      customer: { mode: "existing", customerId: "cust-1" },
      weekStart: "2026-09-28",
      lines: [
        // Pollo catalog price is 11.90, overridden to 10.00 specifically for this order
        { dayDate: "2026-09-29", dishId: "dish-pollo", qty: 2, unitPriceOverride: 10.0 },
        // Salmon catalog price is 14.50 (normal)
        { dayDate: "2026-09-30", dishId: "dish-salmon", qty: 1 },
      ],
    };

    const res = await StaffOrderCaptureService.captureOrder(ctx, dto);

    // 2 * 10.00 + 1 * 14.50 = 34.50 (instead of 2 * 11.90 + 14.50 = 38.30)
    expect(res.total).toBe(34.5);
    expect(res.order.total).toBe(34.5);
  });

  it("rejects unknown dishes not in tenant catalog", async () => {
    const mockSupa = createMockSupabase();
    const ctx = mockCtx({}, mockSupa);

    const dto: UniversalOrderCaptureDTO = {
      customer: { mode: "existing", customerId: "cust-1" },
      weekStart: "2026-09-28",
      lines: [{ dayDate: "2026-09-29", dishId: "non-existent-dish", qty: 1 }],
    };

    await expect(StaffOrderCaptureService.captureOrder(ctx, dto)).rejects.toBeInstanceOf(DomainError);
  });
});
