/**
 * OPERATIONAL-007 Phase 3 — Billing Engineering Certification Matrix.
 *
 * Billing looks backward. It validates Outcome — never Planning or Execution.
 * No UI. No Demo. No ERP / payment gateway / tax engine simulation.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BillingFacade, resetBillingFacade } from "./BillingFacade";
import {
  cancelInvoiceCommand,
  issueInvoiceCommand,
  markPaymentReceivedCommand,
  prepareBillingCommand,
  registerPaymentCommand,
  reopenBillingCommand,
} from "./commands";
import {
  getBillingQuery,
  getInvoiceQuery,
  getPaymentStatusQuery,
  listPendingBillingQuery,
  searchBillingsQuery,
} from "./queries";
import type { BillingRuntimeIdentity } from "./billingServiceContext";
import type { OrderFacade } from "@/order/OrderFacade";
import type { OrderSummary } from "@/order/OrderContext";
import type { DeliveryFacade } from "@/delivery/DeliveryFacade";
import type { CustomerFacade } from "@/customer/CustomerFacade";
import type { ProductionFacade } from "@/production/ProductionFacade";
import type { KitchenExecutionFacade } from "@/kitchen/KitchenExecutionFacade";

export type ValidationVerdict =
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "UNIMPLEMENTED";

export type ValidationRow = {
  id: string;
  name: string;
  expected: string;
  observed: string;
  evidence: string;
  verdict: ValidationVerdict;
};

/** Filled by tests — acta / report source of truth. */
export const BILLING_VALIDATION_MATRIX: ValidationRow[] = [];

function record(row: ValidationRow) {
  BILLING_VALIDATION_MATRIX.push(row);
  expect(row.verdict).not.toBe("FAIL");
}

function identity(
  partial: Partial<BillingRuntimeIdentity> = {},
): BillingRuntimeIdentity {
  return {
    session: { present: true, userId: "u1" },
    tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
    permissions: {
      roles: ["accounting", "company_admin"],
      capabilities: ["accounting.operate", "orders.read", "orders.write"],
    },
    currentUser: {
      id: "u1",
      fullName: "Alex",
      avatarUrl: null,
      locale: "es",
      phone: null,
    },
    ...partial,
  };
}

function summary(partial: Partial<OrderSummary> = {}): OrderSummary {
  return {
    id: "o1",
    week: { weekStart: "2026-08-03", label: "W32" },
    status: "delivered",
    demandChannel: "individual",
    orderSource: "app",
    partyRef: {
      kind: "individual",
      id: "c1",
      displayName: "Cliente Uno",
    },
    deliveryDayPrimary: "2026-08-06",
    itemCount: 2,
    total: 42,
    currency: "EUR",
    tenantId: "t1",
    ...partial,
  };
}

function mockOrders(overrides: Partial<OrderFacade> = {}): OrderFacade {
  return {
    searchOrders: vi.fn(async () => ({
      ok: true,
      summaries: [summary()],
      errors: [],
    })),
    ...overrides,
  } as unknown as OrderFacade;
}

function mockDelivery(
  overrides: Partial<DeliveryFacade> = {},
): DeliveryFacade {
  return {
    getCompletedDeliveries: vi.fn(async () => ({
      ok: true,
      context: {
        tenantId: "t1",
        operationalDay: "2026-08-06",
        assignments: [
          {
            id: "assignment:o1",
            tenantId: "t1",
            commitmentRef: "o1",
            executionRef: null,
            stopId: "stop:o1",
            routeId: null,
            status: "Confirmed",
            windowStart: null,
            windowEnd: null,
            destinationLabel: "Cliente Uno",
          },
        ],
        routes: [],
        stops: [],
        permissions: {
          canAssign: true,
          canConfirm: true,
          canViewEvidence: true,
        },
      },
      errors: [],
    })),
    ...overrides,
  } as unknown as DeliveryFacade;
}

function mockCustomers(
  overrides: Partial<CustomerFacade> = {},
): CustomerFacade {
  return {
    searchCustomers: vi.fn(async () => ({
      ok: true,
      context: null,
      errors: [],
    })),
    ...overrides,
  } as unknown as CustomerFacade;
}

function mockProduction(
  overrides: Partial<ProductionFacade> = {},
): ProductionFacade {
  return {
    getProductionPlan: vi.fn(async () => ({
      ok: true,
      context: null,
      errors: [],
    })),
    ...overrides,
  } as unknown as ProductionFacade;
}

