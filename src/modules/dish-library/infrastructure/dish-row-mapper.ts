import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  Calories,
  CategoryId,
  Dish,
  DishId,
  DishName,
  DishStatus,
  Money,
  NutritionFacts,
  PortionSize,
  RecipeId,
  TenantId,
} from "../domain";

/**
 * Domain ↔ Persistence mapping for Dish.
 * Infrastructure only — no business rules.
 * @see docs/13-repositories/SupabaseDishRepository.md
 */

export type DishRow = Tables<"dishes">;
export type DishRowInsert = TablesInsert<"dishes">;

export function mapDishToRow(dish: Dish): DishRowInsert {
  const status = dish.getStatus().toString();
  const archived = dish.isArchived();

  return {
    id: dish.getId().toString(),
    tenant_id: dish.getTenantId().toString(),
    name: dish.getName().toString(),
    category_id: dish.getCategoryId().toString(),
    description: dish.getDescription(),
    photo_url: dish.getPhotoUrl(),
    weight_g: dish.getPortionSize()?.toGrams() ?? null,
    kcal: dish.getNutrition().getCalories()?.toKcal() ?? null,
    cost: dish.getCost().toAmount(),
    price: dish.getPrice().toAmount(),
    allergens: [...dish.getAllergens()],
    tags: [...dish.getTags()],
    recipe_id: dish.getRecipeId()?.toString() ?? null,
    status,
    deleted_at: archived
      ? (dish.getArchivedAt() ?? new Date()).toISOString()
      : null,
    deleted_by: archived ? dish.getArchivedBy() : null,
    created_at: dish.getCreatedAt().toISOString(),
    updated_at: dish.getUpdatedAt().toISOString(),
    macros: {},
  };
}

export function mapRowToDish(row: DishRow): Dish {
  const calories =
    row.kcal == null ? null : Calories.create(Number(row.kcal));
  const portion =
    row.weight_g == null ? null : PortionSize.create(Number(row.weight_g));

  return Dish.reconstitute({
    id: DishId.create(row.id),
    tenantId: TenantId.create(row.tenant_id),
    name: DishName.create(row.name),
    categoryId: CategoryId.create(row.category_id),
    description: row.description,
    photoUrl: row.photo_url,
    portionSize: portion,
    nutrition: NutritionFacts.create({ calories }),
    cost: Money.create(Number(row.cost)),
    price: Money.create(Number(row.price)),
    allergens: row.allergens ?? [],
    tags: row.tags ?? [],
    recipeId: row.recipe_id ? RecipeId.create(row.recipe_id) : null,
    status: DishStatus.from(row.status),
    archivedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    archivedBy: row.deleted_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

export function isArchivedRow(row: Pick<DishRow, "status" | "deleted_at">): boolean {
  return row.status === "archived" || row.deleted_at != null;
}
