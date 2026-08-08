/**
 * PRODUCTION EXPERIENCE 004 · Zero Friction Production Pre-Preparations (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearWeekPlansForTests,
  createEmptyWeek,
  markPublished,
  mondayIso,
  upsertSlot,
  getWeekPlan,
} from "@/menu-experience/week-plan";
import { generateProductionPlanFromWeek } from "@/production-experience/generate-from-week";
import {
  buildPrepViews,
  deriveEffectivePrepStatus,
  markPrepReady,
  prepListToCsv,
} from "@/production-experience/prep-view";
import {
  clearProductionPlansForTests,
  getProductionPlan,
} from "@/production-experience/production-plan";

const ROOT = process.cwd();

describe("PRODUCTION EXPERIENCE 004 · Zero Friction Production Pre-Preparations", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
    clearProductionPlansForTests();
  });

  it("documents TIRP · prep bridge · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/PRODUCTION_EXPERIENCE_004.md"),
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
      resolve(ROOT, "src/production-experience/ProductionPrepsPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Production Pre-Preparations");
    expect(doc).toContain(
      "Time-to-Identify-Required-Preps (TIRP) < 15 seconds",
    );
    expect(doc).toContain("30–105 s");
    expect(doc).toContain("No Production Capability");
    expect(doc).toContain("Preps ≠ Kitchen");

    expect(cards).toContain("004 Pre-Preparations");
    expect(cards).toContain("Zero Friction Production Pre-Preparations");
    expect(cards).toContain("Time-to-Identify-Required-Preps <15 s");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("PRODUCTION-EXPERIENCE-004");
    expect(missions).toContain("PRODUCTION-EXPERIENCE-005");
    expect(missions).toContain("TIRP <15s");
    expect(missions).toContain("PE004 Pre-Preparations ✅");

    expect(ui).toContain("PRODUCTION EXPERIENCE 004");
    expect(ui).toContain("ProductionPrepsPanel");
    expect(ui).toContain('mode === "preps"');
    expect(ui).toContain("TIRP < 15 s");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);
    expect(ui).not.toMatch(/ProductionFacade/);

    expect(panel).toContain("Pre-preparaciones");
    expect(panel).toContain("Marcar lista");
    expect(panel).toContain("Reprogramar");
    expect(panel).toContain("Imprimir lista prep");
    expect(panel).toContain("Bulk mark ready → Future");
  });

  it("exposes prep views with deadlines and mark-ready", () => {
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

    expect(generated.plan.preparations.length).toBeGreaterThan(0);
    const defrost = generated.plan.preparations.find((p) => p.kind === "defrost");
    expect(defrost).toBeTruthy();
    expect(defrost?.requiredQuantity).toBe(1);

    const views = buildPrepViews(generated.plan);
    expect(views[0]).toBeTruthy();
    expect(views.some((v) => v.prep.kind === "defrost")).toBe(true);

    const prepId = generated.plan.preparations[0]!.id;
    markPrepReady(week, prepId);
    const refreshed = getProductionPlan(week)!;
    const marked = refreshed.preparations.find((p) => p.id === prepId)!;
    expect(deriveEffectivePrepStatus(marked)).toBe("ready");

    const csv = prepListToCsv(refreshed);
    expect(csv).toContain("prep_name");
    expect(csv).toContain("Poke salmón");
  });
});
