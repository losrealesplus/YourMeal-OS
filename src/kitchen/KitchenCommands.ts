/**
 * Kitchen Execution Commands — operational execution intents (OPERATIONAL-005 Phase 2).
 * Execution language — never Order CRUD · never Production planning.
 */

export type StartExecutionCommand = {
  type: "StartExecution";
  dayDate: string;
  unitId: string;
};

export type PauseExecutionCommand = {
  type: "PauseExecution";
  dayDate: string;
  unitId: string;
};

export type ResumeExecutionCommand = {
  type: "ResumeExecution";
  dayDate: string;
  unitId: string;
};

export type CompleteExecutionCommand = {
  type: "CompleteExecution";
  dayDate: string;
  unitId: string;
};

export type BlockExecutionCommand = {
  type: "BlockExecution";
  dayDate: string;
  unitId: string;
  reason?: string;
};

export type AssignOperatorCommand = {
  type: "AssignOperator";
  dayDate: string;
  unitId: string;
  operatorId: string;
};

export type ReassignOperatorCommand = {
  type: "ReassignOperator";
  dayDate: string;
  unitId: string;
  operatorId: string;
};

export type MarkExecutionReadyCommand = {
  type: "MarkExecutionReady";
  dayDate: string;
  unitId: string;
};

export type KitchenCommand =
  | StartExecutionCommand
  | PauseExecutionCommand
  | ResumeExecutionCommand
  | CompleteExecutionCommand
  | BlockExecutionCommand
  | AssignOperatorCommand
  | ReassignOperatorCommand
  | MarkExecutionReadyCommand;

export function startExecutionCommand(
  input: Omit<StartExecutionCommand, "type">,
): StartExecutionCommand {
  return { type: "StartExecution", ...input };
}

export function pauseExecutionCommand(
  input: Omit<PauseExecutionCommand, "type">,
): PauseExecutionCommand {
  return { type: "PauseExecution", ...input };
}

export function resumeExecutionCommand(
  input: Omit<ResumeExecutionCommand, "type">,
): ResumeExecutionCommand {
  return { type: "ResumeExecution", ...input };
}

export function completeExecutionCommand(
  input: Omit<CompleteExecutionCommand, "type">,
): CompleteExecutionCommand {
  return { type: "CompleteExecution", ...input };
}

export function blockExecutionCommand(
  input: Omit<BlockExecutionCommand, "type">,
): BlockExecutionCommand {
  return { type: "BlockExecution", ...input };
}

export function assignOperatorCommand(
  input: Omit<AssignOperatorCommand, "type">,
): AssignOperatorCommand {
  return { type: "AssignOperator", ...input };
}

export function reassignOperatorCommand(
  input: Omit<ReassignOperatorCommand, "type">,
): ReassignOperatorCommand {
  return { type: "ReassignOperator", ...input };
}

export function markExecutionReadyCommand(
  input: Omit<MarkExecutionReadyCommand, "type">,
): MarkExecutionReadyCommand {
  return { type: "MarkExecutionReady", ...input };
}
