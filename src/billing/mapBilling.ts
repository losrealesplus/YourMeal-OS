/**
 * INTERNAL — map completed operational work → Billing Outcome read models.
 * Billing never invents demand · never mutates Orders / Delivery.
 */

import type { OrderError, OrderSummary } from "@/order/OrderContext";
import type {
  BillingCapabilityBits,
  BillingCommandResult,
  BillingContext,
  BillingError,
  BillingErrorCode,
  BillingResult,
  BillingStatus,
  BillingSummary,
  FinancialOutcome,
  InvoiceReference,
} from "./BillingContext";
import type { BillingRuntimeIdentity } from "./billingServiceContext";

/** Pending settlement handle derived from a completed commitment (not an issued Invoice). */
export function pendingBillingRefForCommitment(commitmentRef: string): string {
  return `billing-pending:${commitmentRef}`;
}

export function commitmentRefFromPendingBillingRef(
  billingRef: string,
): string | null {
  const m = /^billing-pending:(.+)$/.exec(billingRef);
  return m?.[1] ?? null;
}

export function invoiceRefFromPending(
  tenantId: string,
  commitmentRef: string,
): InvoiceReference {
  return {
    id: pendingBillingRefForCommitment(commitmentRef),
    tenantId,
    label: null,
  };
}

export function mapDeliveredSummaryToBillingSummary(
  summary: OrderSummary,
): BillingSummary {
  return {
    id: pendingBillingRefForCommitment(summary.id),
    tenantId: summary.tenantId,
    kind: "Invoice",
    status: "ReadyToBill",
    paymentStatus: "Unpaid",
    customerRef: summary.partyRef.id,
    customerLabel: summary.partyRef.displayName || summary.partyRef.id,
    periodLabel: summary.week.label ?? summary.week.weekStart,
    operationalDay: summary.deliveryDayPrimary,
    currency: summary.currency,
    totalAmount: String(summary.total),
    amountPaid: "0",
    lineCount: summary.itemCount,
    readyFromFulfillment: summary.status === "delivered",
  };
}

export function billingCapabilityBitsFromIdentity(
  identity: BillingRuntimeIdentity,
): BillingCapabilityBits {
  const caps = new Set(identity.permissions.capabilities);
  const accounting = caps.has("accounting.operate");
  return {
    canPrepare: accounting || caps.has("orders.read"),
    canInvoice: accounting,
    canRecordPayment: accounting,
    canViewEvidence: accounting || caps.has("orders.read"),
  };
}

export function buildFinancialOutcome(
  tenantId: string,
  periodLabel: string,
  operationalDay: string | null,
  summaries: BillingSummary[],
): FinancialOutcome {
  const currency = summaries[0]?.currency ?? "EUR";
  let outstanding = 0;
  for (const s of summaries) {
    if (s.status !== "Paid" && s.status !== "Cancelled") {
      outstanding += Number(s.totalAmount) || 0;
    }
  }
  return {
    tenantId,
    periodLabel,
    operationalDay,
    documentCount: summaries.length,
    readyToBillCount: summaries.filter((s) => s.status === "ReadyToBill").length,
    invoicedCount: summaries.filter(
      (s) =>
        s.status === "Invoiced" ||
        s.status === "PartiallyPaid" ||
        s.status === "Paid",
    ).length,
    paidCount: summaries.filter((s) => s.status === "Paid").length,
    outstandingAmount: String(outstanding),
    currency,
  };
}

export function buildBillingContext(
  tenantId: string,
  operationalDay: string | null,
  periodLabel: string | null,
  summaries: BillingSummary[],
  identity: BillingRuntimeIdentity,
): BillingContext {
  const label = periodLabel ?? operationalDay ?? "open";
  return {
    tenantId,
    operationalDay,
    periodLabel: periodLabel ?? null,
    summaries,
    documents: [],
    invoiceRefs: summaries.map((s) => ({
      id: s.id,
      tenantId,
      label: s.customerLabel,
    })),
    outcome: buildFinancialOutcome(tenantId, label, operationalDay, summaries),
    permissions: billingCapabilityBitsFromIdentity(identity),
  };
}

export function mapOrderError(err: OrderError): BillingError {
  return {
    code: orderCodeToBilling(err.code),
    message: err.message,
    recoverable: err.recoverable,
    evidence: err.evidence,
  };
}

function orderCodeToBilling(code: OrderError["code"]): BillingErrorCode {
  switch (code) {
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "TENANT_MISMATCH":
      return "TENANT_MISMATCH";
    case "PERMISSION_DENIED":
      return "PERMISSION_DENIED";
    case "INVALID_STATE":
      return "INVALID_STATE";
    case "UNIMPLEMENTED":
      return "UNIMPLEMENTED";
    default:
      return "UNKNOWN";
  }
}

export function unimplementedError(
  intent: string,
  evidence?: Record<string, unknown>,
): BillingError {
  return {
    code: "UNIMPLEMENTED",
    message: `${intent} is not implemented yet (Billing Facade · Outcome substrate gap)`,
    recoverable: true,
    evidence: { intent, ...evidence },
  };
}

export function requireSession(
  identity: BillingRuntimeIdentity,
): BillingError | null {
  if (!identity.session.present || !identity.session.userId) {
    return {
      code: "PERMISSION_DENIED",
      message: "Authenticated session required for Billing operations",
      recoverable: true,
    };
  }
  if (!identity.tenant?.id) {
    return {
      code: "TENANT_MISMATCH",
      message: "Tenant required for Billing operations",
      recoverable: true,
    };
  }
  return null;
}

export function failCommand(
  errors: BillingError[],
  invoiceRef: InvoiceReference | null = null,
  status: BillingStatus | null = null,
): BillingCommandResult {
  return {
    ok: false,
    invoiceRef,
    status,
    context: null,
    errors,
  };
}

export function okCommand(input: {
  invoiceRef: InvoiceReference | null;
  status: BillingStatus | null;
  context: BillingContext;
}): BillingCommandResult {
  return {
    ok: true,
    invoiceRef: input.invoiceRef,
    status: input.status,
    context: input.context,
    errors: [],
  };
}

export function failResult(errors: BillingError[]): BillingResult {
  return { ok: false, context: null, errors };
}

export function okResult(context: BillingContext): BillingResult {
  return { ok: true, context, errors: [] };
}
