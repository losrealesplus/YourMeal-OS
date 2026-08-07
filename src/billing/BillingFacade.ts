/**
 * BillingFacade — sole public Outcome API for Billing Capability (ADR 0088).
 *
 * Final Operational Engine Capability facade (Operational Outcome).
 *
 * Billing does not initiate the operational cycle.
 * Billing certifies / records the financial outcome of successfully completed work.
 *
 * Consumes certified Facades only. Never ERP · tax · bank · Supabase · repositories.
 *
 * LAW 006: What financial outcome must be produced
 * from successfully completed operational work?
 */

import {
  getOrderFacade,
  type OrderFacade,
} from "@/order/OrderFacade";
import {
  getDeliveryFacade,
  type DeliveryFacade,
} from "@/delivery/DeliveryFacade";
import {
  getCustomerFacade,
  type CustomerFacade,
} from "@/customer/CustomerFacade";
import {
  getProductionFacade,
  type ProductionFacade,
} from "@/production/ProductionFacade";
import {
  getKitchenExecutionFacade,
  type KitchenExecutionFacade,
} from "@/kitchen/KitchenExecutionFacade";
import type {
  BillingCommandResult,
  BillingResult,
  BillingStatus,
} from "./BillingContext";
import type {
  BillingCommand,
  CancelInvoiceCommand,
  IssueInvoiceCommand,
  MarkPaymentReceivedCommand,
  PrepareBillingCommand,
  RegisterPaymentCommand,
  ReopenBillingCommand,
} from "./commands";
import type {
  BillingQuery,
  GetBillingQuery,
  GetInvoiceQuery,
  GetPaymentStatusQuery,
  ListBillingsQuery,
  ListPendingBillingQuery,
  SearchBillingsQuery,
} from "./queries";
import type { BillingRuntimeIdentity } from "./billingServiceContext";
import {
  buildBillingContext,
  commitmentRefFromPendingBillingRef,
  failCommand,
  failResult,
  invoiceRefFromPending,
  mapDeliveredSummaryToBillingSummary,
  mapOrderError,
  okCommand,
  okResult,
  requireSession,
  unimplementedError,
} from "./mapBilling";

export type BillingFacadeDeps = {
  orders: OrderFacade;
  delivery: DeliveryFacade;
  customers: CustomerFacade;
  production: ProductionFacade;
  kitchen: KitchenExecutionFacade;
};

const defaultDeps = (): BillingFacadeDeps => ({
  orders: getOrderFacade(),
  delivery: getDeliveryFacade(),
  customers: getCustomerFacade(),
  production: getProductionFacade(),
  kitchen: getKitchenExecutionFacade(),
});

export class BillingFacade {
  private readonly deps: BillingFacadeDeps;

  constructor(deps: Partial<BillingFacadeDeps> = {}) {
    this.deps = { ...defaultDeps(), ...deps };
  }

  async execute(
    identity: BillingRuntimeIdentity,
    command: BillingCommand,
  ): Promise<BillingCommandResult> {
    switch (command.type) {
      case "PrepareBilling":
        return this.prepareBilling(identity, command);
      case "IssueInvoice":
        return this.issueInvoice(identity, command);
      case "CancelInvoice":
        return this.cancelInvoice(identity, command);
      case "RegisterPayment":
        return this.registerPayment(identity, command);
      case "MarkPaymentReceived":
        return this.markPaymentReceived(identity, command);
      case "ReopenBilling":
        return this.reopenBilling(identity, command);
      default: {
        const _exhaustive: never = command;
        return failCommand([
          {
            code: "UNKNOWN",
            message: `Unknown command: ${String(_exhaustive)}`,
            recoverable: false,
          },
        ]);
      }
    }
  }

  /**
   * Passive certification: derive ReadyToBill Outcome from completed fulfillment.
   * Does not create demand. Does not issue invoices. Does not mutate Orders/Delivery.
   */
  async prepareBilling(
    identity: BillingRuntimeIdentity,
    command: PrepareBillingCommand,
  ): Promise<BillingCommandResult> {
    const loaded = await this.loadPendingContext(
      identity,
      command.operationalDay,
      command.periodLabel ?? null,
      command.customerRef ?? null,
    );
    if (!loaded.ok || !loaded.context) {
      return failCommand(loaded.errors);
    }
    return okCommand({
      invoiceRef: loaded.context.invoiceRefs[0] ?? null,
      status: "ReadyToBill" satisfies BillingStatus,
      context: loaded.context,
    });
  }

