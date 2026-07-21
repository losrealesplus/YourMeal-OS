import type { Dish } from "../../domain/entities";
import type { DishRepository } from "../../domain/repositories";
import type { DishId, TenantId } from "../../domain/types";
import type { DishName } from "../../domain/value-objects";
import {
  isArchivedRow,
  mapDishToRow,
  mapRowToDish,
  type DishRow,
} from "../dish-row-mapper";

/**
 * Persistence-shaped DishRepository for Infrastructure Validation tests.
 * Stores rows using the same Domain ↔ Row mapper as SupabaseDishRepository.
 * Not a production adapter — proves Core works against persistence mapping.
 */
export class PersistenceBackedDishRepository implements DishRepository {
  private readonly rows = new Map<string, DishRow>();

  private key(tenantId: string, id: string): string {
    return `${tenantId}:${id}`;
  }

  async save(dish: Dish): Promise<void> {
    const row = mapDishToRow(dish) as DishRow;
    this.rows.set(this.key(row.tenant_id, row.id), {
      ...row,
      macros: row.macros ?? {},
      prep_minutes: row.prep_minutes ?? null,
      prep_instructions: row.prep_instructions ?? null,
      allergens: row.allergens ?? [],
      tags: row.tags ?? [],
      category_id: row.category_id,
      recipe_id: row.recipe_id ?? null,
    } as DishRow);
  }

  async findById(tenantId: TenantId, id: DishId): Promise<Dish | null> {
    const row = this.rows.get(this.key(tenantId.toString(), id.toString()));
    if (!row || isArchivedRow(row)) return null;
    return mapRowToDish(row);
  }

  async existsByName(tenantId: TenantId, name: DishName): Promise<boolean> {
    for (const row of this.rows.values()) {
      if (
        row.tenant_id === tenantId.toString() &&
        row.name === name.toString() &&
        !isArchivedRow(row)
      ) {
        return true;
      }
    }
    return false;
  }

  async listNotArchived(tenantId: TenantId): Promise<Dish[]> {
    return [...this.rows.values()]
      .filter(
        (row) =>
          row.tenant_id === tenantId.toString() && !isArchivedRow(row),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(mapRowToDish);
  }

  async findByIdIncludingArchived(
    tenantId: TenantId,
    id: DishId,
  ): Promise<Dish | null> {
    const row = this.rows.get(this.key(tenantId.toString(), id.toString()));
    return row ? mapRowToDish(row) : null;
  }

  async purge(tenantId: TenantId, id: DishId): Promise<void> {
    this.rows.delete(this.key(tenantId.toString(), id.toString()));
  }

  /** Test helper */
  dump(): DishRow[] {
    return [...this.rows.values()];
  }
}
