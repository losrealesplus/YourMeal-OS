/**
 * Runtime Core — shared types (kernel · no module knowledge).
 * DEVELOPER-PLATFORM-002 · extended DEVELOPER-PLATFORM-003 (Host categories + platforms)
 */

/** Module permission levels (architecture only — not enforced yet). */
export type RuntimePermissionLevel =
  | "PUBLIC"
  | "ENGINEERING"
  | "EXPERIMENTAL"
  | "INTERNAL";

/**
 * Host / Registry taxonomy (Developer Platform Host).
 * Modules declare one category; Host groups automatically.
 */
export type RuntimeModuleCategory =
  | "Health"
  | "Application"
  | "Network"
  | "System"
  | "Security"
  | "Developer"
  | "Knowledge";

/** Platforms a module may declare support for (filter prepared · not enforced yet). */
export type RuntimePlatform = "web" | "android" | "ios";

export type RuntimeSeverity = "info" | "warning" | "error" | "critical";

/** Declarative metadata — no UI logic. */
export type RuntimeModuleMeta = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  category: RuntimeModuleCategory;
  version: string;
  experimental?: boolean;
  visible?: boolean;
  permissions: RuntimePermissionLevel;
  /**
   * Platforms where this module is available.
   * Omit / empty → treat as all platforms (Host default).
   */
  supports?: RuntimePlatform[];
};

/** Common evidence contract (no storage yet). */
export type RuntimeEvidence = {
  id: string;
  timestamp: string;
  source: string;
  severity: RuntimeSeverity;
  payload: unknown;
  category: string;
};

/** Typed Core event names (extensible string union). */
export type RuntimeCoreEventName =
  | "runtime-open"
  | "runtime-close"
  | "module-registered"
  | "module-unregistered"
  | "module-mounted"
  | "module-unmounted"
  | "module-enabled"
  | "module-disabled"
  | "doctor-start"
  | "doctor-finish"
  | "doctor-check-registered"
  | "incident-reported"
  | "incident-updated"
  | "incident-dismissed"
  | "incident-resolved"
  | "incident-recovery-stub"
  | "knowledge-registered"
  | "asset-failure"
  | "network-request"
  | "host-module-selected";

export type RuntimeCoreEvent<T = unknown> = {
  name: RuntimeCoreEventName | (string & {});
  timestamp: string;
  payload?: T;
};

export type RuntimeHealthReport = {
  ok: boolean;
  detail?: string;
  checks?: Array<{ id: string; ok: boolean; detail?: string }>;
};
