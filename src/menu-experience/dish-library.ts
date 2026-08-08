/**
 * ME004 — Experience-layer Dish Library integration.
 *
 * Operational memory of the tenant — consumed by weekly planning.
 * Not dish CRUD. Not a second Capability.
 */

import type { DishRow } from "@/modules/dish-library/infrastructure/dish-repository";
import type { DishPick } from "@/menu-experience/MenuPlanningPanel";

export type Completeness = "known" | "partial" | "unknown";

export type DishLibraryItem = DishPick & {
  categoryHint: string | null;
  description: string | null;
  tags: string[];
  availability: "available" | "draft" | "inactive" | "archived";
  macrosComplete: Completeness;
  allergenComplete: Completeness;
  useCount: number;
  lastUsedAt: string | null;
};

const USAGE_KEY = "ymos.me.dish_usage.v1";

type UsageRow = { dishId: string; useCount: number; lastUsedAt: string };

let usageMemory: UsageRow[] = [];

function readUsage(): UsageRow[] {
  if (typeof sessionStorage === "undefined") return [...usageMemory];
  try {
    const raw = sessionStorage.getItem(USAGE_KEY);
    if (!raw) return [...usageMemory];
    const parsed = JSON.parse(raw) as UsageRow[];
    return Array.isArray(parsed) ? parsed : [...usageMemory];
  } catch {
    return [...usageMemory];
  }
}

function writeUsage(rows: UsageRow[]) {
  usageMemory = rows;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(USAGE_KEY, JSON.stringify(rows.slice(0, 80)));
  } catch {
    /* ignore */
  }
}

export function markDishUsed(dishId: string) {
  const rows = readUsage();
  const idx = rows.findIndex((r) => r.dishId === dishId);
  const now = new Date().toISOString();
  if (idx >= 0) {
    rows[idx] = {
      dishId,
      useCount: rows[idx]!.useCount + 1,
      lastUsedAt: now,
    };
  } else {
    rows.unshift({ dishId, useCount: 1, lastUsedAt: now });
  }
  writeUsage(rows.sort((a, b) => b.useCount - a.useCount));
}

export function clearDishUsageForTests() {
  usageMemory = [];
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(USAGE_KEY);
  }
}

function macrosObject(macros: DishRow["macros"]): Record<string, unknown> {
  if (!macros || typeof macros !== "object" || Array.isArray(macros)) return {};
  return macros as Record<string, unknown>;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function macrosHintFromRow(row: DishRow): string | null {
  const m = macrosObject(row.macros);
  const protein = num(m.proteinG ?? m.protein_g);
  const carbs = num(m.carbsG ?? m.carbs_g);
  const fat = num(m.fatG ?? m.fat_g);
  const kcal = row.kcal ?? num(m.kcal);
  const parts: string[] = [];
  if (kcal != null) parts.push(`${kcal} kcal`);
  if (protein != null) parts.push(`P${protein}`);
  if (carbs != null) parts.push(`C${carbs}`);
  if (fat != null) parts.push(`G${fat}`);
  return parts.length ? parts.join(" · ") : null;
}

export function allergenHintFromRow(row: DishRow): string | null {
  const list = (row.allergens ?? []).filter(Boolean);
  if (!list.length) return null;
  return list.slice(0, 4).join(", ");
}

export function macrosCompleteness(row: DishRow): Completeness {
  const m = macrosObject(row.macros);
  const keys = ["proteinG", "protein_g", "carbsG", "carbs_g", "fatG", "fat_g", "kcal"];
  const hit = keys.filter((k) => num(m[k]) != null).length + (row.kcal != null ? 1 : 0);
  if (hit === 0) return "unknown";
  if (hit >= 3) return "known";
  return "partial";
}

export function allergenCompleteness(row: DishRow): Completeness {
  const list = row.allergens ?? [];
  if (!list.length) return "unknown";
  return "known";
}

export function availabilityFromRow(
  row: DishRow,
): DishLibraryItem["availability"] {
  if (row.status === "active") return "available";
  if (row.status === "draft") return "draft";
  if (row.status === "archived") return "archived";
  return "inactive";
}

export function dishRowToLibraryItem(row: DishRow): DishLibraryItem {
  const usage = readUsage().find((u) => u.dishId === row.id);
  return {
    id: row.id,
    label: row.name,
    durable: true,
    macrosHint: macrosHintFromRow(row),
    allergenHint: allergenHintFromRow(row),
    categoryHint: row.category_id ? `Cat · ${row.category_id.slice(0, 8)}` : null,
    description: row.description?.trim() || null,
    tags: (row.tags ?? []).filter(Boolean),
    availability: availabilityFromRow(row),
    macrosComplete: macrosCompleteness(row),
    allergenComplete: allergenCompleteness(row),
    useCount: usage?.useCount ?? 0,
    lastUsedAt: usage?.lastUsedAt ?? null,
  };
}

export function toDishPick(item: DishLibraryItem): DishPick {
  return {
    id: item.id,
    label: item.label,
    durable: item.durable,
    macrosHint: item.macrosHint,
    allergenHint: item.allergenHint,
  };
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function scoreDishLibraryItem(
  item: DishLibraryItem,
  rawQuery: string,
): number {
  const q = normalize(rawQuery.trim());
  let score = 0;

  if (item.availability === "available") score += 80;
  else if (item.availability === "draft") score += 20;
  else score -= 40;

  score += Math.min(item.useCount, 12) * 12;
  if (item.lastUsedAt) {
    const age = Date.now() - Date.parse(item.lastUsedAt);
    if (!Number.isNaN(age) && age < 1000 * 60 * 60 * 24 * 14) score += 40;
  }

  if (item.macrosComplete === "known") score += 15;
  if (item.allergenComplete === "known") score += 15;

  if (!q) return score;

  const name = normalize(item.label);
  const tags = normalize(item.tags.join(" "));
  const desc = normalize(item.description ?? "");
  const allergens = normalize(item.allergenHint ?? "");

  if (name === q) score += 500;
  else if (name.startsWith(q)) score += 340;
  else if (name.includes(q)) score += 220;

  if (tags.includes(q)) score += 140;
  if (desc.includes(q)) score += 80;
  if (allergens.includes(q)) score += 60;

  const categories = ["poke", "bowl", "ensalada", "wrap", "quinoa", "smoothie", "sopa"];
  for (const c of categories) {
    if (q.includes(c) && name.includes(c)) score += 100;
  }

  return score;
}

export function rankDishLibrary(
  items: DishLibraryItem[],
  query: string,
): DishLibraryItem[] {
  return [...items].sort(
    (a, b) => scoreDishLibraryItem(b, query) - scoreDishLibraryItem(a, query),
  );
}

export function availabilityLabel(
  a: DishLibraryItem["availability"],
): string {
  switch (a) {
    case "available":
      return "Disponible";
    case "draft":
      return "Borrador";
    case "archived":
      return "Archivado";
    default:
      return "Inactivo";
  }
}

export function completenessLabel(kind: "Macros" | "Alérgenos", c: Completeness) {
  if (c === "known") return `${kind} OK`;
  if (c === "partial") return `${kind} parcial`;
  return `${kind} sin datos`;
}
