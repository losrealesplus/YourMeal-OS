import type { ServiceContext } from "@/services/types";
import { AuditService } from "@/services/audit-service";
import { DomainError, permissionDenied } from "@/domain/errors";
import { createAccountingRepository } from "../infrastructure/accounting-repository";
import {
  canTransitionInvoice,
  currentBillingPeriod,
  type BillableOrder,
  type InvoiceRecord,
  type PaymentRecord,
  type PeriodSummary,
} from "../domain/accounting";
import {
  assertFlow03Prefix,
  beginFlow03Pipeline,
  logFlow03Step,
  stopFlow03,
} from "./flow03-evidence";

function assertTenant(ctx: ServiceContext): void {
  if (!ctx.tenantId || !ctx.userId) {
    throw new DomainError("PERMISSION_DENIED", "Tenant and user required");
  }
}

function assertAccounting(ctx: ServiceContext): void {
  if (!ctx.capabilities.has("accounting.operate")) {
    throw permissionDenied("accounting.operate");
  }
}

export const AccountingService = {
  async listBillableOrders(ctx: ServiceContext): Promise<BillableOrder[]> {
    assertTenant(ctx);
    assertAccounting(ctx);
    if (!ctx.capabilities.has("orders.read")) {
      throw permissionDenied("orders.read");
    }
    const repo = createAccountingRepository(ctx.supabase, ctx.tenantId);
    return repo.listBillableOrders();
  },

  async listInvoices(
    ctx: ServiceContext,
    billingPeriod?: string | null,
  ): Promise<InvoiceRecord[]> {
    assertTenant(ctx);
    assertAccounting(ctx);
    const repo = createAccountingRepository(ctx.supabase, ctx.tenantId);
    return repo.listInvoices(billingPeriod);
  },

  async periodSummary(
    ctx: ServiceContext,
    billingPeriod?: string | null,
  ): Promise<PeriodSummary> {
    assertTenant(ctx);
    assertAccounting(ctx);
    const period = billingPeriod?.trim() || currentBillingPeriod();
    const repo = createAccountingRepository(ctx.supabase, ctx.tenantId);
    return repo.periodSummary(period);
  },

  async createInvoiceFromOrders(
    ctx: ServiceContext,
    input: { orderIds: string[]; billingPeriod?: string | null },
  ): Promise<InvoiceRecord> {
    assertTenant(ctx);
    assertAccounting(ctx);
    if (!ctx.capabilities.has("orders.read")) {
      throw permissionDenied("orders.read");
    }
    if (!input.orderIds.length) {
      throw new DomainError("INVALID_STATE", "Select at least one delivered order");
    }

    const repo = createAccountingRepository(ctx.supabase, ctx.tenantId);
    const orders = await repo.getOrdersByIds(input.orderIds);
    if (orders.length !== input.orderIds.length) {
      throw new DomainError("NOT_FOUND", "One or more orders not found");
    }
    if (orders.some((o) => o.status !== "delivered")) {
      throw new DomainError(
        "INVALID_STATE",
        "Only delivered orders can be invoiced (Orders Delivered input)",
      );
    }

    const customerIds = [
      ...new Set(orders.map((o) => o.customer_id).filter(Boolean)),
    ] as string[];
    const companyIds = [
      ...new Set(orders.map((o) => o.company_id).filter(Boolean)),
    ] as string[];
    if (customerIds.length > 1) {
      throw new DomainError(
        "INVALID_STATE",
        "Orders must belong to the same customer",
      );
    }
    if (companyIds.length > 1) {
      throw new DomainError(
        "INVALID_STATE",
        "Orders must belong to the same company",
      );
    }

    const amount = orders.reduce((s, o) => s + o.total, 0);
    if (amount <= 0) {
      throw new DomainError("INVALID_STATE", "Invoice amount must be positive");
    }

    const billingPeriod =
      input.billingPeriod?.trim() || currentBillingPeriod();
    const orderIds = orders.map((o) => o.id);

    // FLOW03-001 · T1 — delivered → invoice pending (evidence before return)
    beginFlow03Pipeline({
      orderIds,
      tenantId: ctx.tenantId,
      billingPeriod,
    });
    logFlow03Step("FLOW03_T1_STARTED", { orderIds, billingPeriod });

    try {
      const invoice = await repo.createInvoice({
        customerId: customerIds[0] ?? null,
        companyId: companyIds[0] ?? null,
        amount,
        billingPeriod,
        orderIds,
      });

      await AuditService.write(ctx, {
        entityType: "invoice",
        entityId: invoice.id,
        action: "create",
        newData: {
          amount: invoice.amount,
          billingPeriod,
          orderIds: invoice.orderIds,
          lifecycleStage: "pending",
        },
      });

      logFlow03Step("FLOW03_T1_COMPLETED", {
        invoiceId: invoice.id,
        status: invoice.status,
        reviewedAt: invoice.reviewedAt,
        orderIds: invoice.orderIds,
      });

      return invoice;
    } catch (e) {
      stopFlow03("T1_FAILED", {
        orderIds,
        error: e instanceof Error ? e.message : String(e),
      });
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already closed")) {
        throw new DomainError("INVALID_STATE", msg);
      }
      throw e;
    }
  },

  /**
   * FLOW03-002 · T2 — review as audited event (reviewed_at).
   * Status remains `pending` (review is not an InvoiceStatus).
   */
  async reviewInvoice(
    ctx: ServiceContext,
    invoiceId: string,
  ): Promise<InvoiceRecord> {
    assertTenant(ctx);
    assertAccounting(ctx);
    const repo = createAccountingRepository(ctx.supabase, ctx.tenantId);
    const current = await repo.getInvoice(invoiceId);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Invoice ${invoiceId}`);
    }
    if (current.status === "paid" || current.status === "void") {
      throw new DomainError(
        "INVALID_STATE",
        `Cannot review invoice in status ${current.status}`,
      );
    }
    if (current.reviewedAt) {
      throw new DomainError("INVALID_STATE", "Invoice already reviewed");
    }
    if (current.lifecycleStage === "closed") {
      throw new DomainError("INVALID_STATE", "Period already closed");
    }
    if (current.status !== "pending") {
      throw new DomainError(
        "INVALID_STATE",
        `FLOW03-002 requires invoice status pending (got ${current.status})`,
      );
    }

    try {
      assertFlow03Prefix(["FLOW03_T1_STARTED", "FLOW03_T1_COMPLETED"]);
    } catch {
      throw new DomainError(
        "INVALID_STATE",
        "FLOW03-002 requires T1 COMPLETED before reviewInvoice",
      );
    }

    logFlow03Step("FLOW03_T2_STARTED", {
      invoiceId,
      status: current.status,
    });

    try {
      await repo.markInvoiceReviewed(invoiceId);
      await AuditService.write(ctx, {
        entityType: "invoice",
        entityId: invoiceId,
        action: "status_change",
        oldData: { lifecycleStage: "pending" },
        newData: { lifecycleStage: "review", reviewedAt: true },
      });

      const updated = await repo.getInvoice(invoiceId);
      if (!updated) throw new DomainError("NOT_FOUND", invoiceId);
      if (updated.status !== "pending") {
        stopFlow03("T2_STATUS_DRIFT", {
          invoiceId,
          status: updated.status,
        });
        throw new DomainError(
          "INVALID_STATE",
          "FLOW03-002 invariant: status must remain pending after review",
        );
      }
      if (!updated.reviewedAt) {
        stopFlow03("T2_REVIEW_MISSING", { invoiceId });
        throw new DomainError(
          "INVALID_STATE",
          "FLOW03-002: reviewed_at not set after reviewInvoice",
        );
      }

      logFlow03Step("FLOW03_T2_COMPLETED", {
        invoiceId: updated.id,
        status: updated.status,
        reviewedAt: updated.reviewedAt,
      });

      return updated;
    } catch (e) {
      if (e instanceof DomainError) throw e;
      stopFlow03("T2_FAILED", {
        invoiceId,
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  },

  async recordPayment(
    ctx: ServiceContext,
    input: { invoiceId: string; amount?: number | null; method?: string | null },
  ): Promise<{ invoice: InvoiceRecord; payment: PaymentRecord }> {
    assertTenant(ctx);
    assertAccounting(ctx);
    const repo = createAccountingRepository(ctx.supabase, ctx.tenantId);
    const current = await repo.getInvoice(input.invoiceId);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Invoice ${input.invoiceId}`);
    }
    if (current.status === "paid" || current.status === "void") {
      throw new DomainError(
        "INVALID_STATE",
        `Cannot record payment on invoice status ${current.status}`,
      );
    }
    if (current.lifecycleStage === "closed") {
      throw new DomainError("INVALID_STATE", "Period already closed");
    }
    if (!current.reviewedAt) {
      throw new DomainError(
        "INVALID_STATE",
        "Invoice must be reviewed before payment (Pending → Review → Processed)",
      );
    }

    const remaining = Math.max(0, current.amount - current.paidTotal);
    const amount = input.amount != null ? Number(input.amount) : remaining;
    if (!(amount > 0)) {
      throw new DomainError("INVALID_STATE", "Payment amount must be positive");
    }
    if (amount > remaining + 0.001) {
      throw new DomainError(
        "INVALID_STATE",
        "Payment exceeds remaining invoice balance",
      );
    }

    const payment = await repo.insertPayment({
      invoiceId: current.id,
      amount,
      method: input.method?.trim() || "manual",
    });

    const newPaid = current.paidTotal + amount;
    if (newPaid + 0.001 >= current.amount) {
      await repo.updateInvoiceStatus(current.id, "paid");
    }

    await AuditService.write(ctx, {
      entityType: "payment",
      entityId: payment.id,
      action: "create",
      newData: {
        invoiceId: current.id,
        amount: payment.amount,
        method: payment.method,
        lifecycleStage: "processed",
      },
    });

    const updated = await repo.getInvoice(current.id);
    if (!updated) {
      throw new DomainError("NOT_FOUND", `Invoice ${current.id} after payment`);
    }
    return { invoice: updated, payment };
  },

  async voidInvoice(ctx: ServiceContext, invoiceId: string): Promise<InvoiceRecord> {
    assertTenant(ctx);
    assertAccounting(ctx);
    const repo = createAccountingRepository(ctx.supabase, ctx.tenantId);
    const current = await repo.getInvoice(invoiceId);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Invoice ${invoiceId}`);
    }
    if (current.lifecycleStage === "closed") {
      throw new DomainError("INVALID_STATE", "Period already closed");
    }
    if (!canTransitionInvoice(current.status, "void")) {
      throw new DomainError(
        "INVALID_STATE",
        `Cannot void invoice from status ${current.status}`,
      );
    }
    await repo.updateInvoiceStatus(invoiceId, "void");
    await AuditService.write(ctx, {
      entityType: "invoice",
      entityId: invoiceId,
      action: "status_change",
      oldData: { status: current.status },
      newData: { status: "void" },
    });
    const updated = await repo.getInvoice(invoiceId);
    if (!updated) throw new DomainError("NOT_FOUND", invoiceId);
    return updated;
  },

  /** Close Financial Period → Outcome Financial Records Complete. */
  async closeFinancialPeriod(
    ctx: ServiceContext,
    billingPeriod?: string | null,
  ): Promise<PeriodSummary> {
    assertTenant(ctx);
    assertAccounting(ctx);
    const period = billingPeriod?.trim() || currentBillingPeriod();
    const repo = createAccountingRepository(ctx.supabase, ctx.tenantId);
    const summary = await repo.periodSummary(period);

    if (summary.periodClosed) {
      throw new DomainError(
        "INVALID_STATE",
        `Period ${period} is already closed`,
      );
    }
    if (!summary.readyToClose) {
      throw new DomainError(
        "INVALID_STATE",
        `Period ${period} is not ready to close (need invoices with no pending/overdue)`,
      );
    }

    await repo.closePeriod(period, ctx.userId, {
      invoiceCount: summary.invoiceCount,
      paidAmount: summary.paidAmount,
    });

    await AuditService.write(ctx, {
      entityType: "financial_period",
      entityId: `${ctx.tenantId}:${period}`,
      action: "status_change",
      oldData: { periodClosed: false },
      newData: {
        periodClosed: true,
        billingPeriod: period,
        lifecycleStage: "closed",
        outcome: "Financial Records Complete",
      },
    });

    return repo.periodSummary(period);
  },
};
