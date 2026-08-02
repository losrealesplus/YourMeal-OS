import { afterEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { AccountingService } from "./accounting-service";
import {
  __resetFlow03EvidenceForTests,
  beginFlow03Pipeline,
  getObservedFlow03Steps,
  logFlow03Step,
} from "./flow03-evidence";

const getInvoice = vi.fn();
const insertPayment = vi.fn();
const updateInvoiceStatus = vi.fn();

vi.mock("../infrastructure/accounting-repository", () => ({
  createAccountingRepository: () => ({
    getInvoice,
    insertPayment,
    updateInvoiceStatus,
    getOrdersByIds: vi.fn(),
    createInvoice: vi.fn(),
    markInvoiceReviewed: vi.fn(),
    listBillableOrders: vi.fn(),
    listInvoices: vi.fn(),
    periodSummary: vi.fn(),
  }),
}));

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn(async () => undefined),
  },
}));

function ctx(overrides: Partial<ServiceContext> = {}): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "user-1",
    tenantId: "tenant-1",
    roles: ["accounting"],
    capabilities: new Set(["accounting.operate", "orders.read"]),
    localization: null,
    ip: null,
    ...overrides,
  };
}

function seedT1T2Pipeline(): void {
  beginFlow03Pipeline({ orderIds: ["order-1"] });
  logFlow03Step("FLOW03_T1_STARTED");
  logFlow03Step("FLOW03_T1_COMPLETED");
  logFlow03Step("FLOW03_T2_STARTED");
  logFlow03Step("FLOW03_T2_COMPLETED");
}

describe("FLOW03-003 · AccountingService.recordPayment T3", () => {
  afterEach(() => {
    __resetFlow03EvidenceForTests();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("emits T3 tokens · pending → paid (full payment)", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    seedT1T2Pipeline();
    getInvoice
      .mockResolvedValueOnce({
        id: "inv-1",
        status: "pending",
        reviewedAt: "2026-08-02T15:00:00.000Z",
        lifecycleStage: "review",
        amount: 100,
        paidTotal: 0,
        orderIds: ["order-1"],
      })
      .mockResolvedValueOnce({
        id: "inv-1",
        status: "paid",
        reviewedAt: "2026-08-02T15:00:00.000Z",
        lifecycleStage: "processed",
        amount: 100,
        paidTotal: 100,
        orderIds: ["order-1"],
      });
    insertPayment.mockResolvedValue({
      id: "pay-1",
      invoiceId: "inv-1",
      amount: 100,
      method: "manual",
      paidAt: "2026-08-02T15:20:00.000Z",
      status: "completed",
    });
    updateInvoiceStatus.mockResolvedValue(undefined);

    const { invoice, payment } = await AccountingService.recordPayment(ctx(), {
      invoiceId: "inv-1",
    });
    expect(invoice.status).toBe("paid");
    expect(payment.amount).toBe(100);
    expect(updateInvoiceStatus).toHaveBeenCalledWith("inv-1", "paid");
    expect(getObservedFlow03Steps()).toEqual([
      "FLOW03_T1_STARTED",
      "FLOW03_T1_COMPLETED",
      "FLOW03_T2_STARTED",
      "FLOW03_T2_COMPLETED",
      "FLOW03_T3_STARTED",
      "FLOW03_T3_COMPLETED",
    ]);

    const flowTokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-03]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW03_T"));
    expect(flowTokens).toEqual([
      "FLOW03_T1_STARTED",
      "FLOW03_T1_COMPLETED",
      "FLOW03_T2_STARTED",
      "FLOW03_T2_COMPLETED",
      "FLOW03_T3_STARTED",
      "FLOW03_T3_COMPLETED",
    ]);
  });

  it("rejects partial payment (out of FLOW-03 v1)", async () => {
    seedT1T2Pipeline();
    getInvoice.mockResolvedValue({
      id: "inv-1",
      status: "pending",
      reviewedAt: "2026-08-02T15:00:00.000Z",
      lifecycleStage: "review",
      amount: 100,
      paidTotal: 0,
    });

    await expect(
      AccountingService.recordPayment(ctx(), {
        invoiceId: "inv-1",
        amount: 40,
      }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(insertPayment).not.toHaveBeenCalled();
    expect(getObservedFlow03Steps()).toEqual([
      "FLOW03_T1_STARTED",
      "FLOW03_T1_COMPLETED",
      "FLOW03_T2_STARTED",
      "FLOW03_T2_COMPLETED",
    ]);
  });

  it("rejects payment without T2 COMPLETED in pipeline", async () => {
    beginFlow03Pipeline();
    logFlow03Step("FLOW03_T1_STARTED");
    logFlow03Step("FLOW03_T1_COMPLETED");
    getInvoice.mockResolvedValue({
      id: "inv-1",
      status: "pending",
      reviewedAt: "2026-08-02T15:00:00.000Z",
      lifecycleStage: "review",
      amount: 100,
      paidTotal: 0,
    });

    await expect(
      AccountingService.recordPayment(ctx(), { invoiceId: "inv-1" }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(insertPayment).not.toHaveBeenCalled();
  });
});
