/**
 * Order Queries — operational reads (OPERATIONAL-003 Phase 2).
 */

import type { OrderStatus } from "./OrderContext";

export type GetOrderQuery = {
  type: "GetOrder";
  orderId: string;
};

export type SearchOrdersQuery = {
  type: "SearchOrders";
  weekStart?: string;
  status?: OrderStatus | OrderStatus[];
  partyId?: string;
  deliveryDay?: string;
  limit?: number;
};

export type GetOrdersByWeekQuery = {
  type: "GetOrdersByWeek";
  weekStart: string;
  limit?: number;
};

export type GetOrdersByCustomerQuery = {
  type: "GetOrdersByCustomer";
  customerId: string;
  limit?: number;
};

export type GetOrdersByDeliveryDayQuery = {
  type: "GetOrdersByDeliveryDay";
  deliveryDay: string;
  limit?: number;
};

export type GetOrdersPendingProductionQuery = {
  type: "GetOrdersPendingProduction";
  deliveryDay?: string;
  limit?: number;
};

export type GetOrdersReadyForDeliveryQuery = {
  type: "GetOrdersReadyForDelivery";
  deliveryDay?: string;
  limit?: number;
};

export type GetOperationalCalendarQuery = {
  type: "GetOperationalCalendar";
  weekStart: string;
};

export type GetKitchenQueueQuery = {
  type: "GetKitchenQueue";
  deliveryDay?: string;
  limit?: number;
};

export type OrderQuery =
  | GetOrderQuery
  | SearchOrdersQuery
  | GetOrdersByWeekQuery
  | GetOrdersByCustomerQuery
  | GetOrdersByDeliveryDayQuery
  | GetOrdersPendingProductionQuery
  | GetOrdersReadyForDeliveryQuery
  | GetOperationalCalendarQuery
  | GetKitchenQueueQuery;

export function getOrderQuery(input: Omit<GetOrderQuery, "type">): GetOrderQuery {
  return { type: "GetOrder", ...input };
}

export function searchOrdersQuery(
  input: Omit<SearchOrdersQuery, "type"> = {},
): SearchOrdersQuery {
  return { type: "SearchOrders", ...input };
}

export function getOrdersByWeekQuery(
  input: Omit<GetOrdersByWeekQuery, "type">,
): GetOrdersByWeekQuery {
  return { type: "GetOrdersByWeek", ...input };
}

export function getOrdersByCustomerQuery(
  input: Omit<GetOrdersByCustomerQuery, "type">,
): GetOrdersByCustomerQuery {
  return { type: "GetOrdersByCustomer", ...input };
}

export function getOrdersByDeliveryDayQuery(
  input: Omit<GetOrdersByDeliveryDayQuery, "type">,
): GetOrdersByDeliveryDayQuery {
  return { type: "GetOrdersByDeliveryDay", ...input };
}

export function getOrdersPendingProductionQuery(
  input: Omit<GetOrdersPendingProductionQuery, "type"> = {},
): GetOrdersPendingProductionQuery {
  return { type: "GetOrdersPendingProduction", ...input };
}

export function getOrdersReadyForDeliveryQuery(
  input: Omit<GetOrdersReadyForDeliveryQuery, "type"> = {},
): GetOrdersReadyForDeliveryQuery {
  return { type: "GetOrdersReadyForDelivery", ...input };
}

export function getOperationalCalendarQuery(
  input: Omit<GetOperationalCalendarQuery, "type">,
): GetOperationalCalendarQuery {
  return { type: "GetOperationalCalendar", ...input };
}

export function getKitchenQueueQuery(
  input: Omit<GetKitchenQueueQuery, "type"> = {},
): GetKitchenQueueQuery {
  return { type: "GetKitchenQueue", ...input };
}