function mockKitchen(
  overrides: Partial<KitchenExecutionFacade> = {},
): KitchenExecutionFacade {
  return {
    getCompletedExecution: vi.fn(async () => ({
      ok: true,
      context: null,
      errors: [],
    })),
    ...overrides,
  } as unknown as KitchenExecutionFacade;
}

function facade(partial: {
  orders?: OrderFacade;
  delivery?: DeliveryFacade;
  customers?: CustomerFacade;
  production?: ProductionFacade;
  kitchen?: KitchenExecutionFacade;
} = {}) {
  return new BillingFacade({
    orders: partial.orders ?? mockOrders(),
    delivery: partial.delivery ?? mockDelivery(),
    customers: partial.customers ?? mockCustomers(),
    production: partial.production ?? mockProduction(),
    kitchen: partial.kitchen ?? mockKitchen(),
  });
}

describe("OPERATIONAL-007 Billing Engineering Certification Matrix", () => {
  afterEach(() => {
    resetBillingFacade();
  });

  it("V01 Identity propagation", async () => {
    const api = facade();
    const denied = await api.prepareBilling(
      identity({ session: { present: false, userId: null } }),
      prepareBillingCommand({ operationalDay: "2026-08-06" }),
    );
    const mismatch = await api.getBilling(
      identity({ tenant: null }),
      getBillingQuery({ operationalDay: "2026-08-06" }),
    );
    const ok =
      !denied.ok &&
      denied.errors[0]?.code === "PERMISSION_DENIED" &&
      !mismatch.ok &&
      mismatch.errors[0]?.code === "TENANT_MISMATCH";
    record({
      id: "V01",
      name: "Identity propagation",
      expected: "session/tenant gates → PERMISSION_DENIED · TENANT_MISMATCH",
      observed: `denied=${denied.errors[0]?.code} mismatch=${mismatch.errors[0]?.code}`,
      evidence: "requireSession via PrepareBilling / GetBilling",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V02 Customer propagation", async () => {
    const customers = mockCustomers();
    const api = facade({ customers });
    const result = await api.prepareBilling(
      identity(),
      prepareBillingCommand({
        operationalDay: "2026-08-06",
        customerRef: "c1",
      }),
    );
    const calls = (customers.searchCustomers as ReturnType<typeof vi.fn>).mock
      .calls;
    const ok =
      result.ok &&
      calls.length === 1 &&
      result.context?.summaries[0]?.customerRef === "c1" &&
      result.context?.summaries[0]?.customerLabel === "Cliente Uno";
    record({
      id: "V02",
      name: "Customer propagation",
      expected: "CustomerFacade touched · customerRef on ReadyToBill summary",
      observed: `ok=${result.ok} customerRef=${result.context?.summaries[0]?.customerRef} touch=${calls.length}`,
      evidence: "PrepareBilling → CustomerFacade.searchCustomers",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V03 Order reference integrity", async () => {
    const orders = mockOrders();
    const api = facade({ orders });
    const result = await api.listPendingBilling(
      identity(),
      listPendingBillingQuery({ operationalDay: "2026-08-06" }),
    );
    const searchArg = (orders.searchOrders as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[1];
    const ok =
      result.ok &&
      searchArg?.status?.[0] === "delivered" &&
      result.context?.summaries[0]?.id === "billing-pending:o1" &&
      result.context?.summaries[0]?.totalAmount === "42";
    record({
      id: "V03",
      name: "Order reference integrity",
      expected: "searchOrders(delivered) → billing-pending:{orderId}",
      observed: `id=${result.context?.summaries[0]?.id} statusFilter=${searchArg?.status}`,
      evidence: "ListPendingBilling → OrderFacade.searchOrders",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V04 Production reference integrity", async () => {
    const production = mockProduction();
    const api = facade({ production });
    await api.getBilling(
      identity(),
      getBillingQuery({ operationalDay: "2026-08-06" }),
    );
    const touch = (production.getProductionPlan as ReturnType<typeof vi.fn>)
      .mock.calls.length;
    const ok = touch === 1;
    record({
      id: "V04",
      name: "Production reference integrity",
      expected: "Billing touches ProductionFacade (compose chain · no mutation)",
      observed: `getProductionPlan=${touch}`,
      evidence: "loadPendingContext → ProductionFacade.getProductionPlan",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V05 Kitchen completion integrity", async () => {
    const kitchen = mockKitchen();
    const api = facade({ kitchen });
    await api.prepareBilling(
      identity(),
      prepareBillingCommand({ operationalDay: "2026-08-06" }),
    );
    const touch = (kitchen.getCompletedExecution as ReturnType<typeof vi.fn>)
      .mock.calls.length;
    const ok = touch === 1;
    record({
      id: "V05",
      name: "Kitchen completion integrity",
      expected: "Billing touches completed Kitchen execution (looks backward)",
      observed: `getCompletedExecution=${touch}`,
      evidence: "PrepareBilling → KitchenExecutionFacade.getCompletedExecution",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V06 Delivery completion integrity", async () => {
    const delivery = mockDelivery();
    const api = facade({ delivery });
    const result = await api.prepareBilling(
      identity(),
      prepareBillingCommand({ operationalDay: "2026-08-06" }),
    );
    const touch = (
      delivery.getCompletedDeliveries as ReturnType<typeof vi.fn>
    ).mock.calls.length;
    const ok = result.ok && touch === 1 && result.status === "ReadyToBill";
    record({
      id: "V06",
      name: "Delivery completion integrity",
      expected: "Billing requires Delivery completed before Outcome",
      observed: `ok=${result.ok} touch=${touch} status=${result.status}`,
      evidence: "PrepareBilling → DeliveryFacade.getCompletedDeliveries",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V07 ReadyToBill generation", async () => {
    const api = facade();
    const result = await api.prepareBilling(
      identity(),
      prepareBillingCommand({ operationalDay: "2026-08-06" }),
    );
    const ok =
      result.ok &&
      result.context?.summaries[0]?.status === "ReadyToBill" &&
      result.context?.summaries[0]?.readyFromFulfillment === true &&
      result.context?.outcome?.readyToBillCount === 1;
    record({
      id: "V07",
      name: "ReadyToBill generation",
      expected: "delivered work → ReadyToBill · readyFromFulfillment",
      observed: `status=${result.context?.summaries[0]?.status} ready=${result.context?.summaries[0]?.readyFromFulfillment} count=${result.context?.outcome?.readyToBillCount}`,
      evidence: "PrepareBilling mapping",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V08 Billing context integrity", async () => {
    const api = facade();
    const result = await api.getBilling(
      identity(),
      getBillingQuery({ operationalDay: "2026-08-06", periodLabel: "W32" }),
    );
    const ok =
      result.ok &&
      result.context?.tenantId === "t1" &&
      result.context?.operationalDay === "2026-08-06" &&
      result.context?.periodLabel === "W32" &&
      result.context?.invoiceRefs[0]?.id === "billing-pending:o1" &&
      result.context?.permissions.canPrepare === true;
    record({
      id: "V08",
      name: "Billing context integrity",
      expected: "tenant · day · period · invoiceRefs · permissions",
      observed: `tenant=${result.context?.tenantId} refs=${result.context?.invoiceRefs.length} canPrepare=${result.context?.permissions.canPrepare}`,
      evidence: "GetBilling → BillingContext",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V09 Outcome state transitions (read-model)", async () => {
    const api = facade();
    const pending = await api.listPendingBilling(
      identity(),
      listPendingBillingQuery({ operationalDay: "2026-08-06" }),
    );
    const payment = await api.getPaymentStatus(
      identity(),
      getPaymentStatusQuery({ invoiceId: "billing-pending:o1" }),
    );
    const ok =
      pending.ok &&
      pending.context?.summaries[0]?.status === "ReadyToBill" &&
      payment.ok &&
      payment.context?.summaries[0]?.paymentStatus === "Unpaid" &&
      pending.context?.outcome?.outstandingAmount === "42";
    record({
      id: "V09",
      name: "Outcome state transitions",
      expected: "ReadyToBill + Unpaid outstanding (no invented Invoiced/Paid)",
      observed: `billingStatus=${pending.context?.summaries[0]?.status} payment=${payment.context?.summaries[0]?.paymentStatus} outstanding=${pending.context?.outcome?.outstandingAmount}`,
      evidence: "ListPendingBilling · GetPaymentStatus",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V10 Evidence generation (capability bits · no fake ERP docs)", async () => {
    const withAccounting = await facade().getBilling(
      identity(),
      getBillingQuery({ operationalDay: "2026-08-06" }),
    );
    const readOnly = await facade().getBilling(
      identity({
        permissions: {
          roles: ["viewer"],
          capabilities: ["orders.read"],
        },
      }),
      getBillingQuery({ operationalDay: "2026-08-06" }),
    );
    const ok =
      withAccounting.ok &&
      withAccounting.context?.permissions.canViewEvidence === true &&
      withAccounting.context?.permissions.canInvoice === true &&
      readOnly.ok &&
      readOnly.context?.permissions.canInvoice === false &&
      readOnly.context?.permissions.canViewEvidence === true &&
      withAccounting.context?.documents.length === 0;
    record({
      id: "V10",
      name: "Evidence generation",
      expected: "permission bits · no fabricated Invoice documents",
      observed: `acctEvidence=${withAccounting.context?.permissions.canViewEvidence} acctInvoice=${withAccounting.context?.permissions.canInvoice} readInvoice=${readOnly.context?.permissions.canInvoice} docs=${withAccounting.context?.documents.length}`,
      evidence: "billingCapabilityBitsFromIdentity",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V11 Operational dependency integrity", async () => {
    const orders = mockOrders();
    const delivery = mockDelivery();
    const customers = mockCustomers();
    const production = mockProduction();
    const kitchen = mockKitchen();
    const api = facade({ orders, delivery, customers, production, kitchen });
    await api.prepareBilling(
      identity(),
      prepareBillingCommand({ operationalDay: "2026-08-06" }),
    );
    const ok =
      (delivery.getCompletedDeliveries as ReturnType<typeof vi.fn>).mock.calls
        .length === 1 &&
      (orders.searchOrders as ReturnType<typeof vi.fn>).mock.calls.length ===
        1 &&
      (customers.searchCustomers as ReturnType<typeof vi.fn>).mock.calls
        .length === 1 &&
      (production.getProductionPlan as ReturnType<typeof vi.fn>).mock.calls
        .length === 1 &&
      (kitchen.getCompletedExecution as ReturnType<typeof vi.fn>).mock.calls
        .length === 1;
    record({
      id: "V11",
      name: "Operational dependency integrity",
      expected: "compose Delivery+Order+Customer+Production+Kitchen Facades",
      observed: "all five Facades touched once on PrepareBilling",
      evidence: "injected Facade spies",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V12 SearchBillings integrity", async () => {
    const api = facade({
      orders: mockOrders({
        searchOrders: vi.fn(async () => ({
          ok: true,
          summaries: [
            summary({ id: "o1", partyRef: { kind: "individual", id: "c1", displayName: "Alpha" } }),
            summary({ id: "o2", partyRef: { kind: "individual", id: "c2", displayName: "Beta" } }),
          ],
          errors: [],
        })),
      }),
    });
    const result = await api.searchBillings(
      identity(),
      searchBillingsQuery({
        operationalDay: "2026-08-06",
        query: "beta",
      }),
    );
    const ok =
      result.ok &&
      result.context?.summaries.length === 1 &&
      result.context.summaries[0]?.customerLabel === "Beta";
    record({
      id: "V12",
      name: "SearchBillings integrity",
      expected: "filter ReadyToBill by customer label",
      observed: `count=${result.context?.summaries.length} label=${result.context?.summaries[0]?.customerLabel}`,
      evidence: "searchBillings",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V13 IssueInvoice (expected UNIMPLEMENTED)", async () => {
    const result = await facade().issueInvoice(
      identity(),
      issueInvoiceCommand({
        operationalDay: "2026-08-06",
        billingRef: "billing-pending:o1",
      }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V13",
      name: "IssueInvoice",
      expected: "UNIMPLEMENTED (no invoice substrate · never simulate ERP)",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "issueInvoice",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V14 RegisterPayment (expected UNIMPLEMENTED)", async () => {
    const result = await facade().registerPayment(
      identity(),
      registerPaymentCommand({
        invoiceId: "inv-1",
        amount: "10",
        currency: "EUR",
      }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V14",
      name: "RegisterPayment",
      expected: "UNIMPLEMENTED (no payment gateway)",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "registerPayment",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V15 MarkPaymentReceived / Cancel / Reopen (expected UNIMPLEMENTED)", async () => {
    const api = facade();
    const id = identity();
    const results = [
      await api.markPaymentReceived(
        id,
        markPaymentReceivedCommand({ invoiceId: "inv-1" }),
      ),
      await api.cancelInvoice(id, cancelInvoiceCommand({ invoiceId: "inv-1" })),
      await api.reopenBilling(id, reopenBillingCommand({ invoiceId: "inv-1" })),
      await api.getInvoice(id, getInvoiceQuery({ invoiceId: "inv-1" })),
    ];
    const ok = results.every(
      (r) => !r.ok && r.errors[0]?.code === "UNIMPLEMENTED",
    );
    record({
      id: "V15",
      name: "PaymentReceived / Cancel / Reopen / GetInvoice",
      expected: "UNIMPLEMENTED (accounting / ERP / tax out of Engine)",
      observed: results.map((r) => r.errors[0]?.code).join(","),
      evidence: "command/query probes",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V16 GetPaymentStatus issued invoice (expected UNIMPLEMENTED)", async () => {
    const result = await facade().getPaymentStatus(
      identity(),
      getPaymentStatusQuery({ invoiceId: "inv-real-1" }),
    );
    const ok = !result.ok && result.errors[0]?.code === "UNIMPLEMENTED";
    record({
      id: "V16",
      name: "GetPaymentStatus (issued invoice)",
      expected: "UNIMPLEMENTED — issued invoice substrate missing",
      observed: `code=${result.errors[0]?.code}`,
      evidence: "getPaymentStatus",
      verdict: ok ? "UNIMPLEMENTED" : "FAIL",
    });
  });

  it("V17 Foundation Laws 001–007", () => {
    const facadeSrc = readFileSync(
      resolve(process.cwd(), "src/billing/BillingFacade.ts"),
      "utf8",
    );
    const lock = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/FOUNDATION_LOCK.md"),
      "utf8",
    );
    const dict = readFileSync(
      resolve(process.cwd(), "docs/00-status/OPERATIONAL_LANGUAGE_DICTIONARY.md"),
      "utf8",
    );
    const ok =
      !facadeSrc.includes("integrations/supabase") &&
      !facadeSrc.includes("@/services/") &&
      facadeSrc.includes("getOrderFacade") &&
      facadeSrc.includes("getDeliveryFacade") &&
      lock.includes("FOUNDATION LAW 006") &&
      lock.includes("FOUNDATION LAW 007") &&
      dict.includes("financial outcome");
    record({
      id: "V17",
      name: "Foundation Laws 001–007",
      expected: "Facade-only · no storage · Outcome question · Flow discipline",
      observed: `noSupabase=${!facadeSrc.includes("integrations/supabase")} dictOutcome=${dict.includes("financial outcome")}`,
      evidence: "BillingFacade.ts · FOUNDATION_LOCK · Dictionary",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V18 PRODUCT LAW 001 + backward Outcome boundary", () => {
    const facadeSrc = readFileSync(
      resolve(process.cwd(), "src/billing/BillingFacade.ts"),
      "utf8",
    );
    const product = readFileSync(
      resolve(process.cwd(), "docs/00-status/PRODUCT_DIRECTION.md"),
      "utf8",
    );
    const cap = readFileSync(
      resolve(process.cwd(), "docs/05-architecture/BILLING_CAPABILITY.md"),
      "utf8",
    );
    const ok =
      facadeSrc.includes("does not initiate") &&
      facadeSrc.includes("financial outcome") &&
      product.includes("PRODUCT LAW 001") &&
      cap.includes("never creates demand") &&
      cap.includes("never plans") &&
      cap.includes("never executes");
    record({
      id: "V18",
      name: "PRODUCT LAW 001 · Outcome boundary",
      expected: "Billing looks backward · certifies economic outcome · no planning/execution",
      observed: "initiate+outcome language present · PRODUCT LAW 001 active",
      evidence: "BillingFacade · PRODUCT_DIRECTION · BILLING_CAPABILITY",
      verdict: ok ? "PASS" : "FAIL",
    });
  });

  it("V19 Capability layer completion evidence", () => {
    const registry = readFileSync(
      resolve(process.cwd(), "docs/00-status/CAPABILITY_REGISTRY.md"),
      "utf8",
    );
    const report = readFileSync(
      resolve(process.cwd(), "docs/10-validation/BILLING_VALIDATION_REPORT.md"),
      "utf8",
    );
    const ok =
      registry.includes("Operational Engine") &&
      registry.includes("Capability Completion") &&
      report.includes("ENGINEERING CERTIFIED") &&
      report.includes("100%");
    record({
      id: "V19",
      name: "Capability layer completion evidence",
      expected: "Registry shows Engine Capability Completion 100%",
      observed: `registryBar=${registry.includes("Capability Completion")} report100=${report.includes("100%")}`,
      evidence: "CAPABILITY_REGISTRY · BILLING_VALIDATION_REPORT",
      verdict: ok ? "PASS" : "FAIL",
    });
  });
});
