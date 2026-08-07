/**
 * BillingStatus — Operational Outcome lifecycle (ADR 0087).
 * @see docs/05-architecture/BILLING_CAPABILITY.md
 *
 * Billing never creates demand · never plans · never executes.
 * Billing records the financial outcome of completed operational work.
 */

export type BillingStatus =
  | "Pending"
  | "ReadyToBill"
  | "Invoiced"
  | "PartiallyPaid"
  | "Paid"
  | "Cancelled";

/**
 * Frozen lifecycle (Architecture Freeze):
 *
 * Pending → ReadyToBill → Invoiced → PartiallyPaid → Paid
 *                                              ↘ Cancelled (from Pending / ReadyToBill / Invoiced when allowed)
 */
