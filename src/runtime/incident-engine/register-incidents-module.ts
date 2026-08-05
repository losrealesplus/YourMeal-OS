/**
 * Register Incidents as a Health Runtime Module + Host renderer.
 * Does not modify Host — only registerModule / registerModuleRenderer.
 * DEVELOPER-PLATFORM-005
 */

import { createElement } from "react";
import {
  createEvidence,
  findModule,
  registerModule,
  type RuntimeModule,
} from "../runtime-core";
import { registerModuleRenderer } from "../runtime-host";
import {
  exportIncidents,
  getIncidentEngineInfo,
  getOpenIncidents,
} from "./IncidentEngine";
import { IncidentsPanel } from "./IncidentsPanel";
import { INCIDENT_ENGINE_VERSION } from "./incident.types";

const incidentsModule: RuntimeModule = {
  id: "incidents",
  title: "Incidents",
  description: "Structured incidents · timeline · FOPEBA links",
  icon: "alert-triangle",
  category: "Health",
  version: INCIDENT_ENGINE_VERSION,
  experimental: false,
  visible: true,
  permissions: "ENGINEERING",
  supports: ["web", "android", "ios"],
  health: () => {
    const info = getIncidentEngineInfo();
    return {
      ok: info.open === 0,
      detail: `${info.open} open · ${info.total} total`,
    };
  },
  diagnostics: () => {
    const open = getOpenIncidents();
    if (open.length === 0) return null;
    return open.map((inc) =>
      createEvidence({
        source: `incident:${inc.id}`,
        category: `incident.${inc.category}`,
        severity: inc.severity,
        payload: {
          id: inc.id,
          title: inc.title,
          evidenceIds: inc.evidenceIds,
        },
      }),
    );
  },
  export: () =>
    createEvidence({
      source: "incidents",
      category: "diagnostics",
      severity: "info",
      payload: { incidents: exportIncidents() },
    }),
};

let moduleInstalled = false;
let rendererInstalled = false;

export function registerIncidentsModule(): void {
  if (!moduleInstalled) {
    if (!findModule("incidents")) {
      registerModule(incidentsModule);
    }
    moduleInstalled = true;
  }
  if (!rendererInstalled) {
    registerModuleRenderer("incidents", () => createElement(IncidentsPanel));
    rendererInstalled = true;
  }
}

export function resetIncidentsModuleFlags(): void {
  moduleInstalled = false;
  rendererInstalled = false;
}
