import { DomainError } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import type { ServiceContext } from "@/services/types";

export interface MonthlyDayOperationalMetrics {
  dayDate: string; // YYYY-MM-DD
  totalPortions: number;
  totalCustomers: number;
  totalOrders: number;
  status: "empty" | "draft" | "in_kitchen" | "ready";
  menuPublished: boolean;
  orderStatuses: string[];
}

export interface MonthlyOperationsSummary {
  month: string; // YYYY-MM
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  totalMonthlyPortions: number;
  totalMonthlyOrders: number;
  days: MonthlyDayOperationalMetrics[];
}

export interface MonthlyOperationsQuery {
  month: string; // YYYY-MM
}

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function getDaysInMonth(year: number, monthIndex: number): string[] {
  const days: string[] = [];
  const date = new Date(Date.UTC(year, monthIndex, 1));
  while (date.getUTCMonth() === monthIndex) {
    days.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return days;
}

function deriveDayStatus(
  orderStatuses: string[],
): "empty" | "draft" | "in_kitchen" | "ready" {
  if (orderStatuses.length === 0) return "empty";

  // If any order is active in production or confirmed for kitchen
  if (
    orderStatuses.some(
      (s) =>
        s === "confirmed" ||
        s === "in_production" ||
        s === "in_preparation" ||
        s === "prepared",
    )
  ) {
    return "in_kitchen";
  }

  // If all orders are delivered or ready for dispatch
  if (
    orderStatuses.every(
      (s) => s === "delivered" || s === "ready_for_delivery" || s === "out_for_delivery",
    )
  ) {
    return "ready";
  }

  // If all orders are draft
  if (orderStatuses.every((s) => s === "draft")) {
    return "draft";
  }

  return "draft";
}

/**
 * OPS-01 G2 — MonthlyOperationsService
 *
 * Aggregates operational load, portion volume, active customer demand,
 * and service statuses across all days of a calendar month without
 * duplicating orders or mutating relational data.
 */
export const MonthlyOperationsService = {
  async getMonthlySummary(
    ctx: ServiceContext,
    query: MonthlyOperationsQuery,
  ): Promise<MonthlyOperationsSummary> {
    requireCapability(ctx.roles, "orders.read");

    if (!query.month || !MONTH_REGEX.test(query.month)) {
      throw new DomainError(
        "INVALID_STATE",
        `Invalid month format: ${query.month}. Expected YYYY-MM.`,
      );
    }

    const [yearStr, monthStr] = query.month.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

    const allDaysInMonth = getDaysInMonth(year, monthIndex);
    const startDate = allDaysInMonth[0];
    const endDate = allDaysInMonth[allDaysInMonth.length - 1];

    // 1. Fetch all order items and their parent orders for the date range
    const { data: rawItems, error: itemsError } = await ctx.supabase
      .from("order_items")
      .select(
        `
        id,
        day_date,
        qty,
        order_id,
        orders (
          id,
          customer_id,
          status,
          deleted_at
        )
      `,
      )
      .eq("tenant_id", ctx.tenantId)
      .gte("day_date", startDate)
      .lte("day_date", endDate)
      .is("deleted_at", null);

    if (itemsError) {
      throw new DomainError(
        "INVALID_STATE",
        `Failed to fetch monthly order items: ${itemsError.message}`,
      );
    }

    // 2. Fetch scheduled menu dates for the month
    const { data: menuSlots, error: menuError } = await (ctx.supabase as any)
      .from("menu_schedules")
      .select("day_date")
      .eq("tenant_id", ctx.tenantId)
      .gte("day_date", startDate)
      .lte("day_date", endDate)
      .is("deleted_at", null);

    if (menuError) {
      throw new DomainError(
        "INVALID_STATE",
        `Failed to fetch menu schedules: ${menuError.message}`,
      );
    }

    const publishedDates = new Set<string>();
    for (const slot of menuSlots ?? []) {
      if (slot.day_date) {
        publishedDates.add(slot.day_date);
      }
    }

    // 3. Bucket items by day_date
    type DayBucket = {
      portions: number;
      customerIds: Set<string>;
      orderIds: Set<string>;
      orderStatuses: Set<string>;
    };

    const buckets = new Map<string, DayBucket>();
    for (const d of allDaysInMonth) {
      buckets.set(d, {
        portions: 0,
        customerIds: new Set(),
        orderIds: new Set(),
        orderStatuses: new Set(),
      });
    }

    for (const item of rawItems ?? []) {
      const parentOrder = item.orders as unknown as {
        id: string;
        customer_id: string;
        status: string;
        deleted_at: string | null;
      } | null;

      if (!parentOrder || parentOrder.deleted_at !== null) continue;

      const bucket = buckets.get(item.day_date);
      if (bucket) {
        bucket.portions += Number(item.qty || 0);
        if (parentOrder.customer_id) {
          bucket.customerIds.add(parentOrder.customer_id);
        }
        if (parentOrder.id) {
          bucket.orderIds.add(parentOrder.id);
        }
        if (parentOrder.status) {
          bucket.orderStatuses.add(parentOrder.status);
        }
      }
    }

    // 4. Transform buckets into metrics array
    let totalMonthlyPortions = 0;
    const distinctMonthlyOrders = new Set<string>();

    const days: MonthlyDayOperationalMetrics[] = allDaysInMonth.map((dayDate) => {
      const bucket = buckets.get(dayDate)!;
      totalMonthlyPortions += bucket.portions;
      bucket.orderIds.forEach((id) => distinctMonthlyOrders.add(id));

      const statuses = Array.from(bucket.orderStatuses);
      return {
        dayDate,
        totalPortions: bucket.portions,
        totalCustomers: bucket.customerIds.size,
        totalOrders: bucket.orderIds.size,
        status: deriveDayStatus(statuses),
        menuPublished: publishedDates.has(dayDate),
        orderStatuses: statuses,
      };
    });

    return {
      month: query.month,
      startDate,
      endDate,
      totalDays: allDaysInMonth.length,
      totalMonthlyPortions,
      totalMonthlyOrders: distinctMonthlyOrders.size,
      days,
    };
  },
};
