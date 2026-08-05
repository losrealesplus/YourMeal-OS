/**
 * Recovery contract — implementation deferred (Roadmap #303).
 * recoverIncident() returns NOT_IMPLEMENTED to preserve future API.
 */

import type { RecoverIncidentResult } from "./incident.types";

export function recoverIncidentNotImplemented(
  incidentId: string,
): RecoverIncidentResult {
  return {
    ok: false,
    code: "NOT_IMPLEMENTED",
    message:
      "Recovery Engine not implemented yet (Developer Platform roadmap #303).",
    incidentId,
  };
}
