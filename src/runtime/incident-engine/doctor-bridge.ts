/**
 * Doctor → Incident bridge.
 * Doctor does not build incident objects; it calls reportIncident().
 * Kept here so DoctorRunner only depends on a thin adapter.
 */

import type { RuntimeEvidence, RuntimeSeverity } from "../runtime-core";
import type { DoctorCheck, DoctorCheckResult } from "../runtime-doctor/DoctorCheck";
import { reportIncident } from "./IncidentEngine";
import { appendTimelineEvent } from "./IncidentTimeline";
import type { RuntimeIncident } from "./incident.types";

function mapSeverity(
  check: DoctorCheck,
  result: DoctorCheckResult,
): RuntimeSeverity {
  if (result.severity) return result.severity;
  if (result.status === "warning") return "warning";
  return check.severity === "info" ? "error" : check.severity;
}

/**
 * When a Doctor check fails/warns, report a structured incident + timeline.
 */
export function reportIncidentFromDoctorCheck(input: {
  check: DoctorCheck;
  result: DoctorCheckResult;
  evidence: RuntimeEvidence;
  runAt: string;
}): RuntimeIncident {
  const { check, result, evidence, runAt } = input;
  const ts = Date.parse(runAt) || Date.now();

  appendTimelineEvent({
    timestamp: ts,
    kind: result.status === "warning" ? "check-warning" : "check-fail",
    message: `${check.capability} · ${check.name} · ${result.status.toUpperCase()}`,
    capability: check.capability,
    moduleId: "doctor",
    evidenceId: evidence.id,
    payload: { checkId: check.id },
  });

  return reportIncident({
    capability: check.capability,
    moduleId: "doctor",
    checkId: check.id,
    severity: mapSeverity(check, result),
    title: `${check.name} · ${result.status.toUpperCase()}`,
    description: result.message,
    recommendation: result.recommendations?.[0],
    recoveryAvailable: false,
    confidence: result.status === "fail" ? 0.9 : 0.7,
    evidenceIds: [evidence.id],
    timestamp: ts,
  });
}

export function markDoctorRunOnTimeline(runAt: string, platform: string): void {
  appendTimelineEvent({
    timestamp: Date.parse(runAt) || Date.now(),
    kind: "doctor-run",
    message: `Doctor executed · ${platform}`,
    moduleId: "doctor",
    payload: { platform },
  });
}
