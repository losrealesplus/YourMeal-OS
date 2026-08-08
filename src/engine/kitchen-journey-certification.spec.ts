/**
 * KITCHEN JOURNEY CERTIFICATION 001 · docs only (no implementation).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("KITCHEN JOURNEY CERTIFICATION 001", () => {
  it("records CERTIFIED · freezes Kitchen · Delivery eligible · Estimated ≠ Measured", () => {
    const cert = readFileSync(
      resolve(ROOT, "docs/tenant-success/KITCHEN_JOURNEY_CERTIFICATION.md"),
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
    expect(cert).toContain("20–75 min/day");
    expect(cert).toContain("ESTIMATED");
    expect(cert).toContain("No application code");
    expect(cert).toContain("Delivery Experience 001 is now **eligible**");
    expect(cert).toContain("Production → Handoff → Kitchen");
    expect(cert).toContain("Kitchen does not re-plan Production");
    expect(cert).toContain("Kitchen does not create Delivery commitments");
    expect(cert).toContain("CompleteExecutionUnit");
    expect(cert).toContain("Execution progress not yet available");
    expect(cert).toContain("Next: Delivery (Future)");
    expect(cert).toContain("not accepted");

    expect(journeys).toContain("Kitchen Journey");
    expect(journeys).toContain("✅ **Certified**");
    expect(journeys).toContain("KITCHEN_JOURNEY_CERTIFICATION");
    expect(journeys).toContain(
      "Kitchen Journey       ✅ Certified · Frozen",
    );
    expect(journeys).toMatch(
      /Delivery Journey\s+⏳ (NEXT \(eligible\)|DE001 Today's Delivery Day ▶|DE002 Delivery Search ▶|DE003 Delivery Adaptation ▶|DE004 Delivery Responsibility ▶|DE005 Route Preparation ▶)/,
    );
    expect(journeys).toContain(
      "Kitchen: 001–006 ✅ → Review ✅ → Certification ✅ CERTIFIED · Frozen",
    );

    expect(lifecycle).toContain("Kitchen Journey ✅ CERTIFIED");
    expect(lifecycle).toContain("Kitchen Frozen");

    expect(cards).toContain("Journey Certified · Frozen");
    expect(cards).toContain("CERTIFIED");
    expect(cards).toMatch(
      /Delivery Experience\s+(← NEXT \(eligible\)|▶ 001 Today's Delivery Day|▶ 002 Delivery Search|▶ 003 Delivery Adaptation|▶ 004 Delivery Responsibility|▶ 005 Route Preparation)/,
    );
    expect(cards).toContain("READY WITH IMPROVEMENTS");
    expect(cards).toContain(
      "¿El Journey Kitchen está certificado? | ✅ CERTIFIED · Frozen",
    );

    expect(missions).toContain("KITCHEN JOURNEY");
    expect(missions).toContain("CERTIFIED · FROZEN");
    expect(missions).toContain("KITCHEN-JOURNEY-CERTIFICATION");
    expect(missions).toMatch(
      /Delivery Experience\s+(⏳ NEXT \(eligible\)|▶ 001 Today's Delivery Day|▶ 002 Delivery Search|▶ 003 Delivery Adaptation|▶ 004 Delivery Responsibility|▶ 005 Route Preparation)/,
    );
    expect(missions).toContain("Journey Certification ✅ CERTIFIED → Freeze ✅");
  });

  it("certification matrix has zero FAIL and documents UNIMPLEMENTED gaps", () => {
    const cert = readFileSync(
      resolve(ROOT, "docs/tenant-success/KITCHEN_JOURNEY_CERTIFICATION.md"),
      "utf8",
    );
    expect(cert).toContain("| **Journey entry**");
    expect(cert).toContain("| **Today's Work**");
    expect(cert).toContain("| **Search**");
    expect(cert).toContain("| **Adaptation**");
    expect(cert).toContain("| **Labels**");
    expect(cert).toContain("| **Special Information**");
    expect(cert).toContain("| **Progress**");
    expect(cert).toContain("| **Completion**");
    expect(cert).toContain("| **Next Responsibility**");
    expect(cert).toContain("| **Boundary integrity**");
    expect(cert).toContain("| **Honesty of substrate**");
    expect(cert).toContain("| **Print / Export**");
    expect(cert).toContain("| **Operational continuity**");
    expect(cert).toContain("**Durable ExecutionUnit progress / Complete**");
    expect(cert).toContain("**Kitchen → Delivery handoff behaviour**");
    expect(cert).toContain("**Start / Pause / Resume / Block / Assign**");
    expect(cert).toContain("| **UNIMPLEMENTED** |");
    expect(cert).not.toMatch(/\| \*\*[^*]+\*\* \| \*\*FAIL\*\* \|/);
  });
});
