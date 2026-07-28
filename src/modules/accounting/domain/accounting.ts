/**
 * Accounting domain — Financial Records Complete (EP-OPS-003 Correction P0).
 *
 * Journey lifecycle (brief mapping → as-built):
 *   Pending Financial Items  → billable delivered orders / invoice pending
 *   Review                   → invoice.reviewed_at set
 *   Processed                → invoice status paid (payment recorded)
 *   Closed                   → financial_period_closures row
 *
 * Physical: invoices, payments, invoice_orders, orders(delivered),
 *           financial_period_closures
 */

export type InvoiceStatus = "pending" | "paid" | "overdue" | "void";

/** Deterministic Journey stages (no ambiguous states). */
export type FinancialLifecycleStage =
  | "pending"
  | "review"
  | "processed"
  | "closed";

export type BillableOrder = {
  id: string;
  customerId: string | null;
  customerName: string | null;
  companyId: string | null;
  companyName: string | null;
  total: number;
  deliveredAt: string;
  status: string;
};

export type InvoiceRecord = {
  id: string;
  customerId: string | null;
  customerName: string | null;
  companyId: string | null;
  companyName: string | null;
  amount: number;
  status: InvoiceStatus;
  billingPeriod: string | null;
  createdAt: string;
  reviewedAt: string | null;
  orderIds: string[];
  paidTotal: number;
  /** Derived Journey stage for this invoice (period closed elevates to closed). */
  lifecycleStage: FinancialLifecycleStage;
};

export type PaymentRecord = {
  id: string;
  invoiceId: string;
  amount: number;
  method: string | null;
  paidAt: string | null;
  status: string;
};

export type PeriodSummary = {
  billingPeriod: string;
  invoiceCount: number;
  pendingCount: number;
  paidCount: number;
  voidCount: number;
  overdueCount: number;
  reviewPendingCount: number;
  invoicedAmount: number;
  paidAmount: number;
  /** Preconditions met to close (Processed, no open items). */
  readyToClose: boolean;
  /** Explicit Close Financial Period executed. */
  periodClosed: boolean;
  closedAt: string | null;
  /**
   * Outcome Financial Records Complete =
   * periodClosed OR (readyToClose demonstrated with closure path available).
   * Certification requires periodClosed after close action.
   */
  recordsComplete: boolean;
};

const INVOICE_TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  pending: ["paid", "overdue", "void"],
  overdue: ["paid", "void"],
  paid: [],
  void: [],
};

export function nextInvoiceStatuses(from: InvoiceStatus): InvoiceStatus[] {
  return [...(INVOICE_TRANSITIONS[from] ?? [])];
}

export function canTransitionInvoice(
  from: InvoiceStatus,
  to: InvoiceStatus,
): boolean {
  return nextInvoiceStatuses(from).includes(to);
}

export function currentBillingPeriod(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function deriveInvoiceLifecycleStage(input: {
  status: InvoiceStatus;
  reviewedAt: string | null;
  periodClosed: boolean;
}): FinancialLifecycleStage {
  if (input.periodClosed) return "closed";
  if (input.status === "paid") return "processed";
  if (input.status === "void") return "processed";
  if (input.reviewedAt) return "review";
  return "pending";
}

export function derivePeriodReadyToClose(summary: {
  invoiceCount: number;
  pendingCount: number;
  overdueCount: number;
}): boolean {
  return (
    summary.invoiceCount > 0 &&
    summary.pendingCount === 0 &&
    summary.overdueCount === 0
  );
}

/** @deprecated use derivePeriodReadyToClose */
export function derivePeriodComplete(summary: {
  invoiceCount: number;
  pendingCount: number;
  overdueCount: number;
}): boolean {
  return derivePeriodReadyToClose(summary);
}

export const FINANCIAL_LIFECYCLE: readonly FinancialLifecycleStage[] = [
  "pending",
  "review",
  "processed",
  "closed",
] as const;
