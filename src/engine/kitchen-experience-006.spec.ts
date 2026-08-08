/**
 * KITCHEN EXPERIENCE 006 · Zero Friction Kitchen Completion & Handoff.
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
  saveProductionPlan,
} from "@/production-experience/production-plan";
import { clearExecutionAdaptationsForTests } from "@/kitchen-experience/adapt-execution";
import {
  buildKitchenCompletion,
  filterCompletionCards,
} from "@/kitchen-experience/completion-view";
import { completionToCsv } from "@/kitchen-experience/export-completion";
import {
  clearKitchenWorkStatusForTests,
  setKitchenWorkStatus,
} from "@/kitchen-experience/today-work";

const ROOT = process.cwd();

function seedHandedOffWeek() {
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
  upsertSlot(week, {
    dayDate: week,
    dishId: "dish-2",
    dishLabel: "Bowl pollo",
    disabled: false,
    macrosHint: "P35",
    allergenHint: null,
  });
  markPublished(week, "published_session");
  const generated = generateProductionPlanFromWeek(getWeekPlan(week)!);
  expect(generated.ok).toBe(true);
  if (!generated.ok) return week;
  saveProductionPlan({
    ...generated.plan,
    status: "reviewed",
    alerts: generated.plan.alerts.filter((a) => a.severity === "info"),
    preparations: generated.plan.preparations.map((p) => ({
      ...p,
      status: "ready" as const,
    })),
  });
  expect(confirmKitchenHandoff(week, { acknowledgeWarnings: true }).ok).toBe(
    true,
  );
  return week;
}

describe("KITCHEN EXPERIENCE 006 · Completion & Handoff", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
    clearProductionPlansForTests();
    clearKitchenWorkStatusForTests();
    clearExecutionAdaptationsForTests();
  });

  it("documents TTUC · session vs durable · no Delivery · Experience-only", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/KITCHEN_EXPERIENCE_006.md"),
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
      resolve(ROOT, "src/kitchen-experience/KitchenCompletionPanel.tsx"),
      "utf8",
    );
    const model = readFileSync(
      resolve(ROOT, "src/kitchen-experience/completion-view.ts"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Kitchen Completion & Handoff");
    expect(doc).toContain(
      "Time-to-Understand-Completion (TTUC) < 5 seconds",
    );
    expect(doc).toContain("Time-to-Prepare-Next-Step < 10 seconds");
    expect(doc).toContain("45–270 s");
    expect(doc).toContain("CompleteExecutionUnit");
    expect(doc).toContain("Delivery");
    expect(doc).toContain("No Kitchen / Production / Order / Delivery Capability");

    expect(cards).toContain("006 Completion");
    expect(cards).toContain("Zero Friction Kitchen Completion & Handoff");
    expect(cards).toContain("Time-to-Understand-Completion <5 s");
    expect(cards).toContain("READY WITH IMPROVEMENTS");

    expect(missions).toContain("KITCHEN-EXPERIENCE-006");
    expect(missions).toContain("KE006 Completion ✅");
    expect(doc).toContain("COMPLETE");
    expect(missions).toContain("KITCHEN-EXPERIENCE-REVIEW");

    expect(ui).toContain("KITCHEN EXPERIENCE 006");
    expect(ui).toContain("KitchenCompletionPanel");
    expect(ui).toContain('mode === "completion"');
    expect(ui).toContain("TTUC < 5 s");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);
    expect(ui).not.toMatch(/KitchenExecutionFacade/);
    expect(ui).not.toMatch(/DeliveryFacade/);
    expect(ui).not.toMatch(/CompleteExecutionUnit/);

    expect(panel).toContain("Cierre y siguiente paso");
    expect(panel).toContain("Session completion");
    expect(panel).toContain("Complete durable / Delivery → Future");
    expect(panel).toContain("Delivery no ha aceptado");
    expect(panel).toContain("Volver a Today's Work");

    expect(model).toContain("session_complete");
    expect(model).toContain("durableCompletionAvailable: false");
    expect(model).toContain("future_delivery");
    expect(model).not.toMatch(/saveProductionPlan/);
  });

  it("keeps durable completion unavailable and labels session close without Delivery acceptance", () => {
    const week = seedHandedOffWeek();
    const open = buildKitchenCompletion(week);
    expect(open.total).toBeGreaterThanOrEqual(2);
    expect(open.durableCompletionAvailable).toBe(false);
    expect(open.readiness).toBe("durable_unavailable");
    expect(open.readinessLabel).toContain("unavailable");
    expect(
      open.cards.some(
        (c) => c.completionStatus === "Completion state unavailable",
      ),
    ).toBe(true);

    for (const c of open.cards) {
      setKitchenWorkStatus(c.line.card.id, "completed");
    }
    const closed = buildKitchenCompletion(week);
    expect(closed.readiness).toBe("session_complete");
    expect(closed.readinessLabel).toContain("sesión");
    expect(closed.nextResponsibility).toContain("Delivery");
    expect(closed.nextResponsibility).toContain("has not accepted");
    expect(closed.completedSession).toBe(closed.total);
    expect(closed.remaining).toBe(0);

    const csv = completionToCsv(closed);
    expect(csv).toContain("Session completion");
    expect(csv).toContain("durable_completion,unavailable");

    const remaining = filterCompletionCards(closed.cards, "remaining");
    expect(remaining.length).toBe(0);
  });
});
