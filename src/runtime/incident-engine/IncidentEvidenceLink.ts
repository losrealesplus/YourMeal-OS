/**
 * Link evidence ids to incidents without duplicating payloads.
 */

import type { RuntimeIncident } from "./incident.types";

export function linkEvidenceIds(
  incident: RuntimeIncident,
  evidenceIds: string[],
): RuntimeIncident {
  const set = new Set(incident.evidenceIds);
  for (const id of evidenceIds) {
    if (id) set.add(id);
  }
  return { ...incident, evidenceIds: [...set] };
}

export function evidenceAlreadyLinked(
  incident: RuntimeIncident,
  evidenceId: string,
): boolean {
  return incident.evidenceIds.includes(evidenceId);
}
