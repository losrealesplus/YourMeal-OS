/**
 * Developer Platform Host — dynamic module shell.
 *
 * Spec: docs/05-architecture/DEVELOPER_PLATFORM_HOST.md
 * ADR: docs/adr/0039-developer-platform-host.md
 */
export { RuntimeHost } from "./RuntimeHost";
export type { RuntimeHostProps } from "./RuntimeHost";
export { RuntimeSidebar } from "./RuntimeSidebar";
export { RuntimeModuleCard } from "./RuntimeModuleCard";
export { RuntimeModuleRenderer } from "./RuntimeModuleRenderer";
export {
  RUNTIME_HOST_CATEGORIES,
  RUNTIME_HOST_CATEGORY_LABELS,
  groupModulesByCategory,
  moduleSupportsPlatform,
  detectRuntimePlatform,
} from "./RuntimeCategory";
export type { HostModuleGroup } from "./RuntimeCategory";
export {
  registerModuleRenderer,
  unregisterModuleRenderer,
  getModuleRenderer,
  hasModuleRenderer,
  resetModuleRenderers,
} from "./module-renderers";
export {
  registerLegacyHostModules,
  legacyTabForModuleId,
  moduleIdForLegacyTab,
  LEGACY_TAB_BY_MODULE_ID,
  resetLegacyHostRegistrationFlag,
} from "./legacy-bridges";
