/**
 * Incident-level recover() stub — orchestration lives in Recovery Engine.
 * DEVELOPER-PLATFORM-011: keep API; point callers to Recovery Engine.
 */

import type { RecoverIncidentResult } from "./incident.types";

/**
 * Not the Recovery Engine. Incidents do not self-recover.
 * Use `runRecovery({ recommendationId })` from recovery-engine.
 */
export function recoverIncidentNotImplemented(
  incidentId: string,
): RecoverIncidentResult {
  return {
    ok: false,
    code: "NOT_IMPLEMENTED",
    message:
      "Incident.recover is not implemented. Use Recovery Engine runRecovery() via a Recommendation.",
    incidentId,
  };
}
