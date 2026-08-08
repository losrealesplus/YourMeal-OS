/**
 * PRODUCTION JOURNEY CERTIFICATION 001 · docs only (no implementation).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("PRODUCTION JOURNEY CERTIFICATION 001", () => {
  it("records CERTIFIED · freezes Production · Kitchen eligible · Estimated ≠ Measured", () => {
    const cert = readFileSync(
      resolve(
        ROOT,
        "docs/tenant-success/PRODUCTION_JOURNEY_CERTIFICATION.md",
      ),
      "utf8",
    );
    const journeys = readFileSync(
      resolve(ROOT, "docs/00-status/JOURNEY_CERTIFICATION.md"),
      "utf8",
    );
    const lifecycle = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_LIFECYCLE.md"),
      "utf8",
    );
    const cards = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_CARDS.md"),
      "utf8",
    );
    const missions = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_MISSIONS.md"),
      "utf8",
    );

    expect(cert).toContain("CERTIFIED");
    expect(cert).not.toContain("NOT CERTIFIED");
    expect(cert).toContain("FAIL count:** **0**");
    expect(cert).toContain("Required before certification: **NONE**");
    expect(cert).toContain("Estimated OTS");
    expect(cert).toContain("Measured Time Saved");
    expect(cert).toContain("40–155 min/week");
    expect(cert).toContain("No application code");
    expect(cert).toContain("Kitchen Experience 001 is now **eligible**");
    expect(cert).toContain("Production does not execute Kitchen work");

    expect(journeys).toContain("Production Journey");
    expect(journeys).toContain("✅ **Certified**");
    expect(journeys).toContain("PRODUCTION_JOURNEY_CERTIFICATION");
    expect(journeys).toContain("Kitchen Journey       ⏳ eligible");

    expect(lifecycle).toContain("Production Journey ✅ CERTIFIED");
    expect(lifecycle).toContain("Production Frozen");

    expect(cards).toContain("Journey Certified · Frozen");
    expect(cards).toContain("CERTIFIED");
    expect(cards).toContain("Kitchen Experience             ← NEXT (eligible)");
    expect(cards).toContain("READY WITH IMPROVEMENTS");

    expect(missions).toContain("PRODUCTION JOURNEY CERTIFIED");
    expect(missions).toContain("KITCHEN EXPERIENCE 001");
    expect(missions).toContain("PRODUCTION-JOURNEY-CERTIFICATION");
    expect(missions).toContain("Journey Certified");
  });
});
