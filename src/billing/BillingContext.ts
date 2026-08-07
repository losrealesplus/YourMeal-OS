/**
 * Re-export Billing contracts at package root (Facade consumption pattern).
 * Source of truth remains `src/billing/contracts/` (ADR 0087).
 */

export type {
  BillingStatus,
} from "./contracts/BillingStatus";
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
