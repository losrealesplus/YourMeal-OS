/**
 * Incident severity helpers.
 */

import type { IncidentSeverity } from "./incident.types";

export const INCIDENT_SEVERITY_ORDER: readonly IncidentSeverity[] = [
  "info",
  "warning",
  "error",
  "critical",
] as const;

export function severityRank(severity: IncidentSeverity): number {
  return INCIDENT_SEVERITY_ORDER.indexOf(severity);
}

export function maxSeverity(
  a: IncidentSeverity,
  b: IncidentSeverity,
): IncidentSeverity {
  return severityRank(a) >= severityRank(b) ? a : b;
}
