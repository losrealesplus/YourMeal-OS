import type { AppSupabase } from "@/services/types";
import type { Dish } from "../domain/entities";
import type { DishRepository } from "../domain/repositories";
import type { DishId, TenantId } from "../domain/types";
import type { DishName } from "../domain/value-objects";
import {
  isArchivedRow,
  mapDishToRow,
  mapRowToDish,
  type DishRow,
} from "./dish-row-mapper";

/**
 * Supabase adapter for DishRepository.
 * Translation of docs/13-repositories/SupabaseDishRepository.md
 *
 * No business rules. No Use Cases. No React.
 */

function infraError(operation: string, error: { message: string }): Error {
  return new Error(`SupabaseDishRepository.${operation}: ${error.message}`);
}

export class SupabaseDishRepository implements DishRepository {
  constructor(private readonly client: AppSupabase) {}

  async save(dish: Dish): Promise<void> {
    const row = mapDishToRow(dish);
    const { error } = await this.client.from("dishes").upsert(row, {
      onConflict: "id",
    });
    if (error) throw infraError("save", error);
  }

  async findById(tenantId: TenantId, id: DishId): Promise<Dish | null> {
    const { data, error } = await this.client
      .from("dishes")
      .select("*")
      .eq("tenant_id", tenantId.toString())
      .eq("id", id.toString())
      .is("deleted_at", null)
      .neq("status", "archived")
      .maybeSingle();

    if (error) throw infraError("findById", error);
    if (!data) return null;
    return mapRowToDish(data as DishRow);
  }

  async existsByName(tenantId: TenantId, name: DishName): Promise<boolean> {
    const { data, error } = await this.client
      .from("dishes")
      .select("id")
      .eq("tenant_id", tenantId.toString())
      .eq("name", name.toString())
      .is("deleted_at", null)
      .neq("status", "archived")
      .limit(1);

    if (error) throw infraError("existsByName", error);
    return (data?.length ?? 0) > 0;
  }

  async listNotArchived(tenantId: TenantId): Promise<Dish[]> {
    const { data, error } = await this.client
      .from("dishes")
      .select("*")
      .eq("tenant_id", tenantId.toString())
      .is("deleted_at", null)
      .neq("status", "archived")
      .order("name", { ascending: true });

    if (error) throw infraError("listNotArchived", error);
    return ((data ?? []) as DishRow[]).map(mapRowToDish);
  }

  async findByIdIncludingArchived(
    tenantId: TenantId,
    id: DishId,
  ): Promise<Dish | null> {
    const { data, error } = await this.client
      .from("dishes")
      .select("*")
      .eq("tenant_id", tenantId.toString())
      .eq("id", id.toString())
      .maybeSingle();

    if (error) throw infraError("findByIdIncludingArchived", error);
    if (!data) return null;
    return mapRowToDish(data as DishRow);
  }

  async purge(tenantId: TenantId, id: DishId): Promise<void> {
    const { error } = await this.client
      .from("dishes")
      .delete()
      .eq("tenant_id", tenantId.toString())
      .eq("id", id.toString());

    if (error) throw infraError("purge", error);
  }
}

export function createSupabaseDishRepository(
  client: AppSupabase,
): DishRepository {
  return new SupabaseDishRepository(client);
}

/** Exposed for tests that assert archive detection without domain. */
export { isArchivedRow };
