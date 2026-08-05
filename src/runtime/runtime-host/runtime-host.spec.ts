import { afterEach, describe, expect, it } from "vitest";
import {
  getModules,
  getModulesSorted,
  registerBuiltinRuntimeModules,
  registerModule,
  resetRuntimeEvents,
  resetRuntimeRegistry,
} from "../runtime-core";
import { resetBuiltinRegistrationFlag } from "../runtime-core/register-builtins";
import {
  RUNTIME_HOST_CATEGORIES,
  detectRuntimePlatform,
  groupModulesByCategory,
  legacyTabForModuleId,
  moduleIdForLegacyTab,
  moduleSupportsPlatform,
  registerLegacyHostModules,
  resetLegacyHostRegistrationFlag,
  resetModuleRenderers,
} from "./index";

afterEach(() => {
  resetRuntimeRegistry();
  resetRuntimeEvents();
  resetBuiltinRegistrationFlag();
  resetLegacyHostRegistrationFlag();
  resetModuleRenderers();
});

describe("Developer Platform Host", () => {
  it("groups modules by Host category order", () => {
    registerModule({
      id: "a",
      title: "Zulu",
      category: "Developer",
      version: "1",
      permissions: "PUBLIC",
    });
    registerModule({
      id: "b",
      title: "Alpha",
      category: "Health",
      version: "1",
      permissions: "PUBLIC",
    });
    registerModule({
      id: "c",
      title: "Beta",
      category: "Health",
      version: "1",
      permissions: "PUBLIC",
    });
    const groups = groupModulesByCategory(getModules());
    expect(groups.map((g) => g.category)).toEqual(["Health", "Developer"]);
    expect(groups[0].modules.map((m) => m.title)).toEqual(["Alpha", "Beta"]);
  });

  it("getModulesSorted respects Host category order", () => {
    registerModule({
      id: "net",
      title: "Net",
      category: "Network",
      version: "1",
      permissions: "PUBLIC",
    });
    registerModule({
      id: "hlth",
      title: "Hlth",
      category: "Health",
      version: "1",
      permissions: "PUBLIC",
    });
    const sorted = getModulesSorted(RUNTIME_HOST_CATEGORIES);
    expect(sorted.map((m) => m.id)).toEqual(["hlth", "net"]);
  });

  it("moduleSupportsPlatform treats missing supports as all", () => {
    const mod = {
      id: "x",
      title: "X",
      category: "System" as const,
      version: "1",
      permissions: "PUBLIC" as const,
    };
    expect(moduleSupportsPlatform(mod, "android")).toBe(true);
    expect(
      moduleSupportsPlatform({ ...mod, supports: ["ios"] }, "android"),
    ).toBe(false);
    expect(moduleSupportsPlatform({ ...mod, supports: ["ios"] }, "ios")).toBe(
      true,
    );
  });

  it("detectRuntimePlatform defaults to web without Capacitor", () => {
    expect(detectRuntimePlatform()).toBe("web");
  });

  it("registers legacy bridges without duplicating builtins", () => {
    registerBuiltinRuntimeModules();
    registerLegacyHostModules();
    registerLegacyHostModules();
    expect(legacyTabForModuleId("assets")).toBe("Assets");
    expect(legacyTabForModuleId("consistency")).toBe("Consistency");
    expect(moduleIdForLegacyTab("Network")).toBe("network");
    expect(findIds()).toContain("general");
    expect(findIds()).toContain("assets");
    expect(findIds().filter((id) => id === "assets")).toHaveLength(1);
  });
});

function findIds(): string[] {
  return getModules().map((m) => m.id);
}
