/**
 * YourMeal OS Runtime Suite — module catalog (Phase 1).
 *
 * Permanent platform capability: self-diagnostic instrument.
 * Entry: YMOS Horus (Secret Gateway) → Suite shell.
 * Evidence before Implementation · FOPEBA.
 */

export type SuiteModuleId =
  | "doctor"
  | "inspector"
  | "assets"
  | "consistency"
  | "state"
  | "network"
  | "storage"
  | "performance"
  | "logs"
  | "feature-flags"
  | "telemetry"
  | "tenant";

/** Roadmap phase when the module becomes a first-class Suite surface. */
export type SuiteModulePhase = 1 | 2 | 3 | 4 | 5;

export type SuiteModuleStatus = "available" | "planned";

/**
 * Existing Inspector tab ids that already implement a Suite module (Phase 1 bridge).
 * Keep in sync with TABS in YmosRuntimeInspector — do not invent tabs here.
 */
export type SuiteLegacyTab =
  | "General"
  | "Runtime"
  | "Assets"
  | "DOM"
  | "Consistency"
  | "i18n"
  | "Router"
  | "Supabase"
  | "Network"
  | "Storage"
  | "Clipboard"
  | "Device"
  | "Errors";

export type SuiteModule = {
  id: SuiteModuleId;
  /** Product label (no emoji required in code; UI may add icons). */
  label: string;
  summary: string;
  phase: SuiteModulePhase;
  status: SuiteModuleStatus;
  /** When available via current Inspector tabs. */
  legacyTab?: SuiteLegacyTab;
};

/**
 * Canonical Suite catalog. Phase 1 exposes the shell + bridges to existing tabs.
 * Later phases replace bridges with dedicated Capability Drivers.
 */
export const RUNTIME_SUITE_MODULES: readonly SuiteModule[] = [
  {
    id: "doctor",
    label: "Doctor",
    summary: "Environment & integrity checks (hundreds of probes)",
    phase: 2,
    status: "planned",
  },
  {
    id: "inspector",
    label: "Runtime Inspector",
    summary: "Live runtime mounts, router, session, device",
    phase: 1,
    status: "available",
    legacyTab: "Runtime",
  },
  {
    id: "assets",
    label: "Assets",
    summary: "Asset resolution ledger · logo · __l5e detection",
    phase: 1,
    status: "available",
    legacyTab: "Assets",
  },
  {
    id: "consistency",
    label: "Consistency",
    summary: "LIVE / HISTORICAL / ORPHAN / STALE lifecycle",
    phase: 1,
    status: "available",
    legacyTab: "Consistency",
  },
  {
    id: "state",
    label: "State",
    summary: "Application & bootstrap state machine snapshot",
    phase: 3,
    status: "planned",
  },
  {
    id: "network",
    label: "Network",
    summary: "Requests · timing · 401/403/500 · retries",
    phase: 1,
    status: "available",
    legacyTab: "Network",
  },
  {
    id: "storage",
    label: "Storage",
    summary: "localStorage · session · Preferences · IndexedDB",
    phase: 1,
    status: "available",
    legacyTab: "Storage",
  },
  {
    id: "performance",
    label: "Performance",
    summary: "FPS · memory · LCP · hydration · renders",
    phase: 3,
    status: "planned",
  },
  {
    id: "logs",
    label: "Logs",
    summary: "Runtime trace · exceptions · errors",
    phase: 1,
    status: "available",
    legacyTab: "Errors",
  },
  {
    id: "feature-flags",
    label: "Feature Flags",
    summary: "Flag evaluation snapshot for this session",
    phase: 3,
    status: "planned",
  },
  {
    id: "telemetry",
    label: "Telemetry",
    summary: "Runtime events · warnings · timeline",
    phase: 3,
    status: "planned",
  },
  {
    id: "tenant",
    label: "Tenant",
    summary: "Active tenant · branding · logo · permissions",
    phase: 2,
    status: "planned",
  },
] as const;

export const RUNTIME_SUITE_NAME = "YourMeal OS Runtime Suite";
export const RUNTIME_SUITE_SHORT = "YMOS Runtime Suite";

export function getSuiteModule(id: SuiteModuleId): SuiteModule | undefined {
  return RUNTIME_SUITE_MODULES.find((m) => m.id === id);
}

export function listAvailableSuiteModules(): SuiteModule[] {
  return RUNTIME_SUITE_MODULES.filter((m) => m.status === "available");
}

export function listPlannedSuiteModules(): SuiteModule[] {
  return RUNTIME_SUITE_MODULES.filter((m) => m.status === "planned");
}
