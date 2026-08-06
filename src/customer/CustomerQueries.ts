/**
 * Customer Queries — read intents (OPERATIONAL-002 Phase 2).
 *
 * Expressive business reads — not `customer.search()` repository speak.
 */

import type { PartyKind, PartyRef } from "./CustomerContext";

export type GetCustomerQuery = {
  type: "GetCustomer";
  partyRef: PartyRef;
};

export type SearchCustomersQuery = {
  type: "SearchCustomers";
  query: string;
  partyKind?: PartyKind | "all";
  limit?: number;
};

export type ListRecentCustomersQuery = {
  type: "ListRecentCustomers";
  limit?: number;
  partyKind?: PartyKind | "all";
};

export type GetDeliveryLocationsQuery = {
  type: "GetDeliveryLocations";
  partyRef: PartyRef;
};

export type GetCompanyAccountsQuery = {
  type: "GetCompanyAccounts";
  query?: string;
  limit?: number;
};

export type CustomerQuery =
  | GetCustomerQuery
  | SearchCustomersQuery
  | ListRecentCustomersQuery
  | GetDeliveryLocationsQuery
  | GetCompanyAccountsQuery;

export function getCustomerQuery(
  input: Omit<GetCustomerQuery, "type">,
): GetCustomerQuery {
  return { type: "GetCustomer", ...input };
}

export function searchCustomersQuery(
  input: Omit<SearchCustomersQuery, "type">,
): SearchCustomersQuery {
  return { type: "SearchCustomers", ...input };
}

export function listRecentCustomersQuery(
  input: Omit<ListRecentCustomersQuery, "type"> = {},
): ListRecentCustomersQuery {
  return { type: "ListRecentCustomers", ...input };
}

export function getDeliveryLocationsQuery(
  input: Omit<GetDeliveryLocationsQuery, "type">,
): GetDeliveryLocationsQuery {
  return { type: "GetDeliveryLocations", ...input };
}

export function getCompanyAccountsQuery(
  input: Omit<GetCompanyAccountsQuery, "type"> = {},
): GetCompanyAccountsQuery {
  return { type: "GetCompanyAccounts", ...input };
}
