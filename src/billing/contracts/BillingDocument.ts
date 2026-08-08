/**
 * BillingDocument — Invoice / Credit Note as Operational Outcome artefacts (ADR 0087).
 *
 * Avoid: Accounting · ERP · Ledger · Tax Engine · Bank.
 * Those belong to external accounting systems, not YourMeal OS Operational Engine.
 */

import type { BillingStatus } from "./BillingStatus";
import type { PaymentStatus } from "./PaymentStatus";

export type BillingDocumentKind = "Invoice" | "CreditNote";

export type InvoiceLine = {
  id: string;
  /** Upstream operational commitment (Order) when applicable */
  commitmentRef: string | null;
  /** Upstream Delivery confirmation / assignment when applicable */
  fulfillmentRef: string | null;
  description: string;
  quantity: number;
  /** Minor units or decimal string — Facade decides encoding; Architecture freezes shape only */
  unitAmount: string;
  lineAmount: string;
};

export type BillingEvidence = {
  id: string;
  documentId: string;
  kind: "note" | "attachment_ref" | "external_ack" | "other";
  ref: string;
  recordedAt: string;
};

export type BillingDocument = {
  id: string;
  tenantId: string;
  kind: BillingDocumentKind;
  status: BillingStatus;
  paymentStatus: PaymentStatus;
  /** Customer (Business Entity) billed */
  customerRef: string;
  /** Operational period / day this outcome covers */
  operationalDay: string | null;
  /** Week label when weekly catering settlement applies */
  periodLabel: string | null;
  lines: InvoiceLine[];
  /** When kind === CreditNote, the invoice being adjusted */
  relatedInvoiceId: string | null;
  currency: string;
  totalAmount: string;
  amountPaid: string;
  issuedAt: string | null;
  dueAt: string | null;
  evidence: BillingEvidence[];
};
