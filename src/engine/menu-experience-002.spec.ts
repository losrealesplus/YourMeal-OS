/**
 * MENU EXPERIENCE 002 · Zero Friction Menu Search (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  rankMenuHits,
  scoreMenuHit,
  type MenuSearchHit,
} from "@/menu-experience/menu-search-rank";
import {
  clearWeekPlansForTests,
  createEmptyWeek,
  mondayIso,
  upsertSlot,
} from "@/menu-experience/week-plan";

const ROOT = process.cwd();

describe("MENU EXPERIENCE 002 · Zero Friction Menu Search", () => {
  beforeEach(() => {
    clearWeekPlansForTests();
  });

  it("documents TTFM · temporal hierarchy · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/MENU_EXPERIENCE_002.md"),
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
      resolve(ROOT, "src/routes/_authenticated/admin.menu-planning.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      resolve(ROOT, "src/menu-experience/MenuSearchPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Menu Search");
    expect(doc).toContain("Time-to-Find Menu Item (TTFM) < 10 seconds");
    expect(doc).toContain("20–80 s");
    expect(doc).toContain("Semana");
    expect(doc).toContain("No Menu Capability / Facade / Engine");

    expect(cards).toContain("002 Search");
    expect(cards).toContain("Zero Friction Menu Search");
    expect(cards).toContain("Time-to-Find Menu Item <10 s");
    expect(cards).toContain("Semana → Día → Menú → Platos");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("MENU-EXPERIENCE-002");
    expect(missions).toContain("MENU-EXPERIENCE-005");
    expect(missions).toContain("TTFM <10s");
    expect(missions).toContain("ME002 Search ✅");

    expect(ui).toContain("MENU EXPERIENCE 002");
    expect(ui).toContain("MenuSearchPanel");
    expect(ui).toContain('mode === "search"');

    expect(panel).toContain("Buscar en la planificación");
    expect(panel).toContain("rankMenuHits");
    expect(panel).toContain("Duplicar semana anterior");
    expect(panel).toContain("Bulk → Reserved");
  });

  it("ranks dish and current-week hits above older drafts", () => {
    const week = mondayIso();
    createEmptyWeek(week);
    upsertSlot(week, {
      dayDate: week,
      dishId: "d1",
      dishLabel: "Poke salmón",
      disabled: false,
    });

    const dishHit: MenuSearchHit = {
      id: "dish",
      scope: "dish",
      weekStart: week,
      dayDate: week,
      menuName: `Semana ${week}`,
      dishLabel: "Poke salmón",
      dishCount: 1,
      status: "draft",
      publication: "draft",
      allergenStatus: "unknown",
      macroStatus: "unknown",
      source: "session",
      updatedAt: new Date().toISOString(),
    };
    const oldWeek: MenuSearchHit = {
      ...dishHit,
      id: "old",
      scope: "week",
      weekStart: "2020-01-06",
      dayDate: null,
      dishLabel: null,
      dishCount: 0,
      publication: "draft",
      updatedAt: "2020-01-06T00:00:00.000Z",
    };

    const ranked = rankMenuHits([oldWeek, dishHit], "poke");
    expect(ranked[0]?.id).toBe("dish");
    expect(scoreMenuHit(dishHit, "poke")).toBeGreaterThan(
      scoreMenuHit(oldWeek, "poke"),
    );
  });
});
