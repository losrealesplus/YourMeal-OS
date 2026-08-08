/**
 * KITCHEN EXPERIENCE 005 · Zero Friction Kitchen Execution Progress.
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
  buildExecutionProgress,
  filterProgressLines,
} from "@/kitchen-experience/execution-progress";
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

describe("KITCHEN EXPERIENCE 005 · Execution Progress", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
    clearProductionPlansForTests();
    clearKitchenWorkStatusForTests();
    clearExecutionAdaptationsForTests();
  });

  it("documents TTEP · session honesty · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/KITCHEN_EXPERIENCE_005.md"),
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
      resolve(ROOT, "src/kitchen-experience/KitchenProgressPanel.tsx"),
      "utf8",
    );
    const model = readFileSync(
      resolve(ROOT, "src/kitchen-experience/execution-progress.ts"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Kitchen Execution Progress");
    expect(doc).toContain(
      "Time-to-Understand-Execution-Progress (TTEP) < 5 seconds",
    );
    expect(doc).toContain("Time-to-Identify-Remaining-Work < 5 seconds");
    expect(doc).toContain("25–110 s");
    expect(doc).toContain("Execution progress not yet available");
    expect(doc).toContain("No Kitchen / Production / Order Capability");
    expect(doc).toContain("Start / Pause / Resume / Block / Assign");

    expect(cards).toContain("005 Execution Progress");
    expect(cards).toContain("Zero Friction Kitchen Execution Progress");
    expect(cards).toContain("Time-to-Understand-Execution-Progress <5 s");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("KITCHEN-EXPERIENCE-005");
    expect(missions).toContain("KE005 Progress ▶");
    expect(missions).toContain("TTEP");

    expect(ui).toContain("KITCHEN EXPERIENCE 005");
    expect(ui).toContain("KitchenProgressPanel");
    expect(ui).toContain('mode === "progress"');
    expect(ui).toContain("TTEP < 5 s");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);
    expect(ui).not.toMatch(/KitchenExecutionFacade/);
    expect(ui).not.toMatch(/startExecution|pauseExecution|completeExecution/i);

    expect(panel).toContain("Progreso de ejecución");
    expect(panel).toContain("Completados (sesión)");
    expect(panel).toContain("Execution progress not yet available");
    expect(panel).toContain("Start / Pause / Resume / Block / Assign → Future");
    expect(panel).toContain("Volver a Today's Work");
    expect(panel).toContain("Abrir o ver un ítem no lo marca completado");

    expect(model).toContain("available_unknown");
    expect(model).toContain("completedSession");
    expect(model).toContain("durableProgressGap");
    expect(model).not.toMatch(/saveProductionPlan/);
  });

  it("counts session completed honestly and leaves unmarked work as unknown durable progress", () => {
    const week = seedHandedOffWeek();
    const before = buildExecutionProgress(week);
    expect(before.total).toBeGreaterThanOrEqual(2);
    expect(before.completedSession).toBe(0);
    expect(before.remaining).toBe(before.total);
    expect(
      before.lines.every((l) => l.durableProgressAvailable === false),
    ).toBe(true);
    expect(
      before.lines.some((l) => l.provenance === "available_unknown"),
    ).toBe(true);
    expect(before.lines[0]!.progressLabel).toContain(
      "Execution progress not yet available",
    );

    const first = before.lines[0]!.card;
    setKitchenWorkStatus(first.id, "completed");
    const after = buildExecutionProgress(week);
    expect(after.completedSession).toBe(1);
    expect(after.remaining).toBe(after.total - 1);
    expect(after.completionIndicator).toContain("Completados (sesión) 1");
    expect(after.sessionCompletionRatio).toBeCloseTo(1 / after.total);

    const completedLine = after.lines.find((l) => l.card.id === first.id)!;
    expect(completedLine.provenance).toBe("session");
    expect(completedLine.bucket).toBe("completed_session");
    expect(completedLine.progressLabel).toContain("sesión");

    const remaining = filterProgressLines(after.lines, "remaining");
    expect(remaining.every((l) => l.bucket !== "completed_session")).toBe(true);
    expect(remaining.length).toBe(after.total - 1);
  });
});
