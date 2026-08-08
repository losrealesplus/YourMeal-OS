/**
 * KITCHEN EXPERIENCE 003 · Zero Friction Kitchen Execution Adaptation (Experience only).
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
  clearExecutionAdaptationsForTests,
  confirmExecutionAdaptation,
  effectiveExecutionQuantity,
  listAdaptedExecutionCards,
  previewExecutionAdaptation,
} from "@/kitchen-experience/adapt-execution";
import { clearKitchenWorkStatusForTests } from "@/kitchen-experience/today-work";

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

describe("KITCHEN EXPERIENCE 003 · Zero Friction Kitchen Execution Adaptation", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
    clearProductionPlansForTests();
    clearKitchenWorkStatusForTests();
    clearExecutionAdaptationsForTests();
  });

  it("documents TTAE · local execution only · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/KITCHEN_EXPERIENCE_003.md"),
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
      resolve(ROOT, "src/kitchen-experience/KitchenAdaptationPanel.tsx"),
      "utf8",
    );
    const adapt = readFileSync(
      resolve(ROOT, "src/kitchen-experience/adapt-execution.ts"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Kitchen Execution Adaptation");
    expect(doc).toContain("Time-to-Adapt-Execution (TTAE) < 30 seconds");
    expect(doc).toContain("Time-to-Resume-Execution < 5 seconds");
    expect(doc).toContain("90–420 s");
    expect(doc).toContain("No Kitchen / Production / Order Capability");
    expect(doc).toContain("does not re-plan");
    expect(doc).toContain("substrate gap");

    expect(cards).toContain("003 Execution Adaptation");
    expect(cards).toContain("Zero Friction Kitchen Execution Adaptation");
    expect(cards).toContain("Time-to-Adapt-Execution <30 s");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("KITCHEN-EXPERIENCE-003");
    expect(missions).toContain("KE003 Adaptation ▶");
    expect(missions).toContain("TTAE");

    expect(ui).toContain("KITCHEN EXPERIENCE 003");
    expect(ui).toContain("KitchenAdaptationPanel");
    expect(ui).toContain('mode === "adapt"');
    expect(ui).toContain("TTAE < 30 s");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);
    expect(ui).not.toMatch(/KitchenExecutionFacade/);
    expect(ui).not.toMatch(/ProductionFacade/);
    expect(ui).not.toMatch(/OrderFacade/);

    expect(panel).toContain("Adaptación de ejecución");
    expect(panel).toContain("Revisar impacto");
    expect(panel).toContain("Plan de Production modificado");
    expect(panel).toContain("Block / Assign / Notify → Future");
    expect(panel).toContain("Volver a Today's Work");

    expect(adapt).toContain("ymos.ke.exec_adapt.v1");
    expect(adapt).toContain("productionPlanUnchanged");
    expect(adapt).toContain("substrateGap");
    expect(adapt).not.toMatch(/saveProductionPlan/);
  });

  it("adapts execution quantity in session without mutating Production plan", () => {
    const week = seedHandedOffWeek();
    const cards = listAdaptedExecutionCards(week, week);
    expect(cards.length).toBeGreaterThan(0);
    const card = cards[0]!;
    const productionQty = card.quantity;

    const preview = previewExecutionAdaptation(card, {
      kind: "quantity",
      workId: card.id,
      executionQuantity: productionQty + 2,
    });
    expect(preview).toBeTruthy();
    expect(preview!.productionPlanUnchanged).toBe(true);
    expect(preview!.persistence).toBe("session");
    expect(preview!.escalationRequired).toBe(false);
    expect(preview!.substrateGap).toBeTruthy();

    const confirmed = confirmExecutionAdaptation(card, {
      kind: "quantity",
      workId: card.id,
      executionQuantity: productionQty + 2,
    });
    expect(confirmed?.affectsExecutionItem).toBe(true);

    const adapted = listAdaptedExecutionCards(week, week).find(
      (c) => c.id === card.id,
    )!;
    expect(adapted.quantity).toBe(productionQty);
    expect(effectiveExecutionQuantity(adapted)).toBe(productionQty + 2);
    expect(adapted.executionAdapted).toBe(true);

    const plan = getProductionPlan(week)!;
    const planItem = plan.work.find((w) => w.id === card.id);
    expect(planItem?.quantity ?? productionQty).toBe(productionQty);
    expect(plan.status).toBe("ready_for_kitchen");
  });

  it("escalates Production-facing requests without writing overlay", () => {
    const week = seedHandedOffWeek();
    const card = listAdaptedExecutionCards(week, week)[0]!;
    const impact = confirmExecutionAdaptation(card, {
      kind: "quantity",
      workId: card.id,
      executionQuantity: 99,
      requestProductionChange: true,
    });
    expect(impact?.escalationRequired).toBe(true);
    expect(impact?.affectsExecutionItem).toBe(false);
    expect(impact?.escalationTarget).toBe("production");

    const after = listAdaptedExecutionCards(week, week).find(
      (c) => c.id === card.id,
    )!;
    expect(after.executionAdapted).toBeFalsy();
    expect(effectiveExecutionQuantity(after)).toBe(card.quantity);
  });
});
