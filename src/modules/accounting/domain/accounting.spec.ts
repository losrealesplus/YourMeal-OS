import { describe, expect, it } from "vitest";
import {
  canTransitionInvoice,
  currentBillingPeriod,
  deriveInvoiceLifecycleStage,
  derivePeriodReadyToClose,
  nextInvoiceStatuses,
} from "./accounting";

describe("accounting financial lifecycle · EP-OPS-003", () => {
  it("maps Pending → Review → Processed → Closed", () => {
    expect(
      deriveInvoiceLifecycleStage({
        status: "pending",
        reviewedAt: null,
        periodClosed: false,
      }),
    ).toBe("pending");
    expect(
      deriveInvoiceLifecycleStage({
        status: "pending",
        reviewedAt: "2026-07-28T00:00:00Z",
        periodClosed: false,
      }),
    ).toBe("review");
    expect(
      deriveInvoiceLifecycleStage({
        status: "paid",
        reviewedAt: "2026-07-28T00:00:00Z",
        periodClosed: false,
      }),
    ).toBe("processed");
    expect(
      deriveInvoiceLifecycleStage({
        status: "paid",
        reviewedAt: "2026-07-28T00:00:00Z",
        periodClosed: true,
      }),
    ).toBe("closed");
  });

  it("allows pending → paid | overdue | void", () => {
    expect(nextInvoiceStatuses("pending")).toEqual([
      "paid",
      "overdue",
      "void",
    ]);
    expect(canTransitionInvoice("pending", "paid")).toBe(true);
    expect(canTransitionInvoice("paid", "pending")).toBe(false);
  });

  it("readyToClose only when invoices exist and none open", () => {
    expect(
      derivePeriodReadyToClose({
        invoiceCount: 0,
        pendingCount: 0,
        overdueCount: 0,
      }),
    ).toBe(false);
    expect(
      derivePeriodReadyToClose({
        invoiceCount: 2,
        pendingCount: 1,
        overdueCount: 0,
      }),
    ).toBe(false);
    expect(
      derivePeriodReadyToClose({
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
