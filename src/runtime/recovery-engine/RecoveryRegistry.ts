/**
 * RecoveryRegistry — in-memory index of recovery runs (backed by RecoveryHistory).
 */
export {
  getRecovery,
  getRecoveryHistory,
  getRecoveryTimeline,
  listRunningRecoveries,
  resetRecoveryHistory,
} from "./RecoveryHistory";
