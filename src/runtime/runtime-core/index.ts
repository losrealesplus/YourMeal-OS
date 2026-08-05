/**
 * YourMeal OS Runtime Core — kernel of the Developer Platform Runtime Suite.
 *
 * Modules depend on Core. Core never depends on modules.
 *
 * Spec: docs/05-architecture/RUNTIME_CORE.md
 * ADR: docs/adr/0038-runtime-core.md
 * Product: Developer Platform v1.0 Foundation
 */

export { getRuntimeCore, RuntimeCore, RUNTIME_CORE_VERSION } from "./RuntimeCore";
export type { RuntimeCoreApi } from "./RuntimeCore";
export type { RuntimeModule, RuntimeModuleRegistration } from "./RuntimeModule";
export {
  registerModule,
  unregisterModule,
  getModules,
  getModulesSorted,
  findModule,
  isEnabled,
  enable,
  disable,
  resetRuntimeRegistry,
} from "./RuntimeRegistry";
export {
  onRuntimeCoreEvent,
  emitRuntimeCoreEvent,
  resetRuntimeEvents,
} from "./RuntimeEvents";
export {
  createEvidence,
  collectEvidenceFromModules,
} from "./RuntimeEvidence";
export type { CreateEvidenceInput } from "./RuntimeEvidence";
export {
  canAccessModule,
  RUNTIME_PERMISSION_LEVELS,
} from "./RuntimePermissions";
export {
  createExportEngineStub,
} from "./RuntimeExport";
export type {
  RuntimeExportEngine,
  RuntimeExportBundle,
} from "./RuntimeExport";
export {
  registerBuiltinRuntimeModules,
  BUILTIN_MODULE_IDS,
} from "./register-builtins";
export type {
  RuntimePermissionLevel,
  RuntimeModuleCategory,
  RuntimePlatform,
  RuntimeSeverity,
  RuntimeModuleMeta,
  RuntimeEvidence,
  RuntimeCoreEventName,
  RuntimeCoreEvent,
  RuntimeHealthReport,
} from "./types";
