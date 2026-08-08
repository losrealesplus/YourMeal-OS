/**
 * KITCHEN EXPERIENCE 004 · Zero Friction Kitchen Labels & Special Information.
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
import {
  clearExecutionAdaptationsForTests,
  confirmExecutionAdaptation,
  listAdaptedExecutionCards,
} from "@/kitchen-experience/adapt-execution";
import {
  LABEL_ABSENT_COPY,
  LABEL_NO_SPECIAL_COPY,
  buildLabelContext,
  labelFieldDisplay,
  listLabelContexts,
} from "@/kitchen-experience/label-context";
import { labelContextsToCsv } from "@/kitchen-experience/export-label-context";
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

describe("KITCHEN EXPERIENCE 004 · Labels & Special Information", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
    clearProductionPlansForTests();
    clearKitchenWorkStatusForTests();
    clearExecutionAdaptationsForTests();
  });

  it("documents TILC · consume-only · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/KITCHEN_EXPERIENCE_004.md"),
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
      resolve(ROOT, "src/kitchen-experience/KitchenLabelsPanel.tsx"),
      "utf8",
    );
    const model = readFileSync(
      resolve(ROOT, "src/kitchen-experience/label-context.ts"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Kitchen Labels & Special Information");
    expect(doc).toContain(
      "Time-to-Identify-Label-Context (TILC) < 10 seconds",
    );
    expect(doc).toContain(
      "Time-to-Understand-Special-Information < 5 seconds",
    );
    expect(doc).toContain("40–180 s");
    expect(doc).toContain("Not available in this substrate");
    expect(doc).toContain("No special information recorded");
    expect(doc).toContain("Physical label generation");
    expect(doc).toContain("No Kitchen / Production / Order Capability");

    expect(cards).toContain("004 Labels & Special Info");
    expect(cards).toContain(
      "Zero Friction Kitchen Labels & Special Information",
    );
    expect(cards).toContain("Time-to-Identify-Label-Context <10 s");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("KITCHEN-EXPERIENCE-004");
    expect(missions).toContain("KE004 Labels ▶");
    expect(missions).toContain("TILC");

    expect(ui).toContain("KITCHEN EXPERIENCE 004");
    expect(ui).toContain("KitchenLabelsPanel");
    expect(ui).toContain('mode === "labels"');
    expect(ui).toContain("TILC < 10 s");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);
    expect(ui).not.toMatch(/KitchenExecutionFacade/);
    expect(ui).not.toMatch(/OrderFacade/);
    expect(ui).not.toMatch(/CustomerFacade/);

    expect(panel).toContain("Etiquetas e información especial");
    expect(panel).toContain("Ver contexto de etiqueta");
    expect(panel).toContain("Etiquetas físicas → Future");
    expect(panel).toContain("Volver a Today's Work");
    expect(panel).toContain("LABEL_ABSENT_COPY");
    expect(panel).toContain("LABEL_NO_SPECIAL_COPY");
    expect(LABEL_ABSENT_COPY).toBe("Not available in this substrate");
    expect(LABEL_NO_SPECIAL_COPY).toBe("No special information recorded");

    expect(model).toContain("Not available in this substrate");
    expect(model).toContain("Generate physical labels → Future");
    expect(model).not.toMatch(/saveProductionPlan/);
  });

  it("builds honest label context with allergens critical and absent customer", () => {
    const week = seedHandedOffWeek();
    const cards = listAdaptedExecutionCards(week, week);
    expect(cards.length).toBeGreaterThan(0);
    const ctx = buildLabelContext(cards[0]!);

    expect(ctx.dishLabel).toBe("Poke salmón");
    expect(ctx.hasCritical).toBe(true);
    expect(ctx.special.some((s) => s.kind === "allergen")).toBe(true);
    expect(
      ctx.special.find((s) => s.kind === "allergen")?.severity,
    ).toBe("critical");

    const customer = ctx.identity.find((f) => f.id === "customer")!;
    expect(customer.availability).toBe("absent");
    expect(labelFieldDisplay(customer)).toBe(LABEL_ABSENT_COPY);

    const order = ctx.identity.find((f) => f.id === "order")!;
    expect(labelFieldDisplay(order)).toBe(LABEL_ABSENT_COPY);

    const delivery = ctx.identity.find((f) => f.id === "delivery")!;
    expect(labelFieldDisplay(delivery)).toBe(LABEL_ABSENT_COPY);

    expect(ctx.substrateGaps.some((g) => g.includes("physical label"))).toBe(
      true,
    );

    const csv = labelContextsToCsv(listLabelContexts(week, week));
    expect(csv).toContain("Poke salmón");
    expect(csv).toContain("pescado");
    expect(csv).toContain(LABEL_ABSENT_COPY);
  });

  it("surfaces session special instruction without inventing Order substrate", () => {
    const week = seedHandedOffWeek();
    const card = listAdaptedExecutionCards(week, week)[0]!;
    confirmExecutionAdaptation(card, {
      kind: "special_instruction",
      workId: card.id,
      specialInstruction: "Sin salsa aparte",
    });
    const adapted = listAdaptedExecutionCards(week, week).find(
      (c) => c.id === card.id,
    )!;
    const ctx = buildLabelContext(adapted);
    const instr = ctx.special.find((s) => s.kind === "instruction");
    expect(instr?.detail).toBe("Sin salsa aparte");
    expect(instr?.source).toBe("session");
    expect(ctx.identity.find((f) => f.id === "order")?.availability).toBe(
      "absent",
    );
  });
});
