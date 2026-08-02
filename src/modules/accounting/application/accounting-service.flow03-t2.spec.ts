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
const markInvoiceReviewed = vi.fn();

vi.mock("../infrastructure/accounting-repository", () => ({
  createAccountingRepository: () => ({
    getInvoice,
    markInvoiceReviewed,
    getOrdersByIds: vi.fn(),
    createInvoice: vi.fn(),
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

function seedT1Pipeline(): void {
  beginFlow03Pipeline({ orderIds: ["order-1"] });
  logFlow03Step("FLOW03_T1_STARTED");
  logFlow03Step("FLOW03_T1_COMPLETED");
}

describe("FLOW03-002 · AccountingService.reviewInvoice T2", () => {
  afterEach(() => {
    __resetFlow03EvidenceForTests();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("emits T2 tokens · reviewed_at set · status stays pending", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    seedT1Pipeline();
    getInvoice
      .mockResolvedValueOnce({
        id: "inv-1",
        status: "pending",
        reviewedAt: null,
        lifecycleStage: "pending",
        amount: 42,
        orderIds: ["order-1"],
      })
      .mockResolvedValueOnce({
        id: "inv-1",
        status: "pending",
        reviewedAt: "2026-08-02T15:00:00.000Z",
        lifecycleStage: "review",
        amount: 42,
        orderIds: ["order-1"],
      });
    markInvoiceReviewed.mockResolvedValue(undefined);

    const updated = await AccountingService.reviewInvoice(ctx(), "inv-1");
    expect(updated.status).toBe("pending");
    expect(updated.reviewedAt).toBe("2026-08-02T15:00:00.000Z");
    expect(getObservedFlow03Steps()).toEqual([
      "FLOW03_T1_STARTED",
      "FLOW03_T1_COMPLETED",
      "FLOW03_T2_STARTED",
      "FLOW03_T2_COMPLETED",
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
    ]);
    expect(flowTokens.some((t) => t.startsWith("FLOW03_T3"))).toBe(false);
  });

  it("rejects review without T1 COMPLETED in pipeline", async () => {
    getInvoice.mockResolvedValue({
      id: "inv-1",
      status: "pending",
      reviewedAt: null,
      lifecycleStage: "pending",
    });

    await expect(
      AccountingService.reviewInvoice(ctx(), "inv-1"),
    ).rejects.toBeInstanceOf(DomainError);
    expect(markInvoiceReviewed).not.toHaveBeenCalled();
    expect(getObservedFlow03Steps()).toEqual([]);
  });

  it("stops T2 without COMPLETED when markInvoiceReviewed fails", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    seedT1Pipeline();
    getInvoice.mockResolvedValue({
      id: "inv-1",
      status: "pending",
      reviewedAt: null,
      lifecycleStage: "pending",
    });
    markInvoiceReviewed.mockRejectedValue(new Error("rpc down"));

    await expect(
      AccountingService.reviewInvoice(ctx(), "inv-1"),
    ).rejects.toBeTruthy();

    expect(getObservedFlow03Steps()).toEqual([
      "FLOW03_T1_STARTED",
      "FLOW03_T1_COMPLETED",
      "FLOW03_T2_STARTED",
    ]);
    const tokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-03]")
      .map((c) => c[1]);
    expect(tokens).toContain("STOP");
    expect(tokens).not.toContain("FLOW03_T2_COMPLETED");
  });
});
