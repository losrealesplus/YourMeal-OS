import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  findModule,
  resetRuntimeEvents,
  resetRuntimeRegistry,
} from "../runtime-core";
import { resetModuleRenderers } from "../runtime-host";
import {
  reportIncident,
  resetIncidentRegistry,
  resetIncidentTimeline,
} from "../incident-engine";
import {
  registerFoundationKnowledge,
  resetFoundationKnowledgeFlag,
  resetKnowledgeRegistry,
} from "../knowledge-engine";
import {
  buildRecommendations,
  clearRecommendations,
  clearRecommendationStore,
  resetRecommendationsModuleFlags,
} from "../recommendation-engine";
import {
  FOUNDATION_CAPABILITY_IDS,
  registerBuiltinCapabilities,
  resetBuiltinCapabilitiesFlag,
  resetCapabilitiesModuleFlags,
  resetCapabilityLifecycle,
  resetCapabilityRegistry,
} from "../capability-engine";
import {
  exportRecoveryHistory,
  exportRecoveryHistoryDocument,
  getRecoveryHistory,
  getRecoveryTimeline,
  registerRecoveryModule,
  resetRecoveryHistory,
  resetRecoveryModuleFlags,
  runRecovery,
  verifyRecovery,
} from "./index";

function installSessionStoragePolyfill() {
  const store = new Map<string, string>();
  const sessionStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
  };
  (globalThis as { window?: unknown }).window = {
    sessionStorage,
  };
  (globalThis as { sessionStorage?: typeof sessionStorage }).sessionStorage =
    sessionStorage;
  return store;
}

let sessionStore: Map<string, string>;

beforeAll(() => {
  sessionStore = installSessionStoragePolyfill();
});

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
  resetIncidentRegistry();
  resetIncidentTimeline();
  resetKnowledgeRegistry();
  resetFoundationKnowledgeFlag();
  resetRuntimeRegistry();
  resetRuntimeEvents();
  resetModuleRenderers();
  sessionStore?.clear();
});

describe("Recovery Engine", () => {
  it("shows Recovery Not Supported without throwing for assets", async () => {
    registerBuiltinCapabilities();
    registerFoundationKnowledge();
    reportIncident({
      moduleId: "doctor",
      checkId: "assets.logo",
      capability: "assets",
      severity: "error",
      title: "Logo · FAIL",
      description: "logo not found",
      evidenceIds: ["ev-logo"],
    });
    const recs = buildRecommendations();
    const assetsRec = recs.find((r) =>
      r.knowledgeIds.some((k) => k.includes("logo")),
    );
    expect(assetsRec).toBeTruthy();
    expect(
      assetsRec!.actions.some((a) => a.type === "recovery" && !a.supported),
    ).toBe(true);

    const result = await runRecovery({ recommendationId: assetsRec!.id });
    expect(result.status).toBe("failed");
    expect(result.recoverMessage).toMatch(/Not Supported/i);
    expect(getRecoveryHistory()).toHaveLength(1);
  });

  it("Runtime recover + verify PASS clears dismiss gate", async () => {
    registerBuiltinCapabilities();
    registerFoundationKnowledge();
    window.sessionStorage.setItem("ymos.runtime-inspector", "0");

    reportIncident({
      moduleId: "doctor",
      capability: "runtime",
      severity: "warning",
      title: "Runtime disabled",
      description: "overlay inspector disabled ymos.runtime-inspector",
      evidenceIds: ["ev-rt"],
    });
    const recs = buildRecommendations();
    const runtimeRec = recs.find((r) => r.capabilityIds.includes("runtime"));
    expect(runtimeRec).toBeTruthy();
    expect(
      runtimeRec!.actions.some((a) => a.type === "recovery" && a.supported),
    ).toBe(true);

    const result = await runRecovery({ recommendationId: runtimeRec!.id });
    expect(result.status).toBe("success");
    expect(result.capabilityId).toBe("runtime");
    expect(result.verifyResult?.ok).toBe(true);
    expect(window.sessionStorage.getItem("ymos.runtime-inspector")).toBe("1");
    expect(result.evidences.length).toBeGreaterThan(0);

    const tl = getRecoveryTimeline(result.id);
    expect(tl.some((e) => e.kind === "recovery-started")).toBe(true);
    expect(tl.some((e) => e.kind === "verify-pass")).toBe(true);
    expect(tl.some((e) => e.kind === "evidence-linked")).toBe(true);
    expect(tl.some((e) => e.kind === "recovery-finished")).toBe(true);

    expect(verifyRecovery(result.id)?.ok).toBe(true);
  });

  it("exportRecoveryHistory returns JSON-serializable array", async () => {
    registerBuiltinCapabilities();
    registerFoundationKnowledge();
    reportIncident({
      moduleId: "doctor",
      capability: "runtime",
      severity: "info",
      title: "Runtime disabled",
      description: "runtime disabled",
    });
    const rec = buildRecommendations().find((r) =>
      r.capabilityIds.includes("runtime"),
    )!;
    await runRecovery({ recommendationId: rec.id });
    const exported = exportRecoveryHistory();
    expect(Array.isArray(exported)).toBe(true);
    expect(JSON.parse(JSON.stringify(exported))).toEqual(exported);
    const doc = JSON.parse(exportRecoveryHistoryDocument());
    expect(doc.engine).toBe("recovery-engine");
    expect(doc.history.length).toBe(1);
  });

  it("registers Host Recovery module", () => {
    registerRecoveryModule();
    expect(findModule("recovery")?.category).toBe("Recovery");
    expect(FOUNDATION_CAPABILITY_IDS).toContain("runtime");
  });
});
