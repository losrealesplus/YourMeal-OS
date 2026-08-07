/**
 * Billing Commands — Operational Outcome intentions (OPERATIONAL-007 Phase 2).
 * Never CRUD · never ERP · never payment gateway · never mutate Orders/Delivery.
 *
 * Billing does not initiate the operational cycle.
 * Billing certifies / records the financial outcome of completed work.
 */

export type PrepareBillingCommand = {
  type: "PrepareBilling";
  operationalDay: string;
  periodLabel?: string | null;
  customerRef?: string | null;
};

export type IssueInvoiceCommand = {
  type: "IssueInvoice";
  operationalDay: string;
  /** Pending / prepared billing document id or commitment-derived pending ref */
  billingRef: string;
  note?: string | null;
};

export type CancelInvoiceCommand = {
  type: "CancelInvoice";
  invoiceId: string;
  reason?: string | null;
};

export type RegisterPaymentCommand = {
  type: "RegisterPayment";
  invoiceId: string;
  amount: string;
  currency: string;
  note?: string | null;
};

export type MarkPaymentReceivedCommand = {
  type: "MarkPaymentReceived";
  invoiceId: string;
  receivedAt?: string | null;
  note?: string | null;
};

export type ReopenBillingCommand = {
  type: "ReopenBilling";
  invoiceId: string;
  reason?: string | null;
};

export type BillingCommand =
  | PrepareBillingCommand
  | IssueInvoiceCommand
  | CancelInvoiceCommand
  | RegisterPaymentCommand
  | MarkPaymentReceivedCommand
  | ReopenBillingCommand;

export function prepareBillingCommand(
  input: Omit<PrepareBillingCommand, "type">,
): PrepareBillingCommand {
  return { type: "PrepareBilling", ...input };
}

export function issueInvoiceCommand(
  input: Omit<IssueInvoiceCommand, "type">,
): IssueInvoiceCommand {
  return { type: "IssueInvoice", ...input };
}

export function cancelInvoiceCommand(
  input: Omit<CancelInvoiceCommand, "type">,
): CancelInvoiceCommand {
  return { type: "CancelInvoice", ...input };
}

export function registerPaymentCommand(
  input: Omit<RegisterPaymentCommand, "type">,
): RegisterPaymentCommand {
  return { type: "RegisterPayment", ...input };
}

export function markPaymentReceivedCommand(
  input: Omit<MarkPaymentReceivedCommand, "type">,
): MarkPaymentReceivedCommand {
  return { type: "MarkPaymentReceived", ...input };
}

export function reopenBillingCommand(
  input: Omit<ReopenBillingCommand, "type">,
): ReopenBillingCommand {
  return { type: "ReopenBilling", ...input };
}
