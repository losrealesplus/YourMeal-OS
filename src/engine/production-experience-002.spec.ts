/**
 * PRODUCTION EXPERIENCE 002 · Zero Friction Production Search (Experience only).
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
import { clearProductionPlansForTests } from "@/production-experience/production-plan";
import {
  buildProductionHits,
  rankProductionHits,
  scoreProductionHit,
} from "@/production-experience/production-search-rank";

const ROOT = process.cwd();

describe("PRODUCTION EXPERIENCE 002 · Zero Friction Production Search", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
    clearProductionPlansForTests();
  });

  it("documents TTFPW · live search · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/PRODUCTION_EXPERIENCE_002.md"),
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
      resolve(ROOT, "src/production-experience/ProductionSearchPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Production Search");
    expect(doc).toContain(
      "Time-to-Find-Production-Work (TTFPW) < 10 seconds",
    );
    expect(doc).toContain("20–80 s");
    expect(doc).toContain("No Production Capability");
    expect(doc).toContain("Never internal IDs");

    expect(cards).toContain("002 Production Search");
    expect(cards).toContain("Zero Friction Production Search");
    expect(cards).toContain("Time-to-Find-Production-Work <10 s");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("PRODUCTION-EXPERIENCE-002");
    expect(missions).toContain("TTFPW <10s");
    expect(missions).toContain("PE002 Search ▶");

    expect(ui).toContain("PRODUCTION EXPERIENCE 002");
    expect(ui).toContain("ProductionSearchPanel");
    expect(ui).toContain('mode === "search"');
    expect(ui).toContain("TTFPW < 10 s");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);

    expect(panel).toContain("Buscar trabajo de producción");
    expect(panel).toContain("Abrir trabajo");
    expect(panel).toContain("Revisar alertas");
    expect(panel).toContain("Abrir Production Planning");
    expect(panel).toContain("Regenerar → Future");
  });

  it("ranks high-load and alert hits above quiet older weeks", () => {
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

    const hits = buildProductionHits([generated.plan]);
    expect(hits.some((h) => h.scope === "day")).toBe(true);
    expect(hits.some((h) => h.scope === "prep")).toBe(true);
    expect(hits.some((h) => h.scope === "batch")).toBe(true);

    const ranked = rankProductionHits(hits, "poke");
    expect(ranked[0]?.title.toLowerCase()).toContain("poke");
    const alertHits = rankProductionHits(hits, "descongel");
    expect(alertHits.length).toBeGreaterThan(0);

    const dayHit = hits.find((h) => h.scope === "day")!;
    expect(scoreProductionHit(dayHit, "lun")).toBeGreaterThan(0);
  });
});
