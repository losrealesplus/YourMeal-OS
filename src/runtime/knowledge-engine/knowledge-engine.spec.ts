import { afterEach, describe, expect, it } from "vitest";
import {
  findModule,
  resetRuntimeEvents,
  resetRuntimeRegistry,
} from "../runtime-core";
import { resetModuleRenderers } from "../runtime-host";
import {
  FOUNDATION_KNOWLEDGE_IDS,
  getAllKnowledge,
  getKnowledge,
  matchCapability,
  matchIncident,
  registerFoundationKnowledge,
  registerKnowledge,
  registerKnowledgeModule,
  resetFoundationKnowledgeFlag,
  resetKnowledgeModuleFlags,
  resetKnowledgeRegistry,
  searchKnowledge,
} from "./index";

afterEach(() => {
  resetKnowledgeRegistry();
  resetFoundationKnowledgeFlag();
  resetKnowledgeModuleFlags();
  resetRuntimeRegistry();
  resetRuntimeEvents();
  resetModuleRenderers();
});

describe("Knowledge Engine", () => {
  it("registers foundation articles idempotently", () => {
    registerFoundationKnowledge();
    registerFoundationKnowledge();
    expect(getAllKnowledge()).toHaveLength(FOUNDATION_KNOWLEDGE_IDS.length);
    expect(getKnowledge("know.assets.logo-not-found")).toBeTruthy();
  });

  it("searchKnowledge finds Assets / Logo / Android / Runtime / Supabase", () => {
    registerFoundationKnowledge();
    expect(searchKnowledge("Logo").some((a) => a.id.includes("logo"))).toBe(
      true,
    );
    expect(searchKnowledge("Android").length).toBeGreaterThan(0);
    expect(searchKnowledge("Supabase").length).toBeGreaterThan(0);
    expect(searchKnowledge("Runtime").length).toBeGreaterThan(0);
    expect(searchKnowledge("Assets").length).toBeGreaterThan(0);
  });

  it("matchIncident links logo failure to assets knowledge", () => {
    registerFoundationKnowledge();
    const matches = matchIncident({
      title: "Logo · FAIL",
      description: "logo not found",
      capability: "assets",
      checkId: "assets.logo",
    });
    expect(matches.some((m) => m.article.id === "know.assets.logo-not-found")).toBe(
      true,
    );
    expect(matches[0].score).toBeGreaterThan(0);
  });

  it("matchCapability returns android articles", () => {
    registerFoundationKnowledge();
    const list = matchCapability("android");
    expect(list.some((a) => a.id === "know.android.sdk-mismatch")).toBe(true);
  });

  it("registerKnowledge adds custom article searchable by tag", () => {
    registerKnowledge({
      id: "know.demo",
      title: "Demo article",
      description: "custom",
      category: "developer",
      severity: "info",
      tags: ["demo-tag"],
      capabilities: ["developer"],
      incidentPatterns: ["demo-pattern"],
      recommendations: ["Do nothing"],
    });
    expect(searchKnowledge("demo-tag")).toHaveLength(1);
    expect(
      matchIncident({
        title: "demo-pattern hit",
        capability: "developer",
      }).some((m) => m.article.id === "know.demo"),
    ).toBe(true);
  });

  it("registers Knowledge Host module under Knowledge category", () => {
    registerKnowledgeModule();
    registerKnowledgeModule();
    expect(findModule("knowledge")?.category).toBe("Knowledge");
    expect(getAllKnowledge().length).toBe(FOUNDATION_KNOWLEDGE_IDS.length);
  });
});
