/**
 * RUNTIME-CONSISTENCY-002 — public barrel.
 */
export {
  buildConsistencyContext,
  runRuntimeConsistencyEngine,
} from "./engine";
export { DEFAULT_CONSISTENCY_RULES } from "./rules";
export type {
  AnnotatedAssetEntry,
  ConsistencyLifecycle,
  ConsistencyReport,
  ConsistencyResult,
  ConsistencySeverity,
  ConsistencyTimelineEvent,
  RuntimeConsistencyContext,
  RuntimeConsistencyRule,
} from "./types";
