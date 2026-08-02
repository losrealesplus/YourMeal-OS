import { afterEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { AccountingService } from "./accounting-service";
import {
  __resetFlow03EvidenceForTests,
  getObservedFlow03Steps,
} from "./flow03-evidence";

const getOrdersByIds = vi.fn();
const createInvoice = vi.fn();

vi.mock("../infrastructure/accounting-repository", () => ({
  createAccountingRepository: () => ({
    getOrdersByIds,
    createInvoice,
    listBillableOrders: vi.fn(),
    listInvoices: vi.fn(),
    periodSummary: vi.fn(),
    getInvoice: vi.fn(),
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

describe("FLOW03-001 · AccountingService.createInvoiceFromOrders T1", () => {
  afterEach(() => {
    __resetFlow03EvidenceForTests();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("emits T1_STARTED then T1_COMPLETED on delivered → pending", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    getOrdersByIds.mockResolvedValue([
      {
        id: "order-1",
        customer_id: "cust-1",
        company_id: "co-1",
        total: 42,
        status: "delivered",
      },
    ]);
    createInvoice.mockResolvedValue({
      id: "inv-1",
      customerId: "cust-1",
      customerName: null,
      companyId: "co-1",
      companyName: null,
      amount: 42,
      status: "pending",
      billingPeriod: "2026-08",
      createdAt: "2026-08-02T00:00:00Z",
      reviewedAt: null,
      orderIds: ["order-1"],
      paidTotal: 0,
      lifecycleStage: "pending",
    });

    const invoice = await AccountingService.createInvoiceFromOrders(ctx(), {
      orderIds: ["order-1"],
    });
    expect(invoice.status).toBe("pending");
    expect(invoice.reviewedAt).toBeNull();
    expect(getObservedFlow03Steps()).toEqual([
      "FLOW03_T1_STARTED",
      "FLOW03_T1_COMPLETED",
    ]);

    const flowTokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-03]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW03_T"));
    expect(flowTokens).toEqual([
      "FLOW03_T1_STARTED",
      "FLOW03_T1_COMPLETED",
    ]);
    expect(flowTokens.some((t) => t.startsWith("FLOW03_T2"))).toBe(false);
    expect(flowTokens.some((t) => t.includes("T3"))).toBe(false);
  });

  it("does not emit FLOW03 tokens when order is not delivered", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    getOrdersByIds.mockResolvedValue([
      {
        id: "order-1",
        customer_id: "cust-1",
        company_id: "co-1",
        total: 42,
        status: "out_for_delivery",
      },
    ]);

    await expect(
      AccountingService.createInvoiceFromOrders(ctx(), {
        orderIds: ["order-1"],
      }),
    ).rejects.toBeInstanceOf(DomainError);

    expect(getObservedFlow03Steps()).toEqual([]);
    expect(createInvoice).not.toHaveBeenCalled();
  });

  it("stops T1 without COMPLETED when createInvoice fails", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    getOrdersByIds.mockResolvedValue([
      {
        id: "order-1",
        customer_id: "cust-1",
        company_id: "co-1",
        total: 42,
        status: "delivered",
      },
    ]);
    createInvoice.mockRejectedValue(new Error("rpc down"));

    await expect(
      AccountingService.createInvoiceFromOrders(ctx(), {
        orderIds: ["order-1"],
      }),
    ).rejects.toBeTruthy();

    expect(getObservedFlow03Steps()).toEqual(["FLOW03_T1_STARTED"]);
    const tokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-03]")
      .map((c) => c[1]);
    expect(tokens).toContain("STOP");
    expect(tokens).not.toContain("FLOW03_T1_COMPLETED");
  });
});
