/**
 * FOPEBA evidence from Doctor check outcomes.
 * Failures / warnings become RuntimeEvidence automatically.
 * DEVELOPER-PLATFORM-004
 */

import {
  createEvidence,
  type RuntimeEvidence,
  type RuntimePlatform,
  type RuntimeSeverity,
} from "../runtime-core";
import type { DoctorCheck, DoctorCheckResult } from "./DoctorCheck";

function statusToSeverity(
  check: DoctorCheck,
  result: DoctorCheckResult,
): RuntimeSeverity {
  if (result.severity) return result.severity;
  if (result.status === "pass" || result.status === "info") return "info";
  if (result.status === "warning") return "warning";
  if (result.status === "skip") return "info";
  return check.severity;
}

/** True when outcome should emit FOPEBA evidence (non-pass). */
export function shouldEmitDoctorEvidence(
  result: DoctorCheckResult,
): boolean {
  return result.status === "fail" || result.status === "warning";
}

export function evidenceFromDoctorCheck(input: {
  check: DoctorCheck;
  result: DoctorCheckResult;
  platform: RuntimePlatform;
  runAt: string;
  device?: string;
}): RuntimeEvidence {
  const { check, result, platform, runAt } = input;
  return createEvidence({
    source: `doctor:${check.id}`,
    category: `doctor.${check.capability}`,
    severity: statusToSeverity(check, result),
    payload: {
      timestamp: runAt,
      device: input.device ?? "unknown",
      platform,
      module: "doctor",
      check: check.id,
      checkName: check.name,
      capability: check.capability,
      status: result.status,
      message: result.message,
      recommendations: result.recommendations ?? [],
      detail: result.payload ?? null,
    },
  });
}
