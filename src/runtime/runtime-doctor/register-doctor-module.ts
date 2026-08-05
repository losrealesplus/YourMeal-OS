/**
 * Register Doctor as a Runtime Module + Host renderer.
 * DEVELOPER-PLATFORM-004
 */

import { createElement } from "react";
import {
  createEvidence,
  findModule,
  registerModule,
  type RuntimeModule,
} from "../runtime-core";
import { registerModuleRenderer } from "../runtime-host";
import { registerBuiltinDoctorChecks } from "./checks/register-builtin-checks";
import { registerBuiltinCapabilities } from "../capability-engine";
import { DoctorPanel } from "./DoctorPanel";
import { getChecks } from "./DoctorRegistry";
import { DOCTOR_ENGINE_VERSION } from "./DoctorReport";
import {
  getLastDoctorReportJson,
  resetLastDoctorReportJson,
} from "./DoctorSession";
import { runDoctor } from "./DoctorRunner";

const doctorModule: RuntimeModule = {
  id: "doctor",
  title: "Doctor",
  description: "Developer Health glance · Checks · Incidents · Evidence",
  icon: "stethoscope",
  category: "Health",
  version: DOCTOR_ENGINE_VERSION,
  experimental: false,
  visible: true,
  permissions: "ENGINEERING",
  supports: ["web", "android", "ios"],
  health: async () => {
    const raw = getLastDoctorReportJson();
    if (!raw) {
      return { ok: true, detail: "No Doctor run yet" };
    }
    try {
      const report = JSON.parse(raw) as { ok: boolean; healthScore: number };
      return {
        ok: report.ok,
        detail: `Health Score ${report.healthScore}%`,
      };
    } catch {
      return { ok: true, detail: "Last report unreadable" };
    }
  },
  diagnostics: async () => {
    const raw = getLastDoctorReportJson();
    if (!raw) return null;
    try {
      const report = JSON.parse(raw) as {
        evidences?: ReturnType<typeof createEvidence>[];
      };
      return report.evidences ?? null;
    } catch {
      return null;
    }
  },
  export: async () => {
    const raw = getLastDoctorReportJson();
    return createEvidence({
      source: "doctor",
      category: "diagnostics",
      severity: "info",
      payload: raw
        ? { bridged: true, report: JSON.parse(raw) }
        : { bridged: true, note: "run Doctor to capture report" },
    });
  },
};

let moduleInstalled = false;
let rendererInstalled = false;

/** Idempotent — register capabilities + checks + Doctor module + Host UI. */
export function registerDoctorModule(): void {
  registerBuiltinCapabilities();
  registerBuiltinDoctorChecks();

  if (!moduleInstalled) {
    if (!findModule("doctor")) {
      registerModule(doctorModule);
    }
    moduleInstalled = true;
  }

  if (!rendererInstalled) {
    registerModuleRenderer("doctor", () => createElement(DoctorPanel));
    rendererInstalled = true;
  }
}

/** Test helper */
export function resetDoctorModuleFlags(): void {
  moduleInstalled = false;
  rendererInstalled = false;
  resetLastDoctorReportJson();
}

export function doctorCheckCount(): number {
  return getChecks().length;
}

export { runDoctor };
