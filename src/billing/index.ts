/**
 * Billing Capability — public contracts only (OPERATIONAL-007 · Phase 1).
 *
 * Architecture Freeze. No Facade · Commands · Queries · Services · Repositories · UI.
 * Final Operational Outcome Capability — closes the Operational Engine chain.
 *
 * @see docs/05-architecture/BILLING_CAPABILITY.md
 * @see docs/adr/0087-billing-capability.md
 */

export type { BillingStatus } from "./contracts/BillingStatus";
export type { PaymentStatus } from "./contracts/PaymentStatus";
export type { InvoiceReference } from "./contracts/InvoiceReference";
export type {
  BillingDocumentKind,
  InvoiceLine,
  BillingEvidence,
  BillingDocument,
} from "./contracts/BillingDocument";
export type { BillingSummary } from "./contracts/BillingSummary";
export type {
  BillingCapabilityBits,
  FinancialOutcome,
  BillingContext,
} from "./contracts/BillingContext";
export type {
  BillingErrorCode,
  BillingError,
  BillingResult,
  BillingCommandResult,
} from "./contracts/BillingResult";
