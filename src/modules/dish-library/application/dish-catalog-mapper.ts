import type { Json } from "@/integrations/supabase/types";
import type { MockDish } from "@/lib/mock-catalog";
import type { DishRow } from "../infrastructure/dish-repository";

/**
 * CAP-002 — map persistence rows to the existing DishCard view contract.
 * Does not invent domain rules; only projects fields the UI already consumes.
 */
export type CatalogDish = MockDish;

const CATALOG_TAGS = new Set<CatalogDish["tags"][number]>([
  "vegan",
  "vegetarian",
  "glutenFree",
  "lactoseFree",
  "spicy",
]);

type MacroBag = {
  proteinG: number;
  carbsG: number;
  fatG: number;
  kcal?: number;
};

function asRecord(value: Json): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function parseMacros(macros: Json): MacroBag {
  const m = asRecord(macros);
  return {
    proteinG: num(m.proteinG ?? m.protein_g ?? m.protein),
    carbsG: num(m.carbsG ?? m.carbs_g ?? m.carbs ?? m.carbohydrates),
    fatG: num(m.fatG ?? m.fat_g ?? m.fat),
    kcal: m.kcal !== undefined ? num(m.kcal) : undefined,
  };
}

function filterTags(tags: string[] | null | undefined): CatalogDish["tags"] {
  const out: CatalogDish["tags"] = [];
  for (const tag of tags ?? []) {
    if (CATALOG_TAGS.has(tag as CatalogDish["tags"][number])) {
      out.push(tag as CatalogDish["tags"][number]);
    }
  }
  return out;
}

/** Stable placeholder until photo UX is a certified capability. */
const CATALOG_EMOJI_PLACEHOLDER = "🍽️";

export function mapDishRowToCatalogDish(row: DishRow): CatalogDish {
  const macros = parseMacros(row.macros);
  return {
    id: row.id,
    name: row.name,
    tagline: row.description ?? "",
    emoji: CATALOG_EMOJI_PLACEHOLDER,
    kcal: row.kcal ?? macros.kcal ?? 0,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
    price: num(row.price),
    tags: filterTags(row.tags),
    allergens: row.allergens ?? [],
    ingredients: [],
  };
}
