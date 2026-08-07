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
    week: { weekStart: "2026-08-03" },
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
        assignments: [],
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

function mockCustomers(): CustomerFacade {
  return {
    searchCustomers: vi.fn(async () => ({
      ok: true,
      context: null,
      errors: [],
    })),
  } as unknown as CustomerFacade;
}

function mockProduction(): ProductionFacade {
  return {
    getProductionPlan: vi.fn(async () => ({
      ok: true,
      context: null,
      errors: [],
    })),
  } as unknown as ProductionFacade;
}

function mockKitchen(): KitchenExecutionFacade {
  return {
    getCompletedExecution: vi.fn(async () => ({
      ok: true,
      context: null,
      errors: [],
    })),
  } as unknown as KitchenExecutionFacade;
}

function facade(orders?: OrderFacade) {
  return new BillingFacade({
    orders: orders ?? mockOrders(),
    delivery: mockDelivery(),
    customers: mockCustomers(),
    production: mockProduction(),
    kitchen: mockKitchen(),
  });
}

describe("BillingFacade Outcome API", () => {
  afterEach(() => {
    resetBillingFacade();
  });

  it("PrepareBilling / ListPendingBilling compose Delivery + Orders → ReadyToBill", async () => {
    const orders = mockOrders();
    const delivery = mockDelivery();
    const api = new BillingFacade({
      orders,
      delivery,
      customers: mockCustomers(),
      production: mockProduction(),
      kitchen: mockKitchen(),
    });

    const prepared = await api.prepareBilling(
      identity(),
      prepareBillingCommand({ operationalDay: "2026-08-06" }),
    );
    expect(prepared.ok).toBe(true);
    expect(delivery.getCompletedDeliveries).toHaveBeenCalled();
    expect(orders.searchOrders).toHaveBeenCalled();
    expect(prepared.status).toBe("ReadyToBill");
    expect(prepared.context?.summaries[0]?.id).toBe("billing-pending:o1");
    expect(prepared.context?.summaries[0]?.status).toBe("ReadyToBill");
    expect(prepared.context?.outcome?.readyToBillCount).toBe(1);

    const pending = await api.listPendingBilling(
      identity(),
      listPendingBillingQuery({ operationalDay: "2026-08-06" }),
    );
    expect(pending.ok).toBe(true);
    expect(pending.context?.summaries).toHaveLength(1);
  });

  it("GetBilling / SearchBillings return Outcome language not CRUD rows", async () => {
    const api = facade();
    const billing = await api.getBilling(
      identity(),
      getBillingQuery({ operationalDay: "2026-08-06" }),
    );
    expect(billing.ok).toBe(true);
    expect(billing.context?.summaries[0]?.customerLabel).toBe("Cliente Uno");

    const searched = await api.searchBillings(
      identity(),
      searchBillingsQuery({
        operationalDay: "2026-08-06",
        query: "cliente",
      }),
    );
    expect(searched.ok).toBe(true);
    expect(searched.context?.summaries).toHaveLength(1);
  });

  it("GetPaymentStatus for pending refs returns Unpaid; issued invoices UNIMPLEMENTED", async () => {
    const api = facade();
    const pending = await api.getPaymentStatus(
      identity(),
      getPaymentStatusQuery({ invoiceId: "billing-pending:o1" }),
    );
    expect(pending.ok).toBe(true);
    expect(pending.context?.summaries[0]?.paymentStatus).toBe("Unpaid");

    const issued = await api.getPaymentStatus(
      identity(),
      getPaymentStatusQuery({ invoiceId: "inv-real-1" }),
    );
    expect(issued.ok).toBe(false);
    expect(issued.errors[0]?.code).toBe("UNIMPLEMENTED");
  });

  it("Issue / Cancel / Payment / Reopen / GetInvoice are UNIMPLEMENTED", async () => {
    const api = facade();
    const id = identity();

    for (const result of [
      await api.issueInvoice(
        id,
        issueInvoiceCommand({
          operationalDay: "2026-08-06",
          billingRef: "billing-pending:o1",
        }),
      ),
      await api.cancelInvoice(id, cancelInvoiceCommand({ invoiceId: "inv-1" })),
      await api.registerPayment(
        id,
        registerPaymentCommand({
          invoiceId: "inv-1",
          amount: "10",
          currency: "EUR",
        }),
      ),
      await api.markPaymentReceived(
        id,
        markPaymentReceivedCommand({ invoiceId: "inv-1" }),
      ),
      await api.reopenBilling(id, reopenBillingCommand({ invoiceId: "inv-1" })),
    ]) {
      expect(result.ok).toBe(false);
      expect(result.errors[0]?.code).toBe("UNIMPLEMENTED");
    }

    const invoice = await api.getInvoice(
      id,
      getInvoiceQuery({ invoiceId: "inv-1" }),
    );
    expect(invoice.ok).toBe(false);
    expect(invoice.errors[0]?.code).toBe("UNIMPLEMENTED");
  });

  it("session / tenant gates are enforced", async () => {
    const api = facade();
    const noSession = await api.prepareBilling(
      identity({ session: { present: false, userId: null } }),
      prepareBillingCommand({ operationalDay: "2026-08-06" }),
    );
    expect(noSession.ok).toBe(false);
    expect(noSession.errors[0]?.code).toBe("PERMISSION_DENIED");

    const noTenant = await api.listPendingBilling(
      identity({ tenant: null }),
      listPendingBillingQuery({ operationalDay: "2026-08-06" }),
    );
    expect(noTenant.ok).toBe(false);
    expect(noTenant.errors[0]?.code).toBe("TENANT_MISMATCH");
  });

  it("package never imports Supabase / repositories from Facade surface", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/billing/BillingFacade.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/integrations\/supabase/);
    expect(src).not.toMatch(/from ["']@\/services\//);
    expect(src).toContain("getOrderFacade");
    expect(src).toContain("getDeliveryFacade");
    expect(src).toContain("getCustomerFacade");
    expect(src).toContain("getProductionFacade");
    expect(src).toContain("getKitchenExecutionFacade");
    expect(src).toContain("Never ERP");
  });
});
