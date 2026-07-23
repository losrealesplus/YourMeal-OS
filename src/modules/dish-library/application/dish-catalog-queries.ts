import { mapDishRowToCatalogDish, type CatalogDish } from "./dish-catalog-mapper";
import { supabase } from "@/integrations/supabase/client";
import { createDishRepository } from "../infrastructure/dish-repository";

/**
 * CAP-002 query keys — tenant-scoped dish catalog (read-only).
 * Uses RLS + tenant membership; does not go through staff `dishes.read`.
 */
export const dishCatalogKeys = {
  all: (tenantId: string) => ["dish-catalog", tenantId] as const,
  list: (tenantId: string) => [...dishCatalogKeys.all(tenantId), "list"] as const,
  detail: (tenantId: string, id: string) =>
    [...dishCatalogKeys.all(tenantId), "detail", id] as const,
};

export async function fetchCatalogDishes(tenantId: string): Promise<CatalogDish[]> {
  const rows = await createDishRepository(supabase, tenantId).listCatalog();
  return rows.map(mapDishRowToCatalogDish);
}

export async function fetchCatalogDish(
  tenantId: string,
  dishId: string,
): Promise<CatalogDish | null> {
  const row = await createDishRepository(supabase, tenantId).findCatalogById(dishId);
  return row ? mapDishRowToCatalogDish(row) : null;
}

export async function fetchCatalogDishesByIds(
  tenantId: string,
  dishIds: string[],
): Promise<Map<string, CatalogDish>> {
  const rows = await createDishRepository(supabase, tenantId).listCatalogByIds(dishIds);
  return new Map(rows.map((row) => [row.id, mapDishRowToCatalogDish(row)]));
}
