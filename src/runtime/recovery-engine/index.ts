/**
 * Recovery Engine — Developer Platform v1.7
 *
 * Spec: docs/05-architecture/RECOVERY_ENGINE.md
 * ADR: docs/adr/0046-recovery-engine.md
 *
 * Orchestrates Capability.recover → verify. No module-specific logic.
 */

export type {
  RuntimeRecovery,
  RecoveryResult,
  RecoveryStatus,
  RecoveryTimelineEvent,
} from "./recovery.types";
export { RECOVERY_ENGINE_VERSION } from "./recovery.types";

export {
  runRecovery,
  verifyRecovery,
  cancelRecovery,
  getRecoveryHistory,
  exportRecoveryHistory,
  exportRecoveryHistoryDocument,
  getRecoveryEngineInfo,
  type RunRecoveryOptions,
} from "./RecoveryEngine";

export {
  getRecovery,
  getRecoveryTimeline,
  resetRecoveryHistory,
  listRunningRecoveries,
  exportRecoveryHistoryJson,
} from "./RecoveryHistory";

export {
  recommendationSupportsRecovery,
  resolveRecoverableCapabilityId,
} from "./RecoveryPolicy";

export {
  registerRecoveryModule,
  resetRecoveryModuleFlags,
} from "./register-recovery-module";

export { RecoveryPanel } from "./RecoveryPanel";
