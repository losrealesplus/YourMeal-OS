/**
 * Incident Engine — Developer Platform v1.2
 *
 * Spec: docs/05-architecture/INCIDENT_ENGINE.md
 * ADR: docs/adr/0041-incident-engine.md
 * Roadmap: #300 · DEVELOPER-PLATFORM-005
 */

export type {
  RuntimeIncident,
  ReportIncidentInput,
  IncidentSeverity,
  IncidentCategory,
  IncidentLifecycleStatus,
  IncidentRecoveryStatus,
  IncidentTimelineEvent,
  IncidentTimelineEventKind,
  RecoverIncidentResult,
} from "./incident.types";
export { INCIDENT_ENGINE_VERSION } from "./incident.types";

export {
  reportIncident,
  dismissIncident,
  resolveIncident,
  recoverIncident,
  getOpenIncidents,
  getResolvedIncidents,
  getIncidentTimeline,
  clearResolved,
  exportIncidents,
  getIncidentEngineInfo,
} from "./IncidentEngine";

export {
  appendTimelineEvent,
  resetIncidentTimeline,
} from "./IncidentTimeline";

export {
  resetIncidentRegistry,
  getIncident,
  listIncidents,
} from "./IncidentRegistry";

export {
  registerIncidentsModule,
  resetIncidentsModuleFlags,
} from "./register-incidents-module";

export { IncidentsPanel } from "./IncidentsPanel";

export {
  reportIncidentFromDoctorCheck,
  markDoctorRunOnTimeline,
} from "./doctor-bridge";

export {
  categoryFromCapability,
  incidentCategoryLabel,
} from "./IncidentCategories";
