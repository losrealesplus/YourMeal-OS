import { afterEach, describe, expect, it } from "vitest";
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
  exportRecommendations,
  getRecommendations,
  priorityFromSeverity,
  registerRecommendationsModule,
  resetRecommendationsModuleFlags,
  clearRecommendationStore,
} from "./index";

afterEach(() => {
  clearRecommendations();
  clearRecommendationStore();
  resetRecommendationsModuleFlags();
  resetIncidentRegistry();
  resetIncidentTimeline();
  resetKnowledgeRegistry();
  resetFoundationKnowledgeFlag();
  resetRuntimeRegistry();
  resetRuntimeEvents();
  resetModuleRenderers();
});

describe("Recommendation Engine", () => {
  it("maps severity to priority", () => {
    expect(priorityFromSeverity("critical")).toBe("critical");
    expect(priorityFromSeverity("error")).toBe("high");
    expect(priorityFromSeverity("warning")).toBe("medium");
    expect(priorityFromSeverity("info")).toBe("low");
  });

  it("builds recommendations only via Knowledge (never bare incident text)", () => {
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
    const list = buildRecommendations();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].knowledgeIds.length).toBeGreaterThan(0);
    expect(list[0].knowledgeIds[0]).toContain("know.");
    expect(list[0].incidentIds.length).toBe(1);
    expect(list[0].actions.some((a) => a.type === "recovery" && !a.supported)).toBe(
      true,
    );
    expect(list[0].capabilityIds.length).toBeGreaterThan(0);
  });

  it("groups multiple incidents into one recommendation per knowledge", () => {
    registerFoundationKnowledge();
    reportIncident({
      moduleId: "doctor",
      checkId: "assets.logo",
      capability: "assets",
      severity: "error",
      title: "Logo FAIL",
      description: "logo not found",
      evidenceIds: ["e1"],
    });
    reportIncident({
      moduleId: "doctor",
      checkId: "assets.logo-2",
      capability: "assets",
      severity: "warning",
      title: "Logo missing again",
      description: "logo fail on splash",
      evidenceIds: ["e2"],
    });
    // Force second open incident with different check id but same knowledge
    reportIncident({
      moduleId: "suite",
      checkId: "brand.logo",
      capability: "assets",
      severity: "error",
      title: "Assets logo not found",
      description: "__l5e placeholder",
      evidenceIds: ["e3"],
    });
    const list = buildRecommendations();
    const logoRecs = list.filter((r) =>
      r.knowledgeIds.includes("know.assets.logo-not-found"),
    );
    expect(logoRecs).toHaveLength(1);
    expect(logoRecs[0].incidentIds.length).toBeGreaterThanOrEqual(2);
  });

  it("orders critical before high/medium/low", () => {
    registerFoundationKnowledge();
    reportIncident({
      moduleId: "doctor",
      capability: "runtime",
      severity: "info",
      title: "Runtime disabled",
      description: "overlay inspector disabled",
    });
    reportIncident({
      moduleId: "doctor",
      capability: "supabase",
      severity: "critical",
      title: "Supabase env missing",
      description: "VITE_SUPABASE url missing",
    });
    reportIncident({
      moduleId: "doctor",
      capability: "android",
      severity: "warning",
      title: "Android SDK mismatch",
      description: "capacitor sdk mismatch",
    });
    const list = buildRecommendations();
    expect(list.length).toBeGreaterThanOrEqual(2);
    const ranks = { critical: 0, high: 1, medium: 2, low: 3 };
    for (let i = 1; i < list.length; i++) {
      expect(ranks[list[i].priority]).toBeGreaterThanOrEqual(
        ranks[list[i - 1].priority],
      );
    }
    expect(list[0].priority).toBe("critical");
  });

  it("exportRecommendations returns JSON-serializable array", () => {
    registerFoundationKnowledge();
    reportIncident({
      moduleId: "doctor",
      capability: "runtime",
      severity: "warning",
      title: "stale cache",
      description: "stale cache after deploy",
    });
    buildRecommendations();
    const exported = exportRecommendations();
    expect(Array.isArray(exported)).toBe(true);
    expect(JSON.parse(JSON.stringify(exported))).toEqual(exported);
    clearRecommendations();
    expect(getRecommendations()).toHaveLength(0);
  });

  it("registers Host module under Recommendations category", () => {
    registerRecommendationsModule();
    expect(findModule("recommendations")?.category).toBe("Recommendations");
  });
});
