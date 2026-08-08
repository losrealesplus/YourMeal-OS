/**
 * MENU EXPERIENCE 003 · Zero Friction Weekly Adaptation (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearWeekPlansForTests,
  createEmptyWeek,
  duplicateSlot,
  getWeekPlan,
  mondayIso,
  moveSlot,
  replaceSlotDish,
  upsertSlot,
  weekDates,
} from "@/menu-experience/week-plan";

const ROOT = process.cwd();

describe("MENU EXPERIENCE 003 · Zero Friction Weekly Adaptation", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
  });

  it("documents TTAW · Adaptation focus · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/MENU_EXPERIENCE_003.md"),
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
    const accelerators = readFileSync(
      resolve(ROOT, "docs/00-status/OPERATIONAL_ACCELERATORS.md"),
      "utf8",
    );
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.menu-planning.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      resolve(ROOT, "src/menu-experience/MenuAdaptationPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Weekly Adaptation");
    expect(doc).toContain("Time-to-Adapt Weekly Menu (TTAW) < 5 minutes");
    expect(doc).toContain("10–35 min");
    expect(doc).toContain("Adapt    ✓");
    expect(doc).toContain("ACCELERATOR-006 · Planning Templates");
    expect(doc).toContain("No Menu Capability / Facade / Engine");

    expect(cards).toContain("003 Weekly Adaptation");
    expect(cards).toContain("Zero Friction Weekly Adaptation");
    expect(cards).toContain("Time-to-Adapt Weekly Menu <5 min");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("MENU-EXPERIENCE-003");
    expect(missions).toContain("MENU-EXPERIENCE-004");
    expect(missions).toContain("TTAW <5 min");
    expect(missions).toContain("ME003 Weekly Adaptation ✅");

    expect(accelerators).toContain("ACCELERATOR-006");
    expect(accelerators).toContain("Planning Templates");
    expect(accelerators).toContain("Candidate");

    expect(ui).toContain("003 Weekly Adaptation");
    expect(ui).toContain("MenuAdaptationPanel");
    expect(ui).toContain('mode === "adapt"');

    expect(panel).toContain("Adaptación semanal");
    expect(panel).toContain("Reemplazar");
    expect(panel).toContain("Mover");
    expect(panel).toContain("Copiar a día");
    expect(panel).toContain("Bulk Adaptation → Reserved");
  });

  it("replaces · moves · duplicates slots without rebuilding the week", () => {
    const week = mondayIso();
    createEmptyWeek(week);
    upsertSlot(week, {
      dayDate: week,
      dishId: "d1",
      dishLabel: "Poke salmón",
      disabled: false,
    });
    const plan = getWeekPlan(week)!;
    const slotId = plan.slots[0]!.id;
    replaceSlotDish(week, slotId, {
      dishId: "d2",
      dishLabel: "Bowl pollo",
    });
    expect(getWeekPlan(week)?.slots[0]?.dishLabel).toBe("Bowl pollo");

    const days = weekDates(week);
    const targetDay = days[2]!;
    moveSlot(week, slotId, targetDay);
    expect(getWeekPlan(week)?.slots[0]?.dayDate).toBe(targetDay);

    duplicateSlot(week, slotId, days[3]!);
    expect(getWeekPlan(week)?.slots).toHaveLength(2);
  });
});
