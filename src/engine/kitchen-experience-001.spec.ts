/**
 * KITCHEN EXPERIENCE 001 · Zero Friction Kitchen Execution (Experience only).
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
import { confirmKitchenHandoff } from "@/production-experience/handoff-view";
import {
  clearProductionPlansForTests,
  getProductionPlan,
  saveProductionPlan,
} from "@/production-experience/production-plan";
import {
  buildTodaysKitchenWork,
  clearKitchenWorkStatusForTests,
  setKitchenWorkStatus,
} from "@/kitchen-experience/today-work";
import { kitchenWorkToCsv } from "@/kitchen-experience/export-kitchen-work";

const ROOT = process.cwd();

describe("KITCHEN EXPERIENCE 001 · Zero Friction Kitchen Execution", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
    clearProductionPlansForTests();
    clearKitchenWorkStatusForTests();
  });

  it("documents TTUKW · handoff receive · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/KITCHEN_EXPERIENCE_001.md"),
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
      resolve(ROOT, "src/routes/_authenticated/admin.kitchen-today.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      resolve(ROOT, "src/kitchen-experience/KitchenTodayPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Kitchen Execution");
    expect(doc).toContain(
      "Time-to-Understand-Kitchen-Work (TTUKW) < 10 seconds",
    );
    expect(doc).toContain("50–170 s");
    expect(doc).toContain("No Kitchen Capability");
    expect(doc).toContain("does not invent");
    expect(doc).toContain("Start / Pause / Resume / Block / Assign");

    expect(cards).toContain("001 Today's Work");
    expect(cards).toContain("Zero Friction Kitchen Execution");
    expect(cards).toContain("Time-to-Understand-Kitchen-Work <10 s");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("KITCHEN-EXPERIENCE-001");
    expect(missions).toContain("TTUKW <10s");
    expect(missions).toContain("KE001 Today's Work ▶");

    expect(ui).toContain("KITCHEN EXPERIENCE 001");
    expect(ui).toContain("KitchenTodayPanel");
    expect(ui).toContain("TTUKW < 10 s");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);
    expect(ui).not.toMatch(/KitchenExecutionFacade/);
    expect(ui).not.toMatch(/ProductionFacade/);

    expect(panel).toContain("Trabajo de hoy");
    expect(panel).toContain("No hay trabajo listo para ejecutar");
    expect(panel).toContain("Revisar Production Handoff");
    expect(panel).toContain("Start / Pause / Assign → Future");
    expect(panel).toContain("no disponible en este substrate");
  });

  it("builds today's queue from ready handoff without inventing customer data", () => {
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

    saveProductionPlan({
      ...generated.plan,
      status: "reviewed",
      alerts: generated.plan.alerts.filter((a) => a.severity === "info"),
      preparations: generated.plan.preparations.map((p) => ({
        ...p,
        status: "ready" as const,
      })),
    });

    const empty = buildTodaysKitchenWork(week);
    expect(empty.cards.length).toBe(0);
    expect(empty.emptyReason).toBeTruthy();

    const confirmed = confirmKitchenHandoff(week, {
      acknowledgeWarnings: true,
    });
    expect(confirmed.ok).toBe(true);

    const today = buildTodaysKitchenWork(week);
    expect(today.cards.length).toBeGreaterThan(0);
    const card = today.cards[0]!;
    expect(card.dishLabel).toBe("Poke salmón");
    expect(card.customerLabel).toBeNull();
    expect(card.orderRef).toBeNull();
    expect(card.specialInstruction).toBeNull();
    expect(card.allergenHint).toBe("pescado");

    setKitchenWorkStatus(card.id, "in_progress");
    const refreshed = buildTodaysKitchenWork(week);
    expect(refreshed.cards.find((c) => c.id === card.id)?.status).toBe(
      "in_progress",
    );

    const csv = kitchenWorkToCsv(refreshed);
    expect(csv).toContain("dish");
    expect(csv).toContain("Poke salmón");
    expect(getProductionPlan(week)?.status).toBe("ready_for_kitchen");
  });
});
