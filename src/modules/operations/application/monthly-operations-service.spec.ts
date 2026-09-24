import { describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import {
  MonthlyOperationsService,
  type MonthlyOperationsQuery,
} from "./monthly-operations-service";
import type { ServiceContext } from "@/services/types";

function createMockSupabase(initialData: {
  orderItems?: any[];
  menuSchedules?: any[];
} = {}) {
  const store = {
    order_items: initialData.orderItems ?? [],
    menu_schedules: initialData.menuSchedules ?? [],
  };

  const client = {
    from: (table: string) => {
      let currentTable = table;
      let filters: Array<(row: any) => boolean> = [];

      const queryBuilder = {
        select: (_fields = "*") => queryBuilder,
        eq: (col: string, val: any) => {
          filters.push((row) => row[col] === val);
          return queryBuilder;
        },
        gte: (col: string, val: any) => {
          filters.push((row) => row[col] >= val);
          return queryBuilder;
        },
        lte: (col: string, val: any) => {
          filters.push((row) => row[col] <= val);
          return queryBuilder;
        },
        is: (col: string, val: any) => {
          filters.push((row) => (val === null ? row[col] == null : row[col] === val));
          return queryBuilder;
        },
        then: (resolve: (val: any) => any) => {
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
    userId: "ops-user-1",
    tenantId: "tenant-eatclean",
    roles: ["operations_manager"],
    capabilities: new Set(["orders.read"]),
    localization: null,
    ip: "127.0.0.1",
    ...overrides,
  };
}

describe("OPS-01 G2 — MonthlyOperationsService", () => {
  it("fails if user lacks orders.read capability", async () => {
    // Employee role has only dishes.read, menus.read — lacks orders.read
    const ctx = mockCtx({ roles: ["employee"], capabilities: new Set() });
    const query: MonthlyOperationsQuery = { month: "2026-09" };

    await expect(MonthlyOperationsService.getMonthlySummary(ctx, query)).rejects.toThrow();
  });

  it("validates month format YYYY-MM strictly", async () => {
    const ctx = mockCtx();

    await expect(
      MonthlyOperationsService.getMonthlySummary(ctx, { month: "2026-9" }),
    ).rejects.toBeInstanceOf(DomainError);

    await expect(
      MonthlyOperationsService.getMonthlySummary(ctx, { month: "invalid-month" }),
    ).rejects.toBeInstanceOf(DomainError);

    await expect(
      MonthlyOperationsService.getMonthlySummary(ctx, { month: "2026-13" }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("generates exact days for September 2026 (30 days) and aggregates metrics", async () => {
    const mockOrderItems = [
      // 2026-09-15: 2 items, 2 customers, 1 order confirmed, 1 draft -> total 5 portions
      {
        id: "item-1",
        tenant_id: "tenant-eatclean",
        day_date: "2026-09-15",
        qty: 3,
        deleted_at: null,
        orders: {
          id: "order-1",
          customer_id: "cust-1",
          status: "confirmed",
          deleted_at: null,
        },
      },
      {
        id: "item-2",
        tenant_id: "tenant-eatclean",
        day_date: "2026-09-15",
        qty: 2,
        deleted_at: null,
        orders: {
          id: "order-2",
          customer_id: "cust-2",
          status: "draft",
          deleted_at: null,
        },
      },
      // 2026-09-20: 1 item, all delivered -> ready
      {
        id: "item-3",
        tenant_id: "tenant-eatclean",
        day_date: "2026-09-20",
        qty: 4,
        deleted_at: null,
        orders: {
          id: "order-3",
          customer_id: "cust-1",
          status: "delivered",
          deleted_at: null,
        },
      },
    ];

    const mockMenuSchedules = [
      { tenant_id: "tenant-eatclean", day_date: "2026-09-15", deleted_at: null },
      { tenant_id: "tenant-eatclean", day_date: "2026-09-16", deleted_at: null },
    ];

    const mockSupa = createMockSupabase({
      orderItems: mockOrderItems,
      menuSchedules: mockMenuSchedules,
    });
    const ctx = mockCtx({}, mockSupa);

    const res = await MonthlyOperationsService.getMonthlySummary(ctx, { month: "2026-09" });

    expect(res.month).toBe("2026-09");
    expect(res.startDate).toBe("2026-09-01");
    expect(res.endDate).toBe("2026-09-30");
    expect(res.totalDays).toBe(30);
    expect(res.totalMonthlyPortions).toBe(9); // 3 + 2 + 4
    expect(res.totalMonthlyOrders).toBe(3);
    expect(res.days.length).toBe(30);

    // Check Day 2026-09-15 (confirmed + draft -> in_kitchen)
    const day15 = res.days.find((d) => d.dayDate === "2026-09-15")!;
    expect(day15).toBeDefined();
    expect(day15.totalPortions).toBe(5);
    expect(day15.totalCustomers).toBe(2);
    expect(day15.totalOrders).toBe(2);
    expect(day15.status).toBe("in_kitchen");
    expect(day15.menuPublished).toBe(true);

    // Check Day 2026-09-20 (delivered -> ready)
    const day20 = res.days.find((d) => d.dayDate === "2026-09-20")!;
    expect(day20).toBeDefined();
    expect(day20.totalPortions).toBe(4);
    expect(day20.totalCustomers).toBe(1);
    expect(day20.totalOrders).toBe(1);
    expect(day20.status).toBe("ready");
    expect(day20.menuPublished).toBe(false);

    // Check empty day 2026-09-01
    const day01 = res.days.find((d) => d.dayDate === "2026-09-01")!;
    expect(day01).toBeDefined();
    expect(day01.totalPortions).toBe(0);
    expect(day01.totalCustomers).toBe(0);
    expect(day01.totalOrders).toBe(0);
    expect(day01.status).toBe("empty");
    expect(day01.menuPublished).toBe(false);
  });
});
