/**
 * Incident Engine contracts — structured incidents (not logs / free text).
 * DEVELOPER-PLATFORM-005 · Roadmap #300 · Developer Platform v1.2
 */

import type { RuntimeSeverity } from "../runtime-core";

export type IncidentSeverity = RuntimeSeverity;

export type IncidentRecoveryStatus =
  | "none"
  | "available"
  | "in_progress"
  | "resolved"
  | "failed"
  | "not_implemented";

export type IncidentLifecycleStatus = "open" | "dismissed" | "resolved";

/** Canonical categories (extensible via string). */
export type IncidentCategory =
  | "health"
  | "assets"
  | "branding"
  | "runtime"
  | "android"
  | "ios"
  | "network"
  | "supabase"
  | "storage"
  | "session"
  | "performance"
  | "security"
  | "developer"
  | "unknown"
  | (string & {});

/**
 * Permanent incident object — FOPEBA Observation → Evidence → Incident → Knowledge.
 */
export type RuntimeIncident = {
  id: string;
  /** Epoch ms */
  timestamp: number;
  capability: string;
  moduleId: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  title: string;
  description: string;
  recommendation?: string;
  recoveryAvailable: boolean;
  recoveryStatus: IncidentRecoveryStatus;
  /** 0–1 */
  confidence: number;
  evidenceIds: string[];
  status: IncidentLifecycleStatus;
  /** Optional check id when sourced from Doctor. */
  checkId?: string;
};

export type ReportIncidentInput = {
  capability: string;
  moduleId: string;
  severity: IncidentSeverity;
  category?: IncidentCategory;
  title: string;
  description: string;
  recommendation?: string;
  recoveryAvailable?: boolean;
  confidence?: number;
  evidenceIds?: string[];
  checkId?: string;
  /** Override timestamp (tests). */
  timestamp?: number;
};

export type IncidentTimelineEventKind =
  | "doctor-run"
  | "check-fail"
  | "check-warning"
  | "incident-created"
  | "evidence-linked"
  | "recommendation-added"
  | "incident-dismissed"
  | "incident-resolved"
  | "recovery-attempted"
  | "recovery-not-implemented"
  | "export"
  | "info";

export type IncidentTimelineEvent = {
  id: string;
  /** Epoch ms */
  timestamp: number;
  kind: IncidentTimelineEventKind;
  message: string;
  incidentId?: string;
  evidenceId?: string;
  capability?: string;
  moduleId?: string;
  payload?: unknown;
};

export type RecoverIncidentResult = {
  ok: false;
  code: "NOT_IMPLEMENTED";
  message: string;
  incidentId: string;
};

export const INCIDENT_ENGINE_VERSION = "1.2.0";
