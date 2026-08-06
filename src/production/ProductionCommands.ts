/**
 * Production Commands — operational planning intents (OPERATIONAL-004 Phase 2).
 * Work language — not Order CRUD.
 */

export type GenerateProductionPlanCommand = {
  type: "GenerateProductionPlan";
  dayDate: string;
  companyId?: string | null;
  siteId?: string | null;
  deliveryGroupId?: string | null;
};

export type GenerateProductionBatchCommand = {
  type: "GenerateProductionBatch";
  dayDate: string;
  dishId: string;
};

export type RecalculateLoadCommand = {
  type: "RecalculateLoad";
  dayDate: string;
};

export type AssignBatchCommand = {
  type: "AssignBatch";
  dayDate: string;
  dishId: string;
  station?: string;
  assigneeId?: string;
};

export type RescheduleBatchCommand = {
  type: "RescheduleBatch";
  dayDate: string;
  dishId: string;
  targetDayDate: string;
};

export type MarkBatchReadyCommand = {
  type: "MarkBatchReady";
  dayDate: string;
  dishId: string;
};

export type CloseBatchCommand = {
  type: "CloseBatch";
  dayDate: string;
  dishId: string;
};

/** Future planning intents — frozen names, substrate later. */
export type OptimizePlanCommand = {
  type: "OptimizePlan";
  dayDate: string;
};

export type BalanceWorkloadCommand = {
  type: "BalanceWorkload";
  dayDate: string;
};

export type GenerateKitchenQueueCommand = {
  type: "GenerateKitchenQueue";
  dayDate: string;
};

export type ProductionCommand =
  | GenerateProductionPlanCommand
  | GenerateProductionBatchCommand
  | RecalculateLoadCommand
  | AssignBatchCommand
  | RescheduleBatchCommand
  | MarkBatchReadyCommand
  | CloseBatchCommand
  | OptimizePlanCommand
  | BalanceWorkloadCommand
  | GenerateKitchenQueueCommand;

export function generateProductionPlanCommand(
  input: Omit<GenerateProductionPlanCommand, "type">,
): GenerateProductionPlanCommand {
  return { type: "GenerateProductionPlan", ...input };
}

export function generateProductionBatchCommand(
  input: Omit<GenerateProductionBatchCommand, "type">,
): GenerateProductionBatchCommand {
  return { type: "GenerateProductionBatch", ...input };
}

export function recalculateLoadCommand(
  input: Omit<RecalculateLoadCommand, "type">,
): RecalculateLoadCommand {
  return { type: "RecalculateLoad", ...input };
}

export function assignBatchCommand(
  input: Omit<AssignBatchCommand, "type">,
): AssignBatchCommand {
  return { type: "AssignBatch", ...input };
}

export function rescheduleBatchCommand(
  input: Omit<RescheduleBatchCommand, "type">,
): RescheduleBatchCommand {
  return { type: "RescheduleBatch", ...input };
}

export function markBatchReadyCommand(
  input: Omit<MarkBatchReadyCommand, "type">,
): MarkBatchReadyCommand {
  return { type: "MarkBatchReady", ...input };
}

export function closeBatchCommand(
  input: Omit<CloseBatchCommand, "type">,
): CloseBatchCommand {
  return { type: "CloseBatch", ...input };
}
