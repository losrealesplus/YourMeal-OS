/**
 * PRODUCTION EXPERIENCE 006 · Zero Friction Kitchen Handoff (Experience only).
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
  buildKitchenHandoff,
  confirmKitchenHandoff,
  kitchenHandoffToCsv,
  readinessLabel,
} from "@/production-experience/handoff-view";
import {
  clearProductionPlansForTests,
  getProductionPlan,
  saveProductionPlan,
} from "@/production-experience/production-plan";
import { clearResolvedRisksForTests } from "@/production-experience/alerts-view";

const ROOT = process.cwd();

describe("PRODUCTION EXPERIENCE 006 · Zero Friction Kitchen Handoff", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
    clearProductionPlansForTests();
    clearResolvedRisksForTests();
  });

  it("documents TPKH · boundary · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/PRODUCTION_EXPERIENCE_006.md"),
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
      resolve(ROOT, "src/production-experience/ProductionHandoffPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Kitchen Handoff");
    expect(doc).toContain(
      "Time-to-Prepare-Kitchen-Handoff (TPKH) < 5 minutes",
    );
    expect(doc).toContain("10–35 min");
    expect(doc).toContain("No Production Capability");
    expect(doc).toContain("No Kitchen Capability");
    expect(doc).toContain("does not create new planning");

    expect(cards).toContain("006 Kitchen Handoff");
    expect(cards).toContain("Zero Friction Kitchen Handoff");
    expect(cards).toContain("Time-to-Prepare-Kitchen-Handoff <5 min");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("PRODUCTION-EXPERIENCE-006");
    expect(missions).toContain("TPKH <5 min");
    expect(missions).toContain("PE006 Kitchen Handoff ▶");

    expect(ui).toContain("PRODUCTION EXPERIENCE 006");
    expect(ui).toContain("ProductionHandoffPanel");
    expect(ui).toContain('mode === "handoff"');
    expect(ui).toContain("TPKH < 5 min");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);
    expect(ui).not.toMatch(/ProductionFacade/);
    expect(ui).not.toMatch(/KitchenFacade/);

    expect(panel).toContain("Kitchen Handoff");
    expect(panel).toContain("Confirmar Handoff");
    expect(panel).toContain("Revisar Alertas");
    expect(panel).toContain("Revisar Preps");
    expect(panel).toContain("Imprimir / PDF");
    expect(panel).toContain("Open Kitchen Execution → Future");
    expect(panel).toContain(
      "No hay trabajo de producción revisado para handoff",
    );
  });

  it("builds executable handoff and confirms with explicit warning ack", () => {
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

    // Clear material warn/block noise for a clean ready path first
    let plan = saveProductionPlan({
      ...generated.plan,
      status: "reviewed",
      alerts: generated.plan.alerts.filter((a) => a.severity === "info"),
      preparations: generated.plan.preparations.map((p) => ({
        ...p,
        status: "ready" as const,
      })),
    });

    let view = buildKitchenHandoff(plan);
    expect(view.lines.length).toBeGreaterThan(0);
    expect(view.lines[0]!.dishLabel).toBe("Poke salmón");
    expect(view.lines[0]!.customerLabel).toBeNull();
    expect(view.lines[0]!.orderRef).toBeNull();
    expect(readinessLabel(view.readiness)).toMatch(/Ready/);

    const csv = kitchenHandoffToCsv(view);
    expect(csv).toContain("production_day");
    expect(csv).toContain("Poke salmón");

    const clean = confirmKitchenHandoff(week);
    expect(clean.ok).toBe(true);
    if (!clean.ok) return;
    expect(clean.plan.status).toBe("ready_for_kitchen");
    expect(clean.plan.work.every((w) => w.status === "handed_off")).toBe(true);

    // Reset with overdue prep → ready_with_warnings, requires ack
    plan = saveProductionPlan({
      ...getProductionPlan(week)!,
      status: "reviewed",
      work: getProductionPlan(week)!.work.map((w) => ({
        ...w,
        status: "planned" as const,
      })),
      preparations: getProductionPlan(week)!.preparations.map((p) => ({
        ...p,
        status: "scheduled" as const,
        preparationDate: "2026-07-01",
      })),
      alerts: [],
    });

    view = buildKitchenHandoff(plan, week);
    expect(view.readiness).toBe("ready_with_warnings");
    expect(
      view.warnings.some((w) => w.code === "overdue_preparation"),
    ).toBe(true);

    const refused = confirmKitchenHandoff(week);
    expect(refused.ok).toBe(false);

    const accepted = confirmKitchenHandoff(week, {
      acknowledgeWarnings: true,
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.plan.status).toBe("ready_for_kitchen");
  });
});
