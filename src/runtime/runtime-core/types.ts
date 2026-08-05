/**
 * Runtime Core — shared types (kernel · no module knowledge).
 * DEVELOPER-PLATFORM-002
 */

/** Module permission levels (architecture only — not enforced yet). */
export type RuntimePermissionLevel =
  | "PUBLIC"
  | "ENGINEERING"
  | "EXPERIMENTAL"
  | "INTERNAL";

/** Module taxonomy for registry / future UI. */
export type RuntimeModuleCategory =
  | "Core"
  | "Diagnostics"
  | "Performance"
  | "Network"
  | "Storage"
  | "Session"
  | "Branding"
  | "Experimental"
  | "Developer";

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
  | "asset-failure"
  | "network-request";

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
