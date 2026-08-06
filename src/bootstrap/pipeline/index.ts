/**
 * App Bootstrap Pipeline — PRODUCT-CORE-002
 *
 * Single orchestration surface for application startup order (ADR 0050).
 * Dev Bootstrap Mode (VITE_BOOTSTRAP_MODE) remains in `src/bootstrap/*` siblings —
 * do not conflate the two.
 */

export type {
  BootstrapError,
  BootstrapErrorCode,
  BootstrapResult,
  BootstrapRunMode,
  BootstrapStageId,
  BootstrapStageOutcome,
  BootstrapStageResult,
  BootstrapStageStatus,
  BootstrapStatus,
} from "./types";

export {
  createBootstrapContext,
  type BootstrapContext,
} from "./BootstrapContext";

export {
  emitBootstrapLifecycle,
  onBootstrapLifecycle,
  resetBootstrapLifecycleListeners,
  type BootstrapLifecycleEvent,
  type BootstrapLifecycleEventName,
} from "./BootstrapEvents";

export {
  BOOTSTRAP_PIPELINE_STAGES,
  getBootstrapPipelineStages,
} from "./BootstrapPipeline";

export type { BootstrapStageHandler } from "./stages/BootstrapStage";

export {
  BootstrapOrchestrator,
  getBootstrapOrchestrator,
  resetBootstrapOrchestrator,
  startBootstrapPipeline,
  type BootstrapRunOptions,
} from "./BootstrapOrchestrator";
