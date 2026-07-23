import { describe, expect, it } from "vitest";
import type { DishRow } from "../infrastructure/dish-repository";
import { mapDishRowToCatalogDish } from "./dish-catalog-mapper";

function baseRow(overrides: Partial<DishRow> = {}): DishRow {
  return {
    id: "d1",
    tenant_id: "t1",
    name: "Bowl test",
    description: "Fresco",
    photo_url: null,
    kcal: 400,
    macros: { proteinG: 20, carbsG: 40, fatG: 10 },
    allergens: ["sesame"],
    tags: ["vegetarian", "unknownTag", "glutenFree"],
    status: "active",
    category_id: "c1",
    recipe_id: null,
    cost: 0,
    price: 0,
    prep_minutes: null,
    prep_instructions: null,
    weight_g: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    deleted_at: null,
    deleted_by: null,
    ...overrides,
  };
}

describe("mapDishRowToCatalogDish", () => {
  it("projects row fields onto the DishCard contract", () => {
    const dish = mapDishRowToCatalogDish(baseRow());
    expect(dish).toMatchObject({
      id: "d1",
      name: "Bowl test",
      tagline: "Fresco",
      kcal: 400,
      proteinG: 20,
      carbsG: 40,
      fatG: 10,
      allergens: ["sesame"],
      ingredients: [],
    });
    expect(dish.tags).toEqual(["vegetarian", "glutenFree"]);
    expect(dish.emoji).toBeTruthy();
  });

  it("falls back kcal from macros when column is null", () => {
    const dish = mapDishRowToCatalogDish(
      baseRow({ kcal: null, macros: { kcal: 350, protein_g: 12, carbs_g: 30, fat_g: 8 } }),
    );
    expect(dish.kcal).toBe(350);
    expect(dish.proteinG).toBe(12);
    expect(dish.carbsG).toBe(30);
    expect(dish.fatG).toBe(8);
  });

  it("uses empty tagline when description is null", () => {
    expect(mapDishRowToCatalogDish(baseRow({ description: null })).tagline).toBe("");
  });
});
