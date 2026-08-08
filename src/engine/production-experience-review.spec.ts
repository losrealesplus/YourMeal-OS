/**
 * PRODUCTION EXPERIENCE REVIEW 001 · docs only (no implementation).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("PRODUCTION EXPERIENCE REVIEW 001 · Readiness Review", () => {
  it("records READY WITH IMPROVEMENTS · Estimated ≠ Measured · Certification next", () => {
    const review = readFileSync(
      resolve(ROOT, "docs/tenant-success/PRODUCTION_EXPERIENCE_REVIEW.md"),
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

    expect(review).toContain("READY WITH IMPROVEMENTS");
    expect(review).toContain("No application code changes");
    expect(review).toContain("Estimated OTS");
    expect(review).toContain("Measured Time Saved");
    expect(review).toContain("40–155 minutes");
    expect(review).toContain("Required before Journey Certification");
    expect(review).toContain("*None.*");
    expect(review).toContain("Planning / Execution Boundary");
    expect(review).toContain("Kitchen Handoff");
    expect(review).not.toContain("Order Journey · CERTIFIED");

    expect(journeys).toContain("READY WITH IMPROVEMENTS");
    expect(journeys).toContain("Certification next");
    expect(journeys).toContain("PRODUCTION_EXPERIENCE_REVIEW");

    expect(lifecycle).toContain("Production Review ✅");
    expect(lifecycle).toContain("READY WITH IMPROVEMENTS");

    expect(cards).toContain("READY WITH IMPROVEMENTS");
    expect(cards).toContain("PRODUCTION_EXPERIENCE_REVIEW");
    expect(cards).toContain("Journey Certification          ← NEXT");

    expect(missions).toContain("PRODUCTION-EXPERIENCE-REVIEW");
    expect(missions).toContain("READY WITH IMPROVEMENTS");
    expect(missions).toContain("Journey Certification");
    expect(missions).toContain("PE006 Kitchen Handoff ✅");
  });
});
