/**
 * YourMeal OS Runtime Suite — permanent self-diagnostic platform surface.
 *
 * Phase 1: shell + module catalog + bridge to existing Inspector tabs.
 * Entry: YMOS Horus (Secret Gateway).
 *
 * Spec: docs/05-architecture/RUNTIME_SUITE.md
 * ADR: docs/adr/0035-runtime-suite.md
 */
export {
  RUNTIME_SUITE_MODULES,
  RUNTIME_SUITE_NAME,
  RUNTIME_SUITE_SHORT,
  getSuiteModule,
  listAvailableSuiteModules,
  listPlannedSuiteModules,
} from "./modules";
export type {
  SuiteModule,
  SuiteModuleId,
  SuiteModulePhase,
  SuiteModuleStatus,
  SuiteLegacyTab,
} from "./modules";
