/**
 * KITCHEN EXPERIENCE 002 · Zero Friction Kitchen Execution Search (Experience only).
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
import { clearKitchenWorkStatusForTests } from "@/kitchen-experience/today-work";
import {
  clearKitchenRecentForTests,
  rememberKitchenWorkAccess,
  searchExecutionWork,
} from "@/kitchen-experience/execution-search-rank";

const ROOT = process.cwd();

describe("KITCHEN EXPERIENCE 002 · Zero Friction Kitchen Execution Search", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
    clearProductionPlansForTests();
    clearKitchenWorkStatusForTests();
    clearKitchenRecentForTests();
  });

  it("documents TTFEW · execution-only search · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/KITCHEN_EXPERIENCE_002.md"),
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
      resolve(ROOT, "src/kitchen-experience/KitchenSearchPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Kitchen Execution Search");
    expect(doc).toContain(
      "Time-to-Find-Execution-Work (TTFEW) < 10 seconds",
    );
    expect(doc).toContain("20–80 s");
    expect(doc).toContain("No Kitchen / Production Capability");
    expect(doc).toContain("does not become");

    expect(cards).toContain("002 Execution Search");
    expect(cards).toContain("Zero Friction Kitchen Execution Search");
    expect(cards).toContain("Time-to-Find-Execution-Work <10 s");

    expect(missions).toContain("KITCHEN-EXPERIENCE-002");
    expect(missions).toContain("KE002 Search ✅");
    expect(doc).toContain("COMPLETE");

    expect(ui).toContain("KITCHEN EXPERIENCE 002");
    expect(ui).toContain("KitchenSearchPanel");
    expect(ui).toContain('mode === "search"');
    expect(ui).toContain("TTFEW < 10 s");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);
    expect(ui).not.toMatch(/KitchenExecutionFacade/);
    expect(ui).not.toMatch(/OrderFacade/);

    expect(panel).toContain("Buscar trabajo de ejecución");
    expect(panel).toContain("Volver a Today's Work");
    expect(panel).toContain("No hay trabajo de ejecución que coincida");
    expect(panel).toContain("Start / Pause / Assign → Future");
    expect(panel).toContain("no disponible en este substrate");
  });

  it("ranks today's dish hits above empty queries and remembers recent access", () => {
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
    expect(confirmKitchenHandoff(week, { acknowledgeWarnings: true }).ok).toBe(
      true,
    );

    const browse = searchExecutionWork("", week);
    expect(browse.length).toBeGreaterThan(0);

    const hits = searchExecutionWork("poke", week);
    expect(hits[0]?.dishLabel).toBe("Poke salmón");
    expect(hits[0]?.customerLabel).toBeNull();

    const batchHits = searchExecutionWork(hits[0]!.batchKey.slice(0, 3), week);
    expect(batchHits.some((h) => h.id === hits[0]!.id)).toBe(true);

    rememberKitchenWorkAccess(hits[0]!.id);
    const again = searchExecutionWork("", week);
    expect(again[0]?.id).toBe(hits[0]!.id);
  });
});
