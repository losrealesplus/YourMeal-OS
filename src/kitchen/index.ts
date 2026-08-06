/**
 * Kitchen Execution Capability package — OPERATIONAL-005 Phase 2 (Facade).
 * Public API for Operational Execution. LAW 001–006-A.
 * Kitchen never cooks. Kitchen never plans. Consumes ProductionFacade only.
 */

export type {
  ExecutionStatus,
  KitchenErrorCode,
  KitchenError,
  ExecutionUnit,
  ExecutionQueue,
  ExecutionOperator,
  ExecutionProgress,
  KitchenCapabilityBits,
  KitchenContext,
  KitchenResult,
  KitchenCommandResult,
} from "./KitchenContext";

export type {
  StartExecutionCommand,
  PauseExecutionCommand,
  ResumeExecutionCommand,
  CompleteExecutionCommand,
  BlockExecutionCommand,
  AssignOperatorCommand,
  ReassignOperatorCommand,
  MarkExecutionReadyCommand,
  KitchenCommand,
} from "./KitchenCommands";

export {
  startExecutionCommand,
  pauseExecutionCommand,
  resumeExecutionCommand,
  completeExecutionCommand,
  blockExecutionCommand,
  assignOperatorCommand,
  reassignOperatorCommand,
  markExecutionReadyCommand,
} from "./KitchenCommands";

export type {
  GetExecutionQueueQuery,
  GetExecutionUnitsQuery,
  GetExecutionProgressQuery,
  GetOperatorAssignmentsQuery,
  GetBlockedExecutionQuery,
  GetCompletedExecutionQuery,
  KitchenQuery,
} from "./KitchenQueries";

export {
  getExecutionQueueQuery,
  getExecutionUnitsQuery,
  getExecutionProgressQuery,
  getOperatorAssignmentsQuery,
  getBlockedExecutionQuery,
  getCompletedExecutionQuery,
} from "./KitchenQueries";

export {
  KitchenExecutionFacade,
  getKitchenExecutionFacade,
  resetKitchenExecutionFacade,
  type KitchenExecutionFacadeDeps,
} from "./KitchenExecutionFacade";

export {
  useKitchenExecution,
  type KitchenExecutionFacadeApi,
} from "./useKitchenExecution";
