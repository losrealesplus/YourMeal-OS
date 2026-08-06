/**
 * Production Capability package — OPERATIONAL-004 Phase 2 (Facade).
 * Public API for Operational Execution planning. LAW 001–004.
 * Production never cooks. Kitchen executes.
 */

export type {
  ProductionScope,
  ProductionStatus,
  ProductionBatchStatus,
  ProductionErrorCode,
  ProductionError,
  ProductionCapacity,
  ProductionLoad,
  ProductionSchedule,
  ProductionBatch,
  ProductionSummary,
  ProductionQueue,
  ProductionCapabilityBits,
  ProductionContext,
  ProductionResult,
  ProductionCommandResult,
} from "./ProductionContext";

export type {
  GenerateProductionPlanCommand,
  RecalculateLoadCommand,
  MarkBatchReadyCommand,
  CloseBatchCommand,
  ProductionCommand,
} from "./ProductionCommands";

export {
  generateProductionPlanCommand,
  recalculateLoadCommand,
  markBatchReadyCommand,
  closeBatchCommand,
  assignBatchCommand,
  rescheduleBatchCommand,
  generateProductionBatchCommand,
} from "./ProductionCommands";

export type {
  GetProductionPlanQuery,
  GetProductionQueueQuery,
  GetProductionLoadQuery,
  GetOpenBatchesQuery,
  GetReadyBatchesQuery,
  GetProductionCalendarQuery,
  ProductionQuery,
} from "./ProductionQueries";

export {
  getProductionPlanQuery,
  getProductionQueueQuery,
  getProductionLoadQuery,
  getOpenBatchesQuery,
  getReadyBatchesQuery,
  getProductionCalendarQuery,
  getProductionCapacityQuery,
} from "./ProductionQueries";

export {
  ProductionFacade,
  getProductionFacade,
  resetProductionFacade,
  type ProductionFacadeDeps,
} from "./ProductionFacade";

export { useProduction, type ProductionFacadeApi } from "./useProduction";
