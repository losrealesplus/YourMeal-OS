/**
 * PaymentStatus — settlement facet of an Invoice / BillingDocument (ADR 0087).
 * Not a bank integration. Not an ERP ledger state.
 */

export type PaymentStatus =
  | "Unpaid"
  | "PartiallyPaid"
  | "Paid"
  | "Failed"
  | "Waived"
  | "Refunded";
