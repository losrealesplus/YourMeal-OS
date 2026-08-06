/**
 * Production Queries — operational planning reads (OPERATIONAL-004 Phase 2).
 */

export type GetProductionPlanQuery = {
  type: "GetProductionPlan";
  dayDate: string;
  companyId?: string | null;
  siteId?: string | null;
  deliveryGroupId?: string | null;
};

export type GetProductionQueueQuery = {
  type: "GetProductionQueue";
  dayDate: string;
};

export type GetProductionLoadQuery = {
  type: "GetProductionLoad";
  dayDate: string;
};

export type GetProductionCapacityQuery = {
  type: "GetProductionCapacity";
  dayDate: string;
};

export type GetOpenBatchesQuery = {
  type: "GetOpenBatches";
  dayDate: string;
};

export type GetReadyBatchesQuery = {
  type: "GetReadyBatches";
  dayDate: string;
};

export type GetProductionCalendarQuery = {
  type: "GetProductionCalendar";
  weekStart: string;
};

export type ProductionQuery =
  | GetProductionPlanQuery
  | GetProductionQueueQuery
  | GetProductionLoadQuery
  | GetProductionCapacityQuery
  | GetOpenBatchesQuery
  | GetReadyBatchesQuery
  | GetProductionCalendarQuery;

export function getProductionPlanQuery(
  input: Omit<GetProductionPlanQuery, "type">,
): GetProductionPlanQuery {
  return { type: "GetProductionPlan", ...input };
}

export function getProductionQueueQuery(
  input: Omit<GetProductionQueueQuery, "type">,
): GetProductionQueueQuery {
  return { type: "GetProductionQueue", ...input };
}

export function getProductionLoadQuery(
  input: Omit<GetProductionLoadQuery, "type">,
): GetProductionLoadQuery {
  return { type: "GetProductionLoad", ...input };
}

export function getProductionCapacityQuery(
  input: Omit<GetProductionCapacityQuery, "type">,
): GetProductionCapacityQuery {
  return { type: "GetProductionCapacity", ...input };
}

export function getOpenBatchesQuery(
  input: Omit<GetOpenBatchesQuery, "type">,
): GetOpenBatchesQuery {
  return { type: "GetOpenBatches", ...input };
}

export function getReadyBatchesQuery(
  input: Omit<GetReadyBatchesQuery, "type">,
): GetReadyBatchesQuery {
  return { type: "GetReadyBatches", ...input };
}

export function getProductionCalendarQuery(
  input: Omit<GetProductionCalendarQuery, "type">,
): GetProductionCalendarQuery {
  return { type: "GetProductionCalendar", ...input };
}
