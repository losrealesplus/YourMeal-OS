import { describe, it, expect } from "vitest";
import { StaffOrderCaptureService } from "./staff-order-capture-service";
import { createServiceContext } from "@/services/types";

describe("CR-OPS-03: Order Line Price Snapshot & Immutability Regression ($X \\neq Y$)", () => {
  function createMockSupabase() {
    const ordersTable: any[] = [];
    const orderItemsTable: any[] = [];
    const dishesTable: any[] = [
      { id: "dish-alpha", name: "Pollo Asado con Verduras", price: 10.0, status: "active", tenant_id: "tenant-immutability-1", deleted_at: null },
      { id: "dish-free", name: "Agua Mineral", price: 0.0, status: "active", tenant_id: "tenant-immutability-1", deleted_at: null },
      { id: "dish-unpriced", name: "Plato Especial sin Precio", price: null, status: "active", tenant_id: "tenant-immutability-1", deleted_at: null },
    ];
    const customersTable: any[] = [
      { id: "cust-01", display_name: "Isabella Martinez", tenant_id: "tenant-immutability-1", deleted_at: null },
    ];

    const mockSupabase: any = {
      from: (table: string) => {
        let currentData: any = null;
        const builder: any = {
          select: (cols?: string) => {
            if (currentData === null) {
              if (table === "customers") currentData = [...customersTable];
              else if (table === "dishes") currentData = [...dishesTable];
              else if (table === "orders") currentData = [...ordersTable];
              else if (table === "order_items") currentData = [...orderItemsTable];
              else currentData = [];
            }
            return builder;
          },
          insert: (payload: any) => {
            const arr = Array.isArray(payload) ? payload : [payload];
            const inserted = arr.map((item, idx) => ({
              id: `${table}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
              created_at: new Date().toISOString(),
              deleted_at: null,
              ...item,
            }));

            if (table === "orders") ordersTable.push(...inserted);
            if (table === "order_items") orderItemsTable.push(...inserted);
            currentData = Array.isArray(payload) ? inserted : inserted[0];
            return builder;
          },
          update: (payload: any) => {
            return builder;
          },
          delete: () => {
            return builder;
          },
          eq: (col: string, val: any) => {
            if (Array.isArray(currentData)) {
              currentData = currentData.filter((row) => row[col] === val);
            }
            return builder;
          },
          in: (col: string, vals: any[]) => {
            if (Array.isArray(currentData)) {
              currentData = currentData.filter((row) => vals.includes(row[col]));
            }
            return builder;
          },
          is: (col: string, val: any) => {
            if (Array.isArray(currentData)) {
              currentData = currentData.filter((row) => row[col] === val);
            }
            return builder;
          },
          order: () => builder,
          limit: () => builder,
          single: async () => ({
            data: Array.isArray(currentData) ? currentData[0] ?? null : currentData,
            error: null,
          }),
          maybeSingle: async () => ({
            data: Array.isArray(currentData) ? currentData[0] ?? null : currentData,
            error: null,
          }),
          then: (resolve: any) => resolve({ data: currentData, error: null }),
        };
        return builder;
      },
    };

    return {
      mockSupabase,
      ordersTable,
      orderItemsTable,
      dishesTable,
      customersTable,
    };
  }

  it("preserves historical line item unit_price and total when catalog dish price is updated (X -> Y)", async () => {
    const { mockSupabase, ordersTable, orderItemsTable, dishesTable } = createMockSupabase();

    const ctx = await createServiceContext({
      supabase: mockSupabase,
      tenantId: "tenant-immutability-1",
      userId: "user-ops-01",
      roles: ["company_admin"],
    });

    // 1. Capture Order 1 at Dish Price X = 10.00 €
    const order1Result = await StaffOrderCaptureService.captureOrder(ctx, {
      customer: { mode: "existing", customerId: "cust-01" },
      weekStart: "2026-09-28",
      lines: [
        { dishId: "dish-alpha", dayDate: "2026-09-28", qty: 2 },
      ],
      demandChannel: "individual",
    });

    expect(order1Result.total).toBe(20.0);
    const order1Item = orderItemsTable.find((i) => i.order_id === order1Result.order.id);
    expect(order1Item).toBeDefined();
    expect(order1Item.unit_price).toBe(10.0);
    expect(order1Item.price_snapshot_status).toBe("captured");

    // 2. Mutate Catalog Dish Price from X (10.00 €) to Y (15.00 €)
    const dishAlpha = dishesTable.find((d) => d.id === "dish-alpha");
    dishAlpha.price = 15.0;

    // 3. Verify Order 1 Historical Immutability (Order 1 line item must NOT change)
    const historicalItem = orderItemsTable.find((i) => i.order_id === order1Result.order.id);
    const historicalOrder = ordersTable.find((o) => o.id === order1Result.order.id);
    expect(historicalItem.unit_price).toBe(10.0);
    expect(historicalItem.price_snapshot_status).toBe("captured");
    expect(historicalOrder.total).toBe(20.0);

    // 4. Capture Order 2 with New Dish Price Y = 15.00 €
    const order2Result = await StaffOrderCaptureService.captureOrder(ctx, {
      customer: { mode: "existing", customerId: "cust-01" },
      weekStart: "2026-10-05",
      lines: [
        { dishId: "dish-alpha", dayDate: "2026-10-05", qty: 1 },
      ],
      demandChannel: "individual",
    });

    expect(order2Result.total).toBe(15.0);
    const order2Item = orderItemsTable.find((i) => i.order_id === order2Result.order.id);
    expect(order2Item).toBeDefined();
    expect(order2Item.unit_price).toBe(15.0);
    expect(order2Item.price_snapshot_status).toBe("captured");

    // 5. Verify Historical Order 1 item remains untouched
    expect(historicalItem.unit_price).toBe(10.0);
  });

  it("correctly snapshots explicit zero items with status explicit_zero", async () => {
    const { mockSupabase, orderItemsTable } = createMockSupabase();

    const ctx = await createServiceContext({
      supabase: mockSupabase,
      tenantId: "tenant-immutability-1",
      userId: "user-ops-01",
      roles: ["company_admin"],
    });

    const orderResult = await StaffOrderCaptureService.captureOrder(ctx, {
      customer: { mode: "existing", customerId: "cust-01" },
      weekStart: "2026-09-28",
      lines: [
        { dishId: "dish-free", dayDate: "2026-09-28", qty: 3 },
      ],
      demandChannel: "individual",
    });

    expect(orderResult.total).toBe(0.0);
    const item = orderItemsTable.find((i) => i.order_id === orderResult.order.id);
    expect(item).toBeDefined();
    expect(item.unit_price).toBe(0.0);
    expect(item.price_snapshot_status).toBe("explicit_zero");
  });

  it("blocks order creation for dishes without pricing unless explicit price override is provided", async () => {
    const { mockSupabase } = createMockSupabase();

    const ctx = await createServiceContext({
      supabase: mockSupabase,
      tenantId: "tenant-immutability-1",
      userId: "user-ops-01",
      roles: ["company_admin"],
    });

    // Attempt without override -> MUST fail with PRICE_UNAVAILABLE
    await expect(
      StaffOrderCaptureService.captureOrder(ctx, {
        customer: { mode: "existing", customerId: "cust-01" },
        weekStart: "2026-09-28",
        lines: [
          { dishId: "dish-unpriced", dayDate: "2026-09-28", qty: 1 },
        ],
        demandChannel: "individual",
      }),
    ).rejects.toThrow(/no tiene precio asignado en el catálogo/);

    // Attempt with manual override -> MUST succeed and snapshot override price
    const orderResult = await StaffOrderCaptureService.captureOrder(ctx, {
      customer: { mode: "existing", customerId: "cust-01" },
      weekStart: "2026-09-28",
      lines: [
        { dishId: "dish-unpriced", dayDate: "2026-09-28", qty: 2, unitPriceOverride: 8.5 },
      ],
      demandChannel: "individual",
    });

    expect(orderResult.total).toBe(17.0);
  });
});
