/**
 * MENU EXPERIENCE 001 · Zero Friction Weekly Menu Planning (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearWeekPlansForTests,
  createEmptyWeek,
  duplicateWeekPlan,
  getWeekPlan,
  listWeekPlans,
  markPublished,
  mondayIso,
  nextWeekStart,
  upsertSlot,
} from "@/menu-experience/week-plan";

const ROOT = process.cwd();

describe("MENU EXPERIENCE 001 · Zero Friction Weekly Menu Planning", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
  });

  it("documents TTWM · weekly cycle · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/MENU_EXPERIENCE_001.md"),
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
    const lifecycle = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_LIFECYCLE.md"),
      "utf8",
    );
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.menu-planning.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      resolve(ROOT, "src/menu-experience/MenuPlanningPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Weekly Menu Planning");
    expect(doc).toContain("Time-to-Prepare Weekly Menu (TTWM) < 10 minutes");
    expect(doc).toContain("35–80 min");
    expect(doc).toContain("Reuse before creation");
    expect(doc).toContain("No Menu Capability / Facade / Engine");
    expect(doc).toContain("001 Weekly Planning");

    expect(cards).toContain("001 Weekly Planning");
    expect(cards).toContain("Zero Friction Weekly Menu Planning");
    expect(cards).toContain("Time-to-Prepare Weekly Menu <10 min");
    expect(cards).toContain("In Progress");
    expect(cards).toContain("Dish Library Integration");

    expect(missions).toContain("MENU-EXPERIENCE-001");
    expect(missions).toContain("MENU-EXPERIENCE-002");
    expect(missions).toContain("TTWM <10 min");
    expect(missions).toContain("ME001 Weekly Planning ✅");

    expect(lifecycle).toContain("ME001 Weekly Planning");
    expect(lifecycle).toContain("weekly planning cycle");

    expect(ui).toContain("MENU EXPERIENCE 001");
    expect(ui).toContain("MenuPlanningPanel");
    expect(ui).toContain("WeeklyMenuService");
    expect(ui).not.toMatch(/from ["']@\/modules\/orders/);

    expect(panel).toContain("Duplicar");
    expect(panel).toContain("Vista previa");
    expect(panel).toContain("Publicar");
    expect(panel).toContain("Import / Bulk → Reserved");
  });

  it("duplicates a week into the next without rebuilding from zero", () => {
    const sourceWeek = mondayIso(new Date("2026-08-03T12:00:00Z"));
    const targetWeek = nextWeekStart(sourceWeek);
    const source = createEmptyWeek(sourceWeek);
    upsertSlot(sourceWeek, {
      dayDate: sourceWeek,
      dishId: "dish-1",
      dishLabel: "Poke salmón",
      disabled: false,
    });
    const refreshed = getWeekPlan(sourceWeek)!;
    const dup = duplicateWeekPlan({
      source: refreshed,
      targetWeekStart: targetWeek,
    });
    expect(dup.weekStart).toBe(targetWeek);
    expect(dup.slots).toHaveLength(1);
    expect(dup.slots[0]?.dishLabel).toBe("Poke salmón");
    expect(dup.sourceWeekStart).toBe(sourceWeek);
    expect(listWeekPlans()).toHaveLength(2);
    markPublished(targetWeek, "published_session");
    expect(getWeekPlan(targetWeek)?.status).toBe("published_session");
    expect(source.id).toBeTruthy();
  });
});
