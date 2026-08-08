/**
 * PRODUCTION EXPERIENCE 005 · Zero Friction Production Alerts & Deadlines (Experience only).
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
  activeProductionRisks,
  buildProductionRisks,
  clearResolvedRisksForTests,
  resolveRisk,
  riskCodeLabel,
} from "@/production-experience/alerts-view";
import {
  clearProductionPlansForTests,
  saveProductionPlan,
} from "@/production-experience/production-plan";

const ROOT = process.cwd();

describe("PRODUCTION EXPERIENCE 005 · Zero Friction Production Alerts & Deadlines", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
    clearProductionPlansForTests();
    clearResolvedRisksForTests();
  });

  it("documents TTPR · early risk · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/PRODUCTION_EXPERIENCE_005.md"),
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
      resolve(ROOT, "src/production-experience/ProductionAlertsPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Production Alerts & Deadlines");
    expect(doc).toContain(
      "Time-to-Detect-Production-Risk (TTPR) < 10 seconds",
    );
    expect(doc).toContain("50–170 s");
    expect(doc).toContain("No Production Capability");
    expect(doc).toContain("Do not over-alert");

    expect(cards).toContain("005 Alerts & Deadlines");
    expect(cards).toContain("Zero Friction Production Alerts & Deadlines");
    expect(cards).toContain("Time-to-Detect-Production-Risk <10 s");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("PRODUCTION-EXPERIENCE-005");
    expect(missions).toContain("PRODUCTION-EXPERIENCE-006");
    expect(missions).toContain("TTPR <10s");
    expect(missions).toContain("PE005 Alerts ✅");

    expect(ui).toContain("PRODUCTION EXPERIENCE 005");
    expect(ui).toContain("ProductionAlertsPanel");
    expect(ui).toContain('mode === "alerts"');
    expect(ui).toContain("TTPR < 10 s");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);
    expect(ui).not.toMatch(/ProductionFacade/);

    expect(panel).toContain("Alertas y deadlines");
    expect(panel).toContain("No hay alertas activas");
    expect(panel).toContain("Resolver");
    expect(panel).toContain("Reprogramar / adaptar");
    expect(panel).toContain("Notify Kitchen → Future");
  });

  it("surfaces overdue prep and capacity risks with next steps", () => {
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

    const today = week;
    let plan = generated.plan;
    const prep = plan.preparations[0];
    expect(prep).toBeTruthy();
    if (!prep) return;

    plan = saveProductionPlan({
      ...plan,
      status: "draft",
      preparations: plan.preparations.map((p) =>
        p.id === prep.id
          ? {
              ...p,
              preparationDate: "2026-07-01",
              status: "scheduled" as const,
            }
          : p,
      ),
      alerts: [
        ...plan.alerts,
        {
          code: "capacity_warning",
          severity: "warn",
          message: "Día sobrecargado",
          dayDate: week,
          fixHint: "Reequilibra carga",
        },
      ],
      dayLoads: plan.dayLoads.map((d) =>
        d.dayDate === week ? { ...d, overload: true, totalQuantity: 120 } : d,
      ),
    });

    const risks = buildProductionRisks(plan, today);
    expect(risks.some((r) => r.code === "overdue_preparation")).toBe(true);
    expect(risks.some((r) => r.code === "capacity_warning")).toBe(true);
    expect(riskCodeLabel("overdue_preparation")).toBe("Prep vencida");

    const overdue = risks.find((r) => r.code === "overdue_preparation")!;
    expect(overdue.nextAction).toBe("preps");
    expect(overdue.nextStep.length).toBeGreaterThan(0);
    expect(overdue.urgency).toBe("now");

    resolveRisk(week, overdue.id);
    const active = activeProductionRisks(plan, today);
    expect(active.some((r) => r.id === overdue.id)).toBe(false);
  });
});
