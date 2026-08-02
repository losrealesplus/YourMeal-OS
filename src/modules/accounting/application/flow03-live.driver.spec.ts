/**
 * FLOW-03 live domain driver (T1–T3 progressive).
 * Invoked by scripts/lib/flow03-domain-driver.mjs
 *
 * FLOW03-001: through=1 → createInvoiceFromOrders
 * FLOW03-002: through=2 → + reviewInvoice (event · status stays pending)
 * T3 lands in FLOW03-003.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ServiceContext } from "@/services/types";
import { AccountingService } from "./accounting-service";
import {
  __resetFlow03EvidenceForTests,
  getObservedFlow03Steps,
} from "./flow03-evidence";

const getOrdersByIds = vi.fn();
const createInvoice = vi.fn();
const getInvoice = vi.fn();
const markInvoiceReviewed = vi.fn();

vi.mock("../infrastructure/accounting-repository", () => ({
  createAccountingRepository: () => ({
    getOrdersByIds,
    createInvoice,
    getInvoice,
    markInvoiceReviewed,
    listBillableOrders: vi.fn(),
    listInvoices: vi.fn(),
    periodSummary: vi.fn(),
    recordPayment: vi.fn(),
  }),
}));

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn(async () => undefined),
  },
}));

function ctx(): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "flow03-driver",
    tenantId: "tenant-flow03",
    roles: ["accounting"],
    capabilities: new Set(["accounting.operate", "orders.read"]),
    localization: null,
    ip: null,
  };
}

describe("FLOW-03 live domain driver", () => {
  afterEach(() => {
    __resetFlow03EvidenceForTests();
    vi.clearAllMocks();
  });

  it("drives certified transitions up to FLOW03_LIVE_THROUGH (default T2 until 003)", async () => {
    // Max certified transition until FLOW03-003 lands.
    const through = Number(process.env.FLOW03_LIVE_THROUGH || "2");

    getOrdersByIds.mockResolvedValue([
      {
        id: "order-flow03",
        customer_id: "cust-flow03",
        company_id: "co-flow03",
        total: 100,
        status: "delivered",
      },
    ]);
    createInvoice.mockResolvedValue({
      id: "inv-flow03",
      customerId: "cust-flow03",
      customerName: null,
      companyId: "co-flow03",
      companyName: null,
      amount: 100,
      status: "pending",
      billingPeriod: "2026-08",
      createdAt: "2026-08-02T00:00:00Z",
      reviewedAt: null,
      orderIds: ["order-flow03"],
      paidTotal: 0,
      lifecycleStage: "pending",
    });

    const invoice = await AccountingService.createInvoiceFromOrders(ctx(), {
      orderIds: ["order-flow03"],
    });
    expect(invoice.status).toBe("pending");
    expect(invoice.reviewedAt).toBeNull();

    if (through < 2) {
      expect(getObservedFlow03Steps()).toEqual([
        "FLOW03_T1_STARTED",
        "FLOW03_T1_COMPLETED",
      ]);
      return;
    }

    getInvoice
      .mockResolvedValueOnce({
        id: "inv-flow03",
        customerId: "cust-flow03",
        customerName: null,
        companyId: "co-flow03",
        companyName: null,
        amount: 100,
        status: "pending",
        billingPeriod: "2026-08",
        createdAt: "2026-08-02T00:00:00Z",
        reviewedAt: null,
        orderIds: ["order-flow03"],
        paidTotal: 0,
        lifecycleStage: "pending",
      })
      .mockResolvedValueOnce({
        id: "inv-flow03",
        customerId: "cust-flow03",
        customerName: null,
        companyId: "co-flow03",
        companyName: null,
        amount: 100,
        status: "pending",
        billingPeriod: "2026-08",
        createdAt: "2026-08-02T00:00:00Z",
        reviewedAt: "2026-08-02T15:10:00.000Z",
        orderIds: ["order-flow03"],
        paidTotal: 0,
        lifecycleStage: "review",
      });
    markInvoiceReviewed.mockResolvedValue(undefined);

    const reviewed = await AccountingService.reviewInvoice(ctx(), "inv-flow03");
    expect(reviewed.status).toBe("pending");
    expect(reviewed.reviewedAt).toBeTruthy();

    if (through < 3) {
      expect(getObservedFlow03Steps()).toEqual([
        "FLOW03_T1_STARTED",
        "FLOW03_T1_COMPLETED",
        "FLOW03_T2_STARTED",
        "FLOW03_T2_COMPLETED",
      ]);
      return;
    }

    throw new Error(
      `FLOW03_LIVE_THROUGH=${through} not implemented yet (only T1–T2 certified)`,
    );
  });
});
