/**
 * PRODUCTION EXPERIENCE 001 · Zero Friction Production Planning (Experience only).
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
  clearProductionPlansForTests,
  confirmProductionPlan,
  getProductionPlan,
  totalQuantity,
} from "@/production-experience/production-plan";
import { productionPlanToCsv } from "@/production-experience/export-production-plan";

const ROOT = process.cwd();

describe("PRODUCTION EXPERIENCE 001 · Zero Friction Production Planning", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
    clearProductionPlansForTests();
  });

  it("documents TPP · published-week source · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/PRODUCTION_EXPERIENCE_001.md"),
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
      resolve(ROOT, "src/production-experience/ProductionPlanningPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Production Planning");
    expect(doc).toContain(
      "Time-to-Prepare-Production-Plan (TPP) < 10 minutes",
    );
    expect(doc).toContain("15–50 min");
    expect(doc).toContain("No Production Capability");
    expect(doc).toContain("Ready for Kitchen");
    expect(doc).toContain("Semana → Día → Trabajo → Cantidad → Deadline → Kitchen");

    expect(cards).toContain("001 Production Planning");
    expect(cards).toContain("Zero Friction Production Planning");
    expect(cards).toContain("Time-to-Prepare-Production-Plan <10 min");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("PRODUCTION-EXPERIENCE-001");
    expect(missions).toContain("TPP <10 min");
    expect(missions).toContain("PE001 Production Planning ✅");
    expect(missions).toContain("PRODUCTION-EXPERIENCE-005");

    expect(ui).toContain("PRODUCTION EXPERIENCE 001");
    expect(ui).toContain("ProductionPlanningPanel");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);
    expect(ui).not.toMatch(/ProductionFacade/);

    expect(panel).toContain("Generar plan");
    expect(panel).toContain("Regenerar plan");
    expect(panel).toContain("Ready for Kitchen");
    expect(panel).toContain("Abrir Menu Planning");
    expect(panel).toContain("Exportar Excel (CSV)");
    expect(panel).toContain("OCC / Bulk / Import → Reserved");
  });

  it("generates work from a published week and refuses unpublished sources", () => {
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
    const draft = getWeekPlan(week)!;
    const refused = generateProductionPlanFromWeek(draft);
    expect(refused.ok).toBe(false);

    markPublished(week, "published_session");
    const published = getWeekPlan(week)!;
    const generated = generateProductionPlanFromWeek(published);
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;

    expect(generated.plan.work.length).toBeGreaterThan(0);
    expect(totalQuantity(generated.plan)).toBeGreaterThan(0);
    expect(generated.plan.preparations.length).toBeGreaterThan(0);
    expect(
      generated.plan.alerts.some((a) => a.code === "defrost_requirement"),
    ).toBe(true);
    expect(
      generated.plan.alerts.some((a) => a.code === "quantity_estimated"),
    ).toBe(true);

    const csv = productionPlanToCsv(generated.plan);
    expect(csv).toContain("production_day");
    expect(csv).toContain("Poke salmón");

    confirmProductionPlan(week);
    expect(getProductionPlan(week)?.status).toBe("ready_for_kitchen");
  });
});
