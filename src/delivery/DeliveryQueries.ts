/**
 * Delivery Queries — operational fulfillment reads (OPERATIONAL-006 Phase 2).
 */

export type GetDeliveryContextQuery = {
  type: "GetDeliveryContext";
  operationalDay: string;
};

export type GetDeliveryAssignmentsQuery = {
  type: "GetDeliveryAssignments";
  operationalDay: string;
  status?: import("./DeliveryContext").DeliveryStatus;
};

export type GetDeliveryRoutesQuery = {
  type: "GetDeliveryRoutes";
  operationalDay: string;
};

export type GetDeliveryStopsQuery = {
  type: "GetDeliveryStops";
  operationalDay: string;
};

export type GetCompletedDeliveriesQuery = {
  type: "GetCompletedDeliveries";
  operationalDay: string;
};

export type DeliveryQuery =
  | GetDeliveryContextQuery
  | GetDeliveryAssignmentsQuery
  | GetDeliveryRoutesQuery
  | GetDeliveryStopsQuery
  | GetCompletedDeliveriesQuery;

export function getDeliveryContextQuery(
  input: Omit<GetDeliveryContextQuery, "type">,
): GetDeliveryContextQuery {
  return { type: "GetDeliveryContext", ...input };
}

export function getDeliveryAssignmentsQuery(
  input: Omit<GetDeliveryAssignmentsQuery, "type">,
): GetDeliveryAssignmentsQuery {
  return { type: "GetDeliveryAssignments", ...input };
}

export function getDeliveryRoutesQuery(
  input: Omit<GetDeliveryRoutesQuery, "type">,
): GetDeliveryRoutesQuery {
  return { type: "GetDeliveryRoutes", ...input };
}

export function getDeliveryStopsQuery(
  input: Omit<GetDeliveryStopsQuery, "type">,
): GetDeliveryStopsQuery {
  return { type: "GetDeliveryStops", ...input };
}

export function getCompletedDeliveriesQuery(
  input: Omit<GetCompletedDeliveriesQuery, "type">,
): GetCompletedDeliveriesQuery {
  return { type: "GetCompletedDeliveries", ...input };
}
