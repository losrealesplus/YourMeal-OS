/**
 * MENU EXPERIENCE 005 · Zero Friction Publish & Preview (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  assessWeekReadiness,
  prioritizeIssues,
} from "@/menu-experience/week-readiness";
import {
  clearWeekPlansForTests,
  createEmptyWeek,
  mondayIso,
  upsertSlot,
  getWeekPlan,
  markPreview,
} from "@/menu-experience/week-plan";

const ROOT = process.cwd();

describe("MENU EXPERIENCE 005 · Zero Friction Publish & Preview", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
  });

  it("documents TTRP · readiness · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/MENU_EXPERIENCE_005.md"),
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
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.menu-planning.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      resolve(ROOT, "src/menu-experience/MenuPublishPreviewPanel.tsx"),
      "utf8",
    );
    const readiness = readFileSync(
      resolve(ROOT, "src/menu-experience/week-readiness.ts"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Publish & Preview");
    expect(doc).toContain(
      "Time-to-Review-and-Publish-Weekly-Menu (TTRP) < 5 minutes",
    );
    expect(doc).toContain("10–35 min");
    expect(doc).toContain("Ready for Orders and Production");
    expect(doc).toContain("No Menu Capability");

    expect(cards).toContain("005 Publish & Preview");
    expect(cards).toContain("Zero Friction Publish & Preview");
    expect(cards).toContain(
      "Time-to-Review-and-Publish-Weekly-Menu <5 min",
    );
    expect(cards).toContain("In Progress");

    expect(missions).toContain("MENU-EXPERIENCE-005");
    expect(missions).toContain("TTRP <5 min");
    expect(missions).toContain("ME005 Publish & Preview ✅");
    expect(missions).toContain("PRODUCTION-EXPERIENCE-001");

    expect(ui).toContain("MENU EXPERIENCE 005");
    expect(ui).toContain('mode === "publish"');
    expect(ui).toContain("TTRP < 5 min");

    expect(panel).toContain("Publicar y previsualizar");
    expect(panel).toContain("Listo para Orders");
    expect(panel).toContain("Listo para Production");
    expect(panel).toContain("Programar publicación → Future");

    expect(readiness).toContain("assessWeekReadiness");
    expect(readiness).toContain("Do not block without reason");
  });

  it("warns on gaps and blocks only empty weeks", () => {
    const week = mondayIso(new Date("2026-08-03T12:00:00Z"));
    createEmptyWeek(week);
    const empty = assessWeekReadiness(getWeekPlan(week)!);
    expect(empty.canPublish).toBe(false);
    expect(empty.issues.some((i) => i.code === "empty_week")).toBe(true);

    upsertSlot(week, {
      dayDate: week,
      dishId: "dish-1",
      dishLabel: "Poke salmón",
      disabled: false,
      macrosHint: "P30",
      allergenHint: "pescado",
    });
    markPreview(week);
    const ready = assessWeekReadiness(getWeekPlan(week)!);
    expect(ready.canPublish).toBe(true);
    expect(ready.daysCovered).toBe(1);
    expect(ready.issues.some((i) => i.code === "missing_day")).toBe(true);
    expect(ready.issues.some((i) => i.code === "thin_coverage")).toBe(true);
    expect(ready.readyForOrders).toBe(false);

    upsertSlot(week, {
      dayDate: week,
      dishId: "dish-2",
      dishLabel: "Bowl incompleto",
      disabled: false,
    });
    const withGaps = assessWeekReadiness(getWeekPlan(week)!);
    expect(withGaps.macroGaps).toBeGreaterThan(0);
    expect(withGaps.allergenGaps).toBeGreaterThan(0);
    expect(withGaps.canPublish).toBe(true);
    const top = prioritizeIssues(withGaps.issues, 5);
    expect(top[0]?.severity).not.toBe("info");
  });
});
