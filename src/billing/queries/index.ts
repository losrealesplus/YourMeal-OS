/**
 * Billing Queries — Operational Outcome reads (OPERATIONAL-007 Phase 2).
 */

import type { BillingStatus } from "../contracts/BillingStatus";

export type GetBillingQuery = {
  type: "GetBilling";
  operationalDay: string;
  periodLabel?: string | null;
};

export type ListBillingsQuery = {
  type: "ListBillings";
  operationalDay: string;
  periodLabel?: string | null;
};

export type SearchBillingsQuery = {
  type: "SearchBillings";
  operationalDay: string;
  customerRef?: string | null;
  status?: BillingStatus;
  query?: string | null;
};

export type GetInvoiceQuery = {
  type: "GetInvoice";
  invoiceId: string;
};

export type GetPaymentStatusQuery = {
  type: "GetPaymentStatus";
  invoiceId: string;
};

export type ListPendingBillingQuery = {
  type: "ListPendingBilling";
  operationalDay: string;
  periodLabel?: string | null;
};

export type BillingQuery =
  | GetBillingQuery
  | ListBillingsQuery
  | SearchBillingsQuery
  | GetInvoiceQuery
  | GetPaymentStatusQuery
  | ListPendingBillingQuery;

export function getBillingQuery(
  input: Omit<GetBillingQuery, "type">,
): GetBillingQuery {
  return { type: "GetBilling", ...input };
}

export function listBillingsQuery(
  input: Omit<ListBillingsQuery, "type">,
): ListBillingsQuery {
  return { type: "ListBillings", ...input };
}

export function searchBillingsQuery(
  input: Omit<SearchBillingsQuery, "type">,
): SearchBillingsQuery {
  return { type: "SearchBillings", ...input };
}

export function getInvoiceQuery(
  input: Omit<GetInvoiceQuery, "type">,
): GetInvoiceQuery {
  return { type: "GetInvoice", ...input };
}

export function getPaymentStatusQuery(
  input: Omit<GetPaymentStatusQuery, "type">,
): GetPaymentStatusQuery {
  return { type: "GetPaymentStatus", ...input };
}

export function listPendingBillingQuery(
  input: Omit<ListPendingBillingQuery, "type">,
): ListPendingBillingQuery {
  return { type: "ListPendingBilling", ...input };
}
