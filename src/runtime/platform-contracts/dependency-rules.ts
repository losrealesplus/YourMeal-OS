/**
 * Dependency rules for Developer Platform engines (freeze v1.0).
 * Used by Platform Contract Tests — not enforced at runtime.
 *
 * Chain (downward only):
 * Capability → Checks → Evidence → Incident → Knowledge → Recommendation → Recovery
 */

export type EngineId =
  | "runtime-core"
  | "runtime-host"
  | "capability-engine"
  | "runtime-doctor"
  | "incident-engine"
  | "knowledge-engine"
  | "recommendation-engine"
  | "recovery-engine";

/**
 * Files that may import Host (module registration + panels).
 * Pure engine logic must not appear here as a loophole for cross-engine Host use.
 */
export const HOST_ADAPTER_FILE_RE =
  /(register-.*-module\.ts|register-.*-module\.tsx|.*Panel\.tsx)$/;

/**
 * Approved transitional bridges (Capability ↔ Doctor checks, Incident ↔ Doctor).
 */
export const APPROVED_BRIDGE_IMPORTS: Array<{
  from: EngineId;
  to: string;
  reason: string;
}> = [
  {
    from: "capability-engine",
    to: "runtime-doctor/DoctorCheck",
    reason: "createCapabilityFromChecks type bridge",
  },
  {
    from: "capability-engine",
    to: "runtime-doctor/checks/",
    reason: "Foundation wraps existing Doctor checks",
  },
  {
    from: "incident-engine",
    to: "runtime-doctor/DoctorCheck",
    reason: "doctor-bridge.ts typed bridge",
  },
];

/**
 * Forbidden production imports between engines (pure logic files).
 * Host adapters (register-*-module, *Panel) are excluded by the test harness.
 */
export const FORBIDDEN_ENGINE_IMPORTS: Array<{
  from: EngineId;
  to: EngineId | string;
  reason: string;
}> = [
  {
    from: "runtime-core",
    to: "runtime-host",
    reason: "Core never depends on Host",
  },
  {
    from: "runtime-core",
    to: "capability-engine",
    reason: "Core never depends on engines",
  },
  {
    from: "runtime-core",
    to: "runtime-doctor",
    reason: "Core never depends on engines",
  },
  {
    from: "runtime-core",
    to: "incident-engine",
    reason: "Core never depends on engines",
  },
  {
    from: "runtime-core",
    to: "knowledge-engine",
    reason: "Core never depends on engines",
  },
  {
    from: "runtime-core",
    to: "recommendation-engine",
    reason: "Core never depends on engines",
  },
  {
    from: "runtime-core",
    to: "recovery-engine",
    reason: "Core never depends on engines",
  },
  {
    from: "capability-engine",
    to: "recovery-engine",
    reason: "Capability never depends upward on Recovery",
  },
  {
    from: "capability-engine",
    to: "recommendation-engine",
    reason: "Capability never depends on Recommendation",
  },
  {
    from: "capability-engine",
    to: "knowledge-engine",
    reason: "Capability never depends on Knowledge",
  },
  {
    from: "capability-engine",
    to: "incident-engine",
    reason: "Capability never depends on Incident",
  },
  {
    from: "knowledge-engine",
    to: "runtime-doctor",
    reason: "Knowledge must not import Doctor",
  },
  {
    from: "knowledge-engine",
    to: "recommendation-engine",
    reason: "Knowledge must not depend on Recommendation",
  },
  {
    from: "knowledge-engine",
    to: "recovery-engine",
    reason: "Knowledge must not depend on Recovery",
  },
  {
    from: "knowledge-engine",
    to: "incident-engine",
    reason: "Knowledge consumes incident-shaped input only — no Incident import",
  },
  {
    from: "recommendation-engine",
    to: "runtime-doctor",
    reason: "Recommendation must not import Doctor",
  },
  {
    from: "recommendation-engine",
    to: "recovery-engine",
    reason: "Recommendation must not import Recovery",
  },
  {
    from: "recommendation-engine",
    to: "capability-engine",
    reason: "Recovery owns Capability.recover resolution",
  },
  {
    from: "recovery-engine",
    to: "runtime-doctor",
    reason: "Recovery must not import Doctor",
  },
  {
    from: "recovery-engine",
    to: "incident-engine",
    reason: "Recovery must not import Incident",
  },
  {
    from: "recovery-engine",
    to: "knowledge-engine",
    reason: "Recovery must not import Knowledge",
  },
  {
    from: "recovery-engine",
    to: "ymos-runtime-assets",
    reason: "Recovery never knows Assets",
  },
  {
    from: "recovery-engine",
    to: "runtime-host",
    reason: "Recovery must not import Host (platform detection lives in Core)",
  },
];
