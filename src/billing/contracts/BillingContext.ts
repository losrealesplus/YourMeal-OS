/**
 * BillingContext — canonical Outcome read model (ADR 0087).
 *
 * LAW 006: What financial outcome must be produced
 * from successfully completed operational work?
 */

import type { BillingSummary } from "./BillingSummary";
import type { BillingDocument } from "./BillingDocument";
import type { InvoiceReference } from "./InvoiceReference";

export type BillingCapabilityBits = {
  canPrepare: boolean;
  canInvoice: boolean;
  canRecordPayment: boolean;
  canViewEvidence: boolean;
};

/**
 * FinancialOutcome — the business meaning of Billing (not an ERP posting).
 * Engine ends here: Context → Entity → Planning → Execution → Outcome.
 */
export type FinancialOutcome = {
  tenantId: string;
  /** Scope of settlement (day / week / custom period label) */
  periodLabel: string;
  operationalDay: string | null;
  documentCount: number;
  readyToBillCount: number;
  invoicedCount: number;
  paidCount: number;
  outstandingAmount: string;
  currency: string;
};

export type BillingContext = {
  tenantId: string;
  operationalDay: string | null;
  periodLabel: string | null;
  summaries: BillingSummary[];
  /** Selected / focused documents when loaded */
  documents: BillingDocument[];
  invoiceRefs: InvoiceReference[];
  outcome: FinancialOutcome | null;
  permissions: BillingCapabilityBits;
};
