/**
 * BillingSummary — compact read model for lists / boards (ADR 0087).
 */

import type { BillingStatus } from "./BillingStatus";
import type { PaymentStatus } from "./PaymentStatus";
import type { BillingDocumentKind } from "./BillingDocument";

export type BillingSummary = {
  id: string;
  tenantId: string;
  kind: BillingDocumentKind;
  status: BillingStatus;
  paymentStatus: PaymentStatus;
  customerRef: string;
  customerLabel: string;
  periodLabel: string | null;
  operationalDay: string | null;
  currency: string;
  totalAmount: string;
  amountPaid: string;
  lineCount: number;
  /** True when all referenced operational work is Delivered / Confirmed upstream */
  readyFromFulfillment: boolean;
};
