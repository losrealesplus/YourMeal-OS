/**
 * Performance baseline — measure only (no optimization).
 * DEVELOPER-PLATFORM-011
 *
 * Snapshot written under docs/05-architecture/baselines/ for future comparison.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getModules,
  registerBuiltinRuntimeModules,
  resetRuntimeEvents,
  resetRuntimeRegistry,
} from "../runtime-core";
import {
  registerLegacyHostModules,
  resetLegacyHostRegistrationFlag,
  resetModuleRenderers,
} from "../runtime-host";
import {
  registerBuiltinDoctorChecks,
  registerDoctorModule,
  resetBuiltinDoctorChecksFlag,
  resetDoctorModuleFlags,
  resetDoctorRegistry,
  runDoctor,
} from "../runtime-doctor";
import {
  listCapabilities,
  registerBuiltinCapabilities,
  registerCapabilitiesModule,
  resetBuiltinCapabilitiesFlag,
  resetCapabilitiesModuleFlags,
  resetCapabilityLifecycle,
  resetCapabilityRegistry,
} from "../capability-engine";
import {
  registerFoundationKnowledge,
  registerKnowledgeModule,
  resetFoundationKnowledgeFlag,
  resetKnowledgeModuleFlags,
  resetKnowledgeRegistry,
  getAllKnowledge,
} from "../knowledge-engine";
import {
  buildRecommendations,
  clearRecommendations,
  clearRecommendationStore,
  registerRecommendationsModule,
  resetRecommendationsModuleFlags,
} from "../recommendation-engine";
import {
  registerRecoveryModule,
  resetRecoveryHistory,
  resetRecoveryModuleFlags,
  runRecovery,
} from "../recovery-engine";
import {
  registerIncidentsModule,
  reportIncident,
  resetIncidentRegistry,
  resetIncidentTimeline,
  resetIncidentsModuleFlags,
} from "../incident-engine";
import { DEVELOPER_PLATFORM_VERSION } from "../runtime-core";

afterEach(() => {
  resetRecoveryHistory();
  resetRecoveryModuleFlags();
  clearRecommendations();
  clearRecommendationStore();
  resetRecommendationsModuleFlags();
  resetCapabilityRegistry();
  resetCapabilityLifecycle();
  resetBuiltinCapabilitiesFlag();
  resetCapabilitiesModuleFlags();
  resetDoctorRegistry();
  resetBuiltinDoctorChecksFlag();
  resetDoctorModuleFlags();
  resetIncidentRegistry();
  resetIncidentTimeline();
  resetIncidentsModuleFlags();
  resetKnowledgeRegistry();
  resetFoundationKnowledgeFlag();
  resetKnowledgeModuleFlags();
  resetLegacyHostRegistrationFlag();
  resetRuntimeRegistry();
  resetRuntimeEvents();
  resetModuleRenderers();
});

function ms(fn: () => void | Promise<void>): Promise<number> {
  const t0 = performance.now();
  return Promise.resolve(fn()).then(() => performance.now() - t0);
}

describe("Performance baseline (measure only)", () => {
  it("records Doctor / Recovery / Host / module / check counts", async () => {
    registerBuiltinRuntimeModules();
    registerLegacyHostModules();
    registerDoctorModule();
    registerIncidentsModule();
    registerKnowledgeModule();
    registerRecommendationsModule();
    registerCapabilitiesModule();
    registerRecoveryModule();
    registerBuiltinDoctorChecks();
    registerFoundationKnowledge();

    const hostMs = await ms(() => {
      void getModules().length;
    });

    const doctorMs = await ms(async () => {
      await runDoctor({
        platform: "web",
        runAt: new Date().toISOString(),
      });
    });

    reportIncident({
      moduleId: "doctor",
      capability: "runtime",
      severity: "warning",
      title: "Runtime disabled",
      description: "overlay inspector disabled",
    });
    const recs = buildRecommendations();
    const runtimeRec = recs.find((r) => r.capabilityIds.includes("runtime"));

    const recoveryMs = runtimeRec
      ? await ms(async () => {
          await runRecovery({ recommendationId: runtimeRec.id });
        })
      : 0;

    const baseline = {
      version: DEVELOPER_PLATFORM_VERSION,
      capturedAt: new Date().toISOString(),
      doctorMs: Number(doctorMs.toFixed(3)),
      recoveryMs: Number(recoveryMs.toFixed(3)),
      hostLookupMs: Number(hostMs.toFixed(3)),
      hostModuleCount: getModules().length,
      capabilityCount: listCapabilities().length,
      knowledgeCount: getAllKnowledge().length,
      note: "Baseline only — do not regress without ADR. Not an SLA.",
    };

    const outDir = join(
      process.cwd(),
      "docs/05-architecture/baselines",
    );
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      join(outDir, "developer-platform-v1-performance.json"),
      JSON.stringify(baseline, null, 2) + "\n",
      "utf8",
    );

    expect(baseline.hostModuleCount).toBeGreaterThanOrEqual(8);
    expect(baseline.capabilityCount).toBeGreaterThanOrEqual(5);
    expect(baseline.doctorMs).toBeGreaterThanOrEqual(0);
    expect(baseline.recoveryMs).toBeGreaterThanOrEqual(0);
  });
});
