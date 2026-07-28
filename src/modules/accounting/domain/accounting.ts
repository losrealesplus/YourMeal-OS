/**
 * Accounting domain — Financial Records Complete (EP-OPS-003).
 * Physical tables: invoices, payments, invoice_orders, orders (delivered).
 */

export type InvoiceStatus = "pending" | "paid" | "overdue" | "void";

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
  orderIds: string[];
  paidTotal: number;
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
  invoicedAmount: number;
  paidAmount: number;
  /** Complete when there is ≥1 invoice and zero pending/overdue. */
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

export function derivePeriodComplete(summary: {
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