  async issueInvoice(
    identity: BillingRuntimeIdentity,
    command: IssueInvoiceCommand,
  ): Promise<BillingCommandResult> {
    const gate = requireSession(identity);
    if (gate) {
      return failCommand(
        [gate],
        invoiceRefFromPending(
          identity.tenant?.id ?? "unknown",
          commitmentRefFromPendingBillingRef(command.billingRef) ??
            command.billingRef,
        ),
      );
    }
    return failCommand(
      [
        unimplementedError("IssueInvoice", {
          billingRef: command.billingRef,
        }),
      ],
      {
        id: command.billingRef,
        tenantId: identity.tenant!.id,
        label: null,
      },
    );
  }

  async cancelInvoice(
    identity: BillingRuntimeIdentity,
    command: CancelInvoiceCommand,
  ): Promise<BillingCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate]);
    return failCommand([
      unimplementedError("CancelInvoice", { invoiceId: command.invoiceId }),
    ]);
  }

  async registerPayment(
    identity: BillingRuntimeIdentity,
    command: RegisterPaymentCommand,
  ): Promise<BillingCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate]);
    return failCommand([
      unimplementedError("RegisterPayment", {
        invoiceId: command.invoiceId,
        amount: command.amount,
      }),
    ]);
  }

  async markPaymentReceived(
    identity: BillingRuntimeIdentity,
    command: MarkPaymentReceivedCommand,
  ): Promise<BillingCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate]);
    return failCommand([
      unimplementedError("MarkPaymentReceived", {
        invoiceId: command.invoiceId,
      }),
    ]);
  }

  async reopenBilling(
    identity: BillingRuntimeIdentity,
    command: ReopenBillingCommand,
  ): Promise<BillingCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate]);
    return failCommand([
      unimplementedError("ReopenBilling", { invoiceId: command.invoiceId }),
    ]);
  }

  async query(
    identity: BillingRuntimeIdentity,
    q: BillingQuery,
  ): Promise<BillingResult> {
    switch (q.type) {
      case "GetBilling":
        return this.getBilling(identity, q);
      case "ListBillings":
        return this.listBillings(identity, q);
      case "SearchBillings":
        return this.searchBillings(identity, q);
      case "GetInvoice":
        return this.getInvoice(identity, q);
      case "GetPaymentStatus":
        return this.getPaymentStatus(identity, q);
      case "ListPendingBilling":
        return this.listPendingBilling(identity, q);
      default: {
        const _exhaustive: never = q;
        return failResult([
          {
            code: "UNKNOWN",
            message: `Unknown query: ${String(_exhaustive)}`,
            recoverable: false,
          },
        ]);
      }
    }
  }

  async getBilling(
    identity: BillingRuntimeIdentity,
    q: GetBillingQuery,
  ): Promise<BillingResult> {
    return this.loadPendingContext(
      identity,
      q.operationalDay,
      q.periodLabel ?? null,
      null,
    );
  }

  async listBillings(
    identity: BillingRuntimeIdentity,
    q: ListBillingsQuery,
  ): Promise<BillingResult> {
    return this.loadPendingContext(
      identity,
      q.operationalDay,
      q.periodLabel ?? null,
      null,
    );
  }

  async searchBillings(
    identity: BillingRuntimeIdentity,
    q: SearchBillingsQuery,
  ): Promise<BillingResult> {
    const loaded = await this.loadPendingContext(
      identity,
      q.operationalDay,
      null,
      q.customerRef ?? null,
    );
    if (!loaded.ok || !loaded.context) return loaded;

    let summaries = loaded.context.summaries;
    if (q.status) {
      summaries = summaries.filter((s) => s.status === q.status);
    }
    if (q.query?.trim()) {
      const needle = q.query.trim().toLowerCase();
      summaries = summaries.filter(
        (s) =>
          s.customerLabel.toLowerCase().includes(needle) ||
          s.customerRef.toLowerCase().includes(needle) ||
          s.id.toLowerCase().includes(needle),
      );
    }
    const context = buildBillingContext(
      loaded.context.tenantId,
      loaded.context.operationalDay,
      loaded.context.periodLabel,
      summaries,
      identity,
    );
    return okResult(context);
  }

  /**
   * Issued Invoice substrate not yet exposed — visible UNIMPLEMENTED gap.
   */
  async getInvoice(
    identity: BillingRuntimeIdentity,
    q: GetInvoiceQuery,
  ): Promise<BillingResult> {
    const gate = requireSession(identity);
    if (gate) return failResult([gate]);
    void q;
    return failResult([unimplementedError("GetInvoice", { invoiceId: q.invoiceId })]);
  }

  /**
   * For pending settlement refs derived from delivered work → Unpaid / ReadyToBill.
   * Issued invoice payment substrate → UNIMPLEMENTED.
   */
  async getPaymentStatus(
    identity: BillingRuntimeIdentity,
    q: GetPaymentStatusQuery,
  ): Promise<BillingResult> {
    const gate = requireSession(identity);
    if (gate) return failResult([gate]);

    const commitmentRef = commitmentRefFromPendingBillingRef(q.invoiceId);
    if (!commitmentRef) {
      return failResult([
        unimplementedError("GetPaymentStatus", {
          invoiceId: q.invoiceId,
          reason: "issued_invoice_substrate_missing",
        }),
      ]);
    }

    const searched = await this.deps.orders.searchOrders(identity, {
      type: "SearchOrders",
      status: ["delivered"],
      limit: 100,
    });
    if (!searched.ok) {
      return failResult(searched.errors.map(mapOrderError));
    }

    const summary = searched.summaries.find((s) => s.id === commitmentRef);
    if (!summary) {
      return failResult([
        {
          code: "NOT_FOUND",
          message: `Pending billing ref not found: ${q.invoiceId}`,
          recoverable: true,
        },
      ]);
    }

    const billingSummary = mapDeliveredSummaryToBillingSummary(summary);
    const context = buildBillingContext(
      identity.tenant!.id,
      summary.deliveryDayPrimary,
      summary.week.label ?? summary.week.weekStart,
      [billingSummary],
      identity,
    );
    return okResult(context);
  }

  async listPendingBilling(
    identity: BillingRuntimeIdentity,
    q: ListPendingBillingQuery,
  ): Promise<BillingResult> {
    return this.loadPendingContext(
      identity,
      q.operationalDay,
      q.periodLabel ?? null,
      null,
    );
  }

  /**
   * Compose completed Delivery + Order facts into ReadyToBill Outcome.
   * Touches Customer / Production / Kitchen so the Engine dependency chain stays exercised
   * without inventing settlement substrate.
   */
  private async loadPendingContext(
    identity: BillingRuntimeIdentity,
    operationalDay: string,
    periodLabel: string | null,
    customerRef: string | null,
  ): Promise<BillingResult> {
    const gate = requireSession(identity);
    if (gate) return failResult([gate]);

    const tenantId = identity.tenant!.id;

    // Certify fulfillment closed — Delivery owns transfer confirmation.
    const completed = await this.deps.delivery.getCompletedDeliveries(identity, {
      type: "GetCompletedDeliveries",
      operationalDay,
    });
    if (!completed.ok) {
      return failResult(
        completed.errors.map((e) => ({
          code: e.code as BillingResult["errors"][number]["code"],
          message: e.message,
          recoverable: e.recoverable,
          evidence: e.evidence,
        })),
      );
    }

    const searched = await this.deps.orders.searchOrders(identity, {
      type: "SearchOrders",
      status: ["delivered"],
      deliveryDay: operationalDay,
      limit: 100,
    });
    if (!searched.ok) {
      return failResult(searched.errors.map(mapOrderError));
    }

    // Exercise Customer / Production / Kitchen Facades (compose chain) — no business invention.
    await this.deps.customers.searchCustomers(identity, {
      type: "SearchCustomers",
      query: customerRef ?? "",
    });
    await this.deps.production.getProductionPlan(identity, {
      type: "GetProductionPlan",
      dayDate: operationalDay,
    });
    await this.deps.kitchen.getCompletedExecution(identity, {
      type: "GetCompletedExecution",
      dayDate: operationalDay,
    });

    let summaries = searched.summaries
      .filter((s) => s.status === "delivered")
      .map(mapDeliveredSummaryToBillingSummary);

    if (customerRef) {
      summaries = summaries.filter((s) => s.customerRef === customerRef);
    }

    const context = buildBillingContext(
      tenantId,
      operationalDay,
      periodLabel,
      summaries,
      identity,
    );
    return okResult(context);
  }
}

let singleton: BillingFacade | null = null;

export function getBillingFacade(): BillingFacade {
  if (!singleton) singleton = new BillingFacade();
  return singleton;
}

export function resetBillingFacade(): void {
  singleton = null;
}
