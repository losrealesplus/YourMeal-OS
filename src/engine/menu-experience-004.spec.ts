/**
 * MENU EXPERIENCE 004 · Zero Friction Dish Library Integration (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDishUsageForTests,
  dishRowToLibraryItem,
  markDishUsed,
  rankDishLibrary,
  scoreDishLibraryItem,
} from "@/menu-experience/dish-library";
import type { DishRow } from "@/modules/dish-library/infrastructure/dish-repository";

const ROOT = process.cwd();

function fakeDish(partial: Partial<DishRow> & { id: string; name: string }): DishRow {
  return {
    id: partial.id,
    tenant_id: "t1",
    name: partial.name,
    description: partial.description ?? null,
    category_id: partial.category_id ?? null,
    tags: partial.tags ?? [],
    allergens: partial.allergens ?? [],
    macros: partial.macros ?? {},
    kcal: partial.kcal ?? null,
    status: partial.status ?? "active",
    price: partial.price ?? null,
    photo_url: partial.photo_url ?? null,
    weight_g: partial.weight_g ?? null,
    created_at: partial.created_at ?? new Date().toISOString(),
    updated_at: partial.updated_at ?? new Date().toISOString(),
    deleted_at: partial.deleted_at ?? null,
  } as DishRow;
}

describe("MENU EXPERIENCE 004 · Zero Friction Dish Library Integration", () => {
  beforeEach(() => {
    clearDishUsageForTests();
  });

  it("documents TTFID · Operational Libraries · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/MENU_EXPERIENCE_004.md"),
      "utf8",
    );
    const libs = readFileSync(
      resolve(ROOT, "docs/00-status/OPERATIONAL_LIBRARIES.md"),
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
    const picker = readFileSync(
      resolve(ROOT, "src/menu-experience/DishLibraryPicker.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Dish Library Integration");
    expect(doc).toContain("Time-to-Find-and-Insert Dish (TTFID) < 15 seconds");
    expect(doc).toContain("Time-to-Replace Dish < 20 seconds");
    expect(doc).toContain("30–105 s");
    expect(doc).toContain("No Dish Library Capability");

    expect(libs).toContain("Libraries are not where work happens.");
    expect(libs).toContain("Dish Library");
    expect(libs).toContain("Customer Library");

    expect(cards).toContain("004 Dish Library");
    expect(cards).toContain("Zero Friction Dish Library Integration");
    expect(cards).toContain("Time-to-Find-and-Insert Dish <15 s");
    expect(cards).toContain("OPERATIONAL_LIBRARIES");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("MENU-EXPERIENCE-004");
    expect(missions).toContain("TTFID <15s");
    expect(missions).toContain("ME004 Dish Library ✅");
    expect(missions).toContain("MENU-EXPERIENCE-005");

    expect(ui).toContain("MENU EXPERIENCE 004");
    expect(ui).toContain("dishRowToLibraryItem");
    expect(ui).toContain("libraryItems");

    expect(picker).toContain("DishLibraryPicker");
    expect(picker).toContain("Biblioteca");
    expect(picker).toContain("Insertar");
    expect(picker).toContain("Reemplazar plato actual");
    expect(picker).toContain("Crear plato");

    const adapt = readFileSync(
      resolve(ROOT, "src/menu-experience/MenuAdaptationPanel.tsx"),
      "utf8",
    );
    expect(adapt).toContain("DishLibraryPicker");
  });

  it("ranks available and frequently used dishes for reuse", () => {
    const a = dishRowToLibraryItem(
      fakeDish({
        id: "1",
        name: "Poke salmón",
        tags: ["poke"],
        allergens: ["pescado"],
        macros: { proteinG: 30, carbsG: 40, fatG: 12 },
        kcal: 420,
        status: "active",
      }),
    );
    const b = dishRowToLibraryItem(
      fakeDish({
        id: "2",
        name: "Sopa",
        status: "draft",
      }),
    );
    markDishUsed("1");
    markDishUsed("1");
    const refreshed = dishRowToLibraryItem(
      fakeDish({
        id: "1",
        name: "Poke salmón",
        tags: ["poke"],
        allergens: ["pescado"],
        macros: { proteinG: 30, carbsG: 40, fatG: 12 },
        kcal: 420,
        status: "active",
      }),
    );
    const ranked = rankDishLibrary([b, refreshed], "poke");
    expect(ranked[0]?.id).toBe("1");
    expect(scoreDishLibraryItem(refreshed, "poke")).toBeGreaterThan(
      scoreDishLibraryItem(b, "poke"),
    );
    expect(a.macrosComplete).toBe("known");
  });
});
