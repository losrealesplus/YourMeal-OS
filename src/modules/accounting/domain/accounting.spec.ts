import { describe, expect, it } from "vitest";
import {
  canTransitionInvoice,
  currentBillingPeriod,
  derivePeriodComplete,
  nextInvoiceStatuses,
} from "./accounting";

describe("accounting financial lifecycle · EP-OPS-003", () => {
  it("allows pending → paid | overdue | void", () => {
    expect(nextInvoiceStatuses("pending")).toEqual([
      "paid",
      "overdue",
      "void",
    ]);
    expect(canTransitionInvoice("pending", "paid")).toBe(true);
    expect(canTransitionInvoice("paid", "pending")).toBe(false);
  });

  it("marks period complete only when invoices exist and none open", () => {
    expect(
      derivePeriodComplete({
        invoiceCount: 0,
        pendingCount: 0,
        overdueCount: 0,
      }),
    ).toBe(false);
    expect(
      derivePeriodComplete({
        invoiceCount: 2,
        pendingCount: 1,
        overdueCount: 0,
      }),
    ).toBe(false);
    expect(
      derivePeriodComplete({
        invoiceCount: 2,
        pendingCount: 0,
        overdueCount: 0,
      }),
    ).toBe(true);
  });

  it("formats billing period YYYY-MM", () => {
    expect(currentBillingPeriod(new Date("2026-07-28T12:00:00Z"))).toBe(
      "2026-07",
    );
  });
});
