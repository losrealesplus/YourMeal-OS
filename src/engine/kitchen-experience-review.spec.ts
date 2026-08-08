/**
 * KITCHEN EXPERIENCE REVIEW 001 · docs only (no implementation).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("KITCHEN EXPERIENCE REVIEW 001 · Readiness Review", () => {
  it("records READY WITH IMPROVEMENTS · Estimated ≠ Measured · Certification complete after Review", () => {
    const review = readFileSync(
      resolve(ROOT, "docs/tenant-success/KITCHEN_EXPERIENCE_REVIEW.md"),
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
    expect(review).toContain("20–75 minutes");
    expect(review).toContain("Required before Journey Certification");
    expect(review).toContain("*None.*");
    expect(review).toContain("Planning / Execution Boundary");
    expect(review).toContain("CompleteExecutionUnit");
    expect(review).toContain("Delivery");
    expect(review).toContain("Journey Certification");
    expect(review).toContain("KITCHEN_JOURNEY_CERTIFICATION");
    expect(review).toContain("CERTIFIED");
    expect(review).toContain("DELIVERY EXPERIENCE 001     ← eligible");

    expect(journeys).toContain("READY WITH IMPROVEMENTS");
    expect(journeys).toContain("KITCHEN_EXPERIENCE_REVIEW");
    expect(journeys).toContain("KITCHEN_JOURNEY_CERTIFICATION");
    expect(journeys).toContain(
      "Kitchen Journey       ✅ Certified · Frozen",
    );

    expect(lifecycle).toContain("Kitchen Review ✅");
    expect(lifecycle).toContain("READY WITH IMPROVEMENTS");
    expect(lifecycle).toContain("Kitchen Journey ✅ CERTIFIED");

    expect(cards).toContain("READY WITH IMPROVEMENTS");
    expect(cards).toContain("KITCHEN_EXPERIENCE_REVIEW");
    expect(cards).toContain("Journey Certification");
    expect(cards).toContain("Journey Certified · Frozen");
    expect(cards).toMatch(
      /Delivery Experience\s+(← NEXT \(eligible\)|▶ 001 Today's Delivery Day|▶ 002 Delivery Search|▶ 003 Delivery Adaptation)/,
    );

    expect(missions).toContain("KITCHEN-EXPERIENCE-REVIEW");
    expect(missions).toContain("READY WITH IMPROVEMENTS");
    expect(missions).toContain("KE006 Completion ✅");
    expect(missions).toContain("CERTIFIED · FROZEN");
  });
});
