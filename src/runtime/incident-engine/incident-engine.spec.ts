import { afterEach, describe, expect, it } from "vitest";
import {
  findModule,
  registerBuiltinRuntimeModules,
  resetRuntimeEvents,
  resetRuntimeRegistry,
} from "../runtime-core";
import { resetBuiltinRegistrationFlag } from "../runtime-core/register-builtins";
import { resetModuleRenderers } from "../runtime-host";
import {
  registerCheck,
  registerDoctorModule,
  resetBuiltinDoctorChecksFlag,
  resetDoctorModuleFlags,
  resetDoctorRegistry,
  runDoctor,
} from "../runtime-doctor";
import {
  clearResolved,
  dismissIncident,
  exportIncidents,
  getIncidentTimeline,
  getOpenIncidents,
  recoverIncident,
  registerIncidentsModule,
  reportIncident,
  resetIncidentRegistry,
  resetIncidentTimeline,
  resetIncidentsModuleFlags,
  resolveIncident,
} from "./index";

afterEach(() => {
  resetRuntimeRegistry();
  resetRuntimeEvents();
  resetBuiltinRegistrationFlag();
  resetDoctorRegistry();
  resetBuiltinDoctorChecksFlag();
  resetDoctorModuleFlags();
  resetModuleRenderers();
  resetIncidentRegistry();
  resetIncidentTimeline();
  resetIncidentsModuleFlags();
});

describe("Incident Engine", () => {
  it("reportIncident creates structured incident + timeline", () => {
    const inc = reportIncident({
      capability: "storage",
      moduleId: "demo",
      severity: "error",
      title: "Storage FAIL",
      description: "quota exceeded",
      recommendation: "Clear cache",
      evidenceIds: ["ev-1"],
      confidence: 0.95,
    });
    expect(inc.id).toMatch(/^inc-/);
    expect(inc.status).toBe("open");
    expect(inc.evidenceIds).toEqual(["ev-1"]);
    expect(getOpenIncidents()).toHaveLength(1);
    const tl = getIncidentTimeline({ incidentId: inc.id });
    expect(tl.some((e) => e.kind === "incident-created")).toBe(true);
    expect(tl.some((e) => e.kind === "evidence-linked")).toBe(true);
    expect(tl.some((e) => e.kind === "recommendation-added")).toBe(true);
  });

  it("dedupes open incidents by module+check and links evidence", () => {
    reportIncident({
      moduleId: "doctor",
      checkId: "assets.logo",
      capability: "assets",
      severity: "error",
      title: "Logo FAIL",
      description: "missing",
      evidenceIds: ["e1"],
    });
    reportIncident({
      moduleId: "doctor",
      checkId: "assets.logo",
      capability: "assets",
      severity: "critical",
      title: "Logo FAIL",
      description: "still missing",
      evidenceIds: ["e2"],
      recommendation: "Restore logo asset",
    });
    const open = getOpenIncidents();
    expect(open).toHaveLength(1);
    expect(open[0].severity).toBe("critical");
    expect(open[0].evidenceIds).toEqual(["e1", "e2"]);
  });

  it("recoverIncident returns NOT_IMPLEMENTED", () => {
    const inc = reportIncident({
      moduleId: "x",
      capability: "runtime",
      severity: "warning",
      title: "Warn",
      description: "soft",
    });
    const result = recoverIncident(inc.id);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("NOT_IMPLEMENTED");
  });

  it("dismiss / resolve / clearResolved / exportIncidents", () => {
    const a = reportIncident({
      moduleId: "a",
      capability: "runtime",
      severity: "error",
      title: "A",
      description: "a",
    });
    const b = reportIncident({
      moduleId: "b",
      capability: "runtime",
      severity: "warning",
      title: "B",
      description: "b",
    });
    dismissIncident(a.id);
    resolveIncident(b.id);
    expect(getOpenIncidents()).toHaveLength(0);
    const exported = exportIncidents();
    expect(exported).toHaveLength(2);
    expect(clearResolved()).toBe(2);
    expect(exportIncidents()).toHaveLength(0);
  });

  it("Doctor fail/warning reports incidents automatically", async () => {
    registerIncidentsModule();
    registerDoctorModule();
    registerCheck({
      id: "demo.incident-fail",
      name: "Incident Fail",
      capability: "developer",
      severity: "error",
      run: () => ({
        status: "fail",
        message: "boom",
        recommendations: ["Fix boom"],
      }),
    });
    const report = await runDoctor({ platform: "web" });
    expect(report.evidences.length).toBeGreaterThan(0);
    const open = getOpenIncidents().filter(
      (i) => i.checkId === "demo.incident-fail",
    );
    expect(open).toHaveLength(1);
    expect(open[0].evidenceIds.length).toBeGreaterThan(0);
    expect(
      getIncidentTimeline().some((e) => e.kind === "doctor-run"),
    ).toBe(true);
    expect(findModule("incidents")).toBeTruthy();
  });

  it("registers incidents module idempotently", () => {
    registerBuiltinRuntimeModules();
    registerIncidentsModule();
    registerIncidentsModule();
    expect(findModule("incidents")?.category).toBe("Health");
  });
});
