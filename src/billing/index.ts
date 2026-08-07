/**
 * Billing Capability package — OPERATIONAL-007 Phase 2 (Facade).
 * Public API for Operational Outcome settlement. LAW 002 · 003 · 006 · 007 · PRODUCT LAW 001.
 *
 * Billing does not initiate the operational cycle.
 * Billing certifies the financial outcome of completed work.
 */

export type {
  BillingStatus,
  PaymentStatus,
  InvoiceReference,
  BillingDocumentKind,
  InvoiceLine,
  BillingEvidence,
  BillingDocument,
  BillingSummary,
  BillingCapabilityBits,
  FinancialOutcome,
  BillingContext,
  BillingErrorCode,
  BillingError,
  BillingResult,
  BillingCommandResult,
} from "./BillingContext";

export type {
  PrepareBillingCommand,
  IssueInvoiceCommand,
  CancelInvoiceCommand,
  RegisterPaymentCommand,
  MarkPaymentReceivedCommand,
  ReopenBillingCommand,
  BillingCommand,
} from "./commands";

export {
  prepareBillingCommand,
  issueInvoiceCommand,
  cancelInvoiceCommand,
  registerPaymentCommand,
  markPaymentReceivedCommand,
  reopenBillingCommand,
} from "./commands";

export type {
  GetBillingQuery,
  ListBillingsQuery,
  SearchBillingsQuery,
  GetInvoiceQuery,
  GetPaymentStatusQuery,
  ListPendingBillingQuery,
  BillingQuery,
} from "./queries";

export {
  getBillingQuery,
  listBillingsQuery,
  searchBillingsQuery,
  getInvoiceQuery,
  getPaymentStatusQuery,
  listPendingBillingQuery,
} from "./queries";

export {
  BillingFacade,
  getBillingFacade,
  resetBillingFacade,
  type BillingFacadeDeps,
} from "./BillingFacade";

export { useBilling, type BillingFacadeApi } from "./useBilling";
