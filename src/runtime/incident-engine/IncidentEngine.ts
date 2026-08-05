/**
 * Incident Engine — structured incidents from evidence (FOPEBA).
 * Modules call reportIncident(); Engine never scrapes console.log.
 * DEVELOPER-PLATFORM-005 · Roadmap #300
 */

import { emitRuntimeCoreEvent } from "../runtime-core";
import { categoryFromCapability } from "./IncidentCategories";
import { linkEvidenceIds } from "./IncidentEvidenceLink";
import { withRecommendation } from "./IncidentRecommendation";
import { recoverIncidentNotImplemented } from "./IncidentRecovery";
import {
  findOpenDuplicate,
  getIncident,
  listIncidents,
  nextIncidentId,
  putIncident,
  clearIncidentsWhere,
} from "./IncidentRegistry";
import { appendTimelineEvent, getIncidentTimeline } from "./IncidentTimeline";
import type {
  ReportIncidentInput,
  RecoverIncidentResult,
  RuntimeIncident,
  IncidentTimelineEvent,
} from "./incident.types";
import { INCIDENT_ENGINE_VERSION } from "./incident.types";

function clampConfidence(n: number | undefined): number {
  if (n == null || Number.isNaN(n)) return 0.8;
  return Math.min(1, Math.max(0, n));
}

/**
 * Report a structured incident. Dedupes open incidents by module+check.
 * Automatically appends timeline events (created · evidence · recommendation).
 */
export function reportIncident(input: ReportIncidentInput): RuntimeIncident {
  const timestamp = input.timestamp ?? Date.now();
  const evidenceIds = [...new Set(input.evidenceIds ?? [])];
  const category = input.category ?? categoryFromCapability(input.capability);
  const confidence = clampConfidence(input.confidence);

  const existing = findOpenDuplicate({
    moduleId: input.moduleId,
    checkId: input.checkId,
    title: input.title,
  });

  if (existing) {
    let updated = linkEvidenceIds(existing, evidenceIds);
    if (input.recommendation) {
      updated = withRecommendation(updated, input.recommendation);
    }
    if (severityWorse(input.severity, updated.severity)) {
      updated = { ...updated, severity: input.severity };
    }
    updated = {
      ...updated,
      description: input.description || updated.description,
      confidence: Math.max(updated.confidence, confidence),
      timestamp,
    };
    putIncident(updated);
    for (const eid of evidenceIds) {
      if (!existing.evidenceIds.includes(eid)) {
        appendTimelineEvent({
          timestamp,
          kind: "evidence-linked",
          message: `Evidence linked · ${eid}`,
          incidentId: updated.id,
          evidenceId: eid,
          capability: updated.capability,
          moduleId: updated.moduleId,
        });
      }
    }
    if (input.recommendation) {
      appendTimelineEvent({
        timestamp,
        kind: "recommendation-added",
        message: input.recommendation,
        incidentId: updated.id,
        capability: updated.capability,
        moduleId: updated.moduleId,
      });
    }
    emitRuntimeCoreEvent("incident-updated", { id: updated.id });
    return updated;
  }

  const incident: RuntimeIncident = {
    id: nextIncidentId(),
    timestamp,
    capability: input.capability,
    moduleId: input.moduleId,
    severity: input.severity,
    category,
    title: input.title,
    description: input.description,
    recommendation: input.recommendation,
    recoveryAvailable: Boolean(input.recoveryAvailable),
    recoveryStatus: input.recoveryAvailable ? "available" : "none",
    confidence,
    evidenceIds,
    status: "open",
    checkId: input.checkId,
  };

  putIncident(incident);

  appendTimelineEvent({
    timestamp,
    kind: "incident-created",
    message: `Incident created · ${incident.title}`,
    incidentId: incident.id,
    capability: incident.capability,
    moduleId: incident.moduleId,
    payload: { severity: incident.severity, checkId: incident.checkId },
  });

  for (const eid of evidenceIds) {
    appendTimelineEvent({
      timestamp,
      kind: "evidence-linked",
      message: `Evidence linked · ${eid}`,
      incidentId: incident.id,
      evidenceId: eid,
      capability: incident.capability,
      moduleId: incident.moduleId,
    });
  }

  if (incident.recommendation) {
    appendTimelineEvent({
      timestamp,
      kind: "recommendation-added",
      message: incident.recommendation,
      incidentId: incident.id,
      capability: incident.capability,
      moduleId: incident.moduleId,
    });
  }

  emitRuntimeCoreEvent("incident-reported", { id: incident.id });
  return incident;
}

