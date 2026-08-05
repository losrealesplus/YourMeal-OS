import { describe, expect, it } from "vitest";
import {
  RUNTIME_SUITE_MODULES,
  RUNTIME_SUITE_NAME,
  getSuiteModule,
  listAvailableSuiteModules,
  listPlannedSuiteModules,
} from "./modules";

describe("ymos-runtime-suite catalog", () => {
  it("names the product Runtime Suite", () => {
    expect(RUNTIME_SUITE_NAME).toBe("YourMeal OS Runtime Suite");
  });

  it("registers the twelve canonical modules", () => {
    expect(RUNTIME_SUITE_MODULES.map((m) => m.id)).toEqual([
      "doctor",
      "inspector",
      "assets",
      "consistency",
      "state",
      "network",
      "storage",
      "performance",
      "logs",
      "feature-flags",
      "telemetry",
      "tenant",
    ]);
  });

  it("marks Phase 1 bridges as available", () => {
    const available = listAvailableSuiteModules().map((m) => m.id);
    expect(available).toContain("assets");
    expect(available).toContain("consistency");
    expect(available).toContain("network");
    expect(available).toContain("storage");
    expect(available).not.toContain("doctor");
    expect(available).not.toContain("performance");
  });

  it("keeps Doctor / Performance / Export-related modules planned", () => {
    const planned = listPlannedSuiteModules().map((m) => m.id);
    expect(planned).toContain("doctor");
    expect(planned).toContain("performance");
    expect(planned).toContain("tenant");
    expect(planned).toContain("telemetry");
  });

  it("resolves modules by id", () => {
    expect(getSuiteModule("consistency")?.legacyTab).toBe("Consistency");
    expect(getSuiteModule("doctor")?.status).toBe("planned");
  });
});
