/**
 * Kitchen Execution Queries — operational execution reads (OPERATIONAL-005 Phase 2).
 */

export type GetExecutionQueueQuery = {
  type: "GetExecutionQueue";
  dayDate: string;
};

export type GetExecutionUnitsQuery = {
  type: "GetExecutionUnits";
  dayDate: string;
  status?: import("./KitchenContext").ExecutionStatus;
};

export type GetExecutionProgressQuery = {
  type: "GetExecutionProgress";
  dayDate: string;
  unitId: string;
};

export type GetOperatorAssignmentsQuery = {
  type: "GetOperatorAssignments";
  dayDate: string;
};

export type GetBlockedExecutionQuery = {
  type: "GetBlockedExecution";
  dayDate: string;
};

export type GetCompletedExecutionQuery = {
  type: "GetCompletedExecution";
  dayDate: string;
};

export type KitchenQuery =
  | GetExecutionQueueQuery
  | GetExecutionUnitsQuery
  | GetExecutionProgressQuery
  | GetOperatorAssignmentsQuery
  | GetBlockedExecutionQuery
  | GetCompletedExecutionQuery;

export function getExecutionQueueQuery(
  input: Omit<GetExecutionQueueQuery, "type">,
): GetExecutionQueueQuery {
  return { type: "GetExecutionQueue", ...input };
}

export function getExecutionUnitsQuery(
  input: Omit<GetExecutionUnitsQuery, "type">,
): GetExecutionUnitsQuery {
  return { type: "GetExecutionUnits", ...input };
}

export function getExecutionProgressQuery(
  input: Omit<GetExecutionProgressQuery, "type">,
): GetExecutionProgressQuery {
  return { type: "GetExecutionProgress", ...input };
}

export function getOperatorAssignmentsQuery(
  input: Omit<GetOperatorAssignmentsQuery, "type">,
): GetOperatorAssignmentsQuery {
  return { type: "GetOperatorAssignments", ...input };
}

export function getBlockedExecutionQuery(
  input: Omit<GetBlockedExecutionQuery, "type">,
): GetBlockedExecutionQuery {
  return { type: "GetBlockedExecution", ...input };
}

export function getCompletedExecutionQuery(
  input: Omit<GetCompletedExecutionQuery, "type">,
): GetCompletedExecutionQuery {
  return { type: "GetCompletedExecution", ...input };
}
