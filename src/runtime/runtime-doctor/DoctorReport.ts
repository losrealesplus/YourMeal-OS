/**
 * Doctor report shapes — Health Score · capabilities · FOPEBA evidence.
 * DEVELOPER-PLATFORM-004
 */

import type { RuntimeEvidence, RuntimePlatform } from "../runtime-core";
import type {
  DoctorCapabilityId,
  DoctorCheckStatus,
  DoctorCheckResult,
} from "./DoctorCheck";

export type DoctorExecutedCheck = {
  id: string;
  name: string;
  capability: DoctorCapabilityId;
  status: DoctorCheckStatus;
  message: string;
  severity?: DoctorCheckResult["severity"];
  recommendations: string[];
  soft?: boolean;
  durationMs: number;
};

export type DoctorCapabilitySummary = {
  capability: DoctorCapabilityId;
  label: string;
  status: DoctorCheckStatus;
  pass: number;
  warning: number;
  fail: number;
  info: number;
  skip: number;
  total: number;
};

export type DoctorReport = {
  version: string;
  runAt: string;
  platform: RuntimePlatform;
  /** 0–100 integer health score. */
  healthScore: number;
  ok: boolean;
  checks: DoctorExecutedCheck[];
  capabilities: DoctorCapabilitySummary[];
  evidences: RuntimeEvidence[];
  recommendations: string[];
  durationMs: number;
};

export const DOCTOR_ENGINE_VERSION = "1.1.0";
