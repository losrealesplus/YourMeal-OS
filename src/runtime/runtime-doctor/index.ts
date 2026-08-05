/**
 * YourMeal OS Doctor Engine — Developer Platform v1.1
 *
 * Spec: docs/05-architecture/DOCTOR_ENGINE.md
 * ADR: docs/adr/0040-doctor-engine.md
 *
 * Doctor does not know checks. Checks self-register via registerCheck().
 */

export type {
  DoctorCheck,
  DoctorCheckContext,
  DoctorCheckResult,
  DoctorCheckStatus,
  DoctorCapabilityId,
} from "./DoctorCheck";
export {
  DOCTOR_CAPABILITY_ORDER,
  DOCTOR_CAPABILITY_LABELS,
  doctorCapabilityLabel,
} from "./DoctorCapability";
export {
  registerCheck,
  unregisterCheck,
  getChecks,
  findCheck,
  resetDoctorRegistry,
} from "./DoctorRegistry";
export {
  runDoctor,
  computeHealthScore,
  type RunDoctorOptions,
} from "./DoctorRunner";
export type {
  DoctorReport,
  DoctorExecutedCheck,
  DoctorCapabilitySummary,
} from "./DoctorReport";
export { DOCTOR_ENGINE_VERSION } from "./DoctorReport";
export {
  evidenceFromDoctorCheck,
  shouldEmitDoctorEvidence,
} from "./DoctorEvidence";
export {
  registerBuiltinDoctorChecks,
  resetBuiltinDoctorChecksFlag,
  BUILTIN_DOCTOR_CHECK_IDS,
} from "./checks/register-builtin-checks";
export {
  registerDoctorModule,
  resetDoctorModuleFlags,
  doctorCheckCount,
} from "./register-doctor-module";
export { DoctorPanel } from "./DoctorPanel";
export {
  setLastDoctorReportJson,
  getLastDoctorReportJson,
  resetLastDoctorReportJson,
} from "./DoctorSession";
