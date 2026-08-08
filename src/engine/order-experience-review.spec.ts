/**
 * ORDER EXPERIENCE REVIEW 001 · docs only (no implementation).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("ORDER EXPERIENCE REVIEW 001 · Journey Certification · Freeze", () => {
  it("records READY WITH IMPROVEMENTS · certifies Order Journey · freezes Orders", () => {
    const review = readFileSync(
      resolve(ROOT, "docs/00-status/ORDER_EXPERIENCE_REVIEW.md"),
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
    expect(review).toContain("READY FOR FREEZE");
    expect(review).toContain("No application code changes");
    expect(review).toContain("15–40 minutes");
    expect(review).toContain("Order Journey · CERTIFIED");

    expect(journeys).toContain("We do not certify screens.");
    expect(journeys).toContain("Order Journey");
    expect(journeys).toContain("Customer Journey");
    expect(journeys).toContain("✅ **Certified**");

    expect(lifecycle).toContain("Journey Certification");
    expect(lifecycle).toContain("Order Journey ✅");

    expect(cards).toContain("READY WITH IMPROVEMENTS");
    expect(cards).toContain("Journey Certified");
    expect(cards).toContain("Menu Experience");

    expect(missions).toContain("MENU EXPERIENCE");
    expect(missions).toContain("Journey Certified");
    expect(missions).toContain("ORDER_EXPERIENCE_REVIEW");
  });
});
