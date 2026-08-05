/**
 * Incident Timeline — automatic events for incident lifecycle.
 * DEVELOPER-PLATFORM-005
 */

import type {
  IncidentTimelineEvent,
  IncidentTimelineEventKind,
} from "./incident.types";

const events: IncidentTimelineEvent[] = [];
let seq = 0;

function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

export function appendTimelineEvent(
  input: Omit<IncidentTimelineEvent, "id"> & { id?: string },
): IncidentTimelineEvent {
  const event: IncidentTimelineEvent = {
    id: input.id ?? nextId("tl"),
    timestamp: input.timestamp,
    kind: input.kind,
    message: input.message,
    incidentId: input.incidentId,
    evidenceId: input.evidenceId,
    capability: input.capability,
    moduleId: input.moduleId,
    payload: input.payload,
  };
  events.push(event);
  return event;
}

export function getIncidentTimeline(options?: {
  incidentId?: string;
  limit?: number;
}): IncidentTimelineEvent[] {
  let list = events.slice();
  if (options?.incidentId) {
    list = list.filter((e) => e.incidentId === options.incidentId);
  }
  list.sort((a, b) => a.timestamp - b.timestamp);
  if (options?.limit != null && options.limit > 0) {
    return list.slice(-options.limit);
  }
  return list;
}

export function resetIncidentTimeline(): void {
  events.length = 0;
  seq = 0;
}

export type { IncidentTimelineEvent, IncidentTimelineEventKind };