function severityWorse(
  next: RuntimeIncident["severity"],
  prev: RuntimeIncident["severity"],
): boolean {
  const rank = { info: 0, warning: 1, error: 2, critical: 3 };
  return rank[next] > rank[prev];
}

export function dismissIncident(id: string): RuntimeIncident | undefined {
  const inc = getIncident(id);
  if (!inc) return undefined;
  const updated: RuntimeIncident = { ...inc, status: "dismissed" };
  putIncident(updated);
  appendTimelineEvent({
    timestamp: Date.now(),
    kind: "incident-dismissed",
    message: `Incident dismissed · ${inc.title}`,
    incidentId: id,
    capability: inc.capability,
    moduleId: inc.moduleId,
  });
  emitRuntimeCoreEvent("incident-dismissed", { id });
  return updated;
}

/** Mark resolved without running recovery (manual / verify path). */
export function resolveIncident(id: string): RuntimeIncident | undefined {
  const inc = getIncident(id);
  if (!inc) return undefined;
  const updated: RuntimeIncident = {
    ...inc,
    status: "resolved",
    recoveryStatus:
      inc.recoveryStatus === "none" ? "resolved" : inc.recoveryStatus,
  };
  putIncident(updated);
  appendTimelineEvent({
    timestamp: Date.now(),
    kind: "incident-resolved",
    message: `Incident resolved · ${inc.title}`,
    incidentId: id,
    capability: inc.capability,
    moduleId: inc.moduleId,
  });
  emitRuntimeCoreEvent("incident-resolved", { id });
  return updated;
}

/**
 * Incident.recover stub — orchestration lives in Recovery Engine (ADR-0046).
 * recoverIncident() returns NOT_IMPLEMENTED; use runRecovery() instead.
 */
export function recoverIncident(id: string): RecoverIncidentResult {
  const result = recoverIncidentNotImplemented(id);
  appendTimelineEvent({
    timestamp: Date.now(),
    kind: "recovery-not-implemented",
    message: result.message,
    incidentId: id,
  });
  const inc = getIncident(id);
  if (inc) {
    putIncident({ ...inc, recoveryStatus: "not_implemented" });
  }
  emitRuntimeCoreEvent("incident-recovery-stub", { id });
  return result;
}

export function getOpenIncidents(): RuntimeIncident[] {
  return listIncidents().filter((i) => i.status === "open");
}

export function getResolvedIncidents(): RuntimeIncident[] {
  return listIncidents().filter(
    (i) => i.status === "resolved" || i.status === "dismissed",
  );
}

export { getIncidentTimeline };

export function clearResolved(): number {
  return clearIncidentsWhere(
    (i) => i.status === "resolved" || i.status === "dismissed",
  );
}

/** Export contract — JSON array only (ZIP = roadmap #304). */
export function exportIncidents(): RuntimeIncident[] {
  const list = listIncidents();
  appendTimelineEvent({
    timestamp: Date.now(),
    kind: "export",
    message: `Exported ${list.length} incident(s)`,
    payload: { count: list.length },
  });
  return list;
}

export function getIncidentEngineInfo(): {
  version: string;
  open: number;
  total: number;
} {
  const all = listIncidents();
  return {
    version: INCIDENT_ENGINE_VERSION,
    open: all.filter((i) => i.status === "open").length,
    total: all.length,
  };
}

export type { IncidentTimelineEvent };
