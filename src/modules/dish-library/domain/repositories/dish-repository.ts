import type { Dish } from "../entities";
import type { DishId, TenantId } from "../types";
import type { DishName } from "../value-objects";

/**
 * Domain contract for persisting and retrieving Dish aggregates.
 *
 * No SQL. No Supabase. No DTOs. No business rules.
 *
 * @see docs/13-repositories/DishRepository.md
 * @see docs/13-repositories/REPOSITORY_GUIDELINES.md
 */
export interface DishRepository {
  /** Persist a Dish (insert or update). */
  save(dish: Dish): Promise<void>;

  /** Find a non-archived Dish by id within the Organization. */
  findById(tenantId: TenantId, id: DishId): Promise<Dish | null>;

  /**
   * Whether a Dish with this name already exists in the Organization.
   * Uniqueness policy is enforced by Application — not here.
   */
  existsByName(tenantId: TenantId, name: DishName): Promise<boolean>;

  /** List non-archived Dishes for the Organization, stable name order. */
  listNotArchived(tenantId: TenantId): Promise<Dish[]>;

  /** Find by id including archived (restore / history). */
  findByIdIncludingArchived(
    tenantId: TenantId,
    id: DishId,
  ): Promise<Dish | null>;

  /**
   * Physical delete — exceptional only (SaaS Admin via Application).
   * Never a substitute for domain `archive` + `save`.
   */
  purge(tenantId: TenantId, id: DishId): Promise<void>;
}
