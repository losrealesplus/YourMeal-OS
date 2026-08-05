/**
 * Incident Registry — in-memory store of RuntimeIncident objects.
 */

import type { RuntimeIncident } from "./incident.types";

const incidents = new Map<string, RuntimeIncident>();
let seq = 0;

export function nextIncidentId(): string {
  seq += 1;
  return `inc-${Date.now().toString(36)}-${seq}`;
}

export function putIncident(incident: RuntimeIncident): void {
  incidents.set(incident.id, incident);
}

export function getIncident(id: string): RuntimeIncident | undefined {
  return incidents.get(id);
}

export function listIncidents(): RuntimeIncident[] {
  return [...incidents.values()].sort((a, b) => b.timestamp - a.timestamp);
}

export function deleteIncident(id: string): boolean {
  return incidents.delete(id);
}

export function clearIncidentsWhere(
  predicate: (i: RuntimeIncident) => boolean,
): number {
  let n = 0;
  for (const [id, inc] of incidents) {
    if (predicate(inc)) {
      incidents.delete(id);
      n += 1;
    }
  }
  return n;
}

/** Dedupe key: open incident for same module+check (or title). */
export function findOpenDuplicate(input: {
  moduleId: string;
  checkId?: string;
  title: string;
}): RuntimeIncident | undefined {
  return listIncidents().find((i) => {
    if (i.status !== "open") return false;
    if (i.moduleId !== input.moduleId) return false;
    if (input.checkId && i.checkId) return i.checkId === input.checkId;
    return i.title === input.title;
  });
}

export function resetIncidentRegistry(): void {
  incidents.clear();
  seq = 0;
}
