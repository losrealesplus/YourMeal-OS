/**
 * PRODUCTION EXPERIENCE 003 · Zero Friction Production Adaptation (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearWeekPlansForTests,
  createEmptyWeek,
  markPublished,
  mondayIso,
  addDaysIso,
  upsertSlot,
  getWeekPlan,
} from "@/menu-experience/week-plan";
import {
  moveWorkToDay,
  previewMoveWork,
  resizeWorkQuantity,
} from "@/production-experience/adapt-production-plan";
import { generateProductionPlanFromWeek } from "@/production-experience/generate-from-week";
import {
  clearProductionPlansForTests,
  getProductionPlan,
} from "@/production-experience/production-plan";

const ROOT = process.cwd();

describe("PRODUCTION EXPERIENCE 003 · Zero Friction Production Adaptation", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
    clearProductionPlansForTests();
  });

  it("documents TAPP · living plan · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/PRODUCTION_EXPERIENCE_003.md"),
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
      resolve(ROOT, "src/routes/_authenticated/admin.production-planning.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      resolve(ROOT, "src/production-experience/ProductionAdaptationPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Production Adaptation");
    expect(doc).toContain(
      "Time-to-Adapt-Production-Plan (TAPP) < 5 minutes",
    );
    expect(doc).toContain("5–20 min");
    expect(doc).toContain("No Production Capability");
    expect(doc).toContain("Preview before confirm");

    expect(cards).toContain("003 Production Adaptation");
    expect(cards).toContain("Zero Friction Production Adaptation");
    expect(cards).toContain("Time-to-Adapt-Production-Plan <5 min");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("PRODUCTION-EXPERIENCE-003");
    expect(missions).toContain("TAPP <5 min");
    expect(missions).toContain("PE003 Adaptation ✅");
    expect(missions).toContain("PRODUCTION-EXPERIENCE-006");

    expect(ui).toContain("PRODUCTION EXPERIENCE 003");
    expect(ui).toContain("ProductionAdaptationPanel");
    expect(ui).toContain('mode === "adapt"');
    expect(ui).toContain("TAPP < 5 min");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);
    expect(ui).not.toMatch(/ProductionFacade/);

    expect(panel).toContain("Adaptación de producción");
    expect(panel).toContain("Preview impact");
    expect(panel).toContain("Confirmar mover");
    expect(panel).toContain("Bulk adaptation → Future");
  });

  it("moves and resizes work without regenerating the plan", () => {
    const week = mondayIso(new Date("2026-08-03T12:00:00Z"));
    createEmptyWeek(week);
    upsertSlot(week, {
      dayDate: week,
      dishId: "dish-1",
      dishLabel: "Poke salmón",
      disabled: false,
      macrosHint: "P30",
      allergenHint: "pescado",
    });
    markPublished(week, "published_session");
    const generated = generateProductionPlanFromWeek(getWeekPlan(week)!);
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;

    const workId = generated.plan.work[0]!.id;
    const toDay = addDaysIso(week, 2);
    const impact = previewMoveWork(generated.plan, workId, toDay);
    expect(impact?.kind).toBe("move_day");
    expect(impact?.kitchenImpact).toContain(toDay);

    const moved = moveWorkToDay(week, workId, toDay);
    expect(moved?.plan.work[0]?.productionDay).toBe(toDay);
    expect(moved?.plan.status).not.toBe("ready_for_kitchen");

    const resized = resizeWorkQuantity(week, workId, 5);
    expect(resized?.plan.work.find((w) => w.id === workId)?.quantity).toBe(5);
    expect(getProductionPlan(week)?.work.find((w) => w.id === workId)?.quantity).toBe(
      5,
    );
  });
});
