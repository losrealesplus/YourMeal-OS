import { invalidState } from "@/domain/errors";
import { DishStatus } from "./dish-status";

/** Current Postgres enum — may lag domain until migration. */
export type DbDishStatus = "draft" | "active" | "archived";

/**
 * Read mapping from persistence into domain language.
 * `inactive` is domain-only until schema supports it explicitly.
 */
export function dishStatusFromDb(db: DbDishStatus): DishStatus {
  return DishStatus.from(db);
}

/**
 * Write mapping from domain to current persistence.
 * `inactive` cannot be persisted on the legacy enum without an ADR/migration.
 */
export function dishStatusToDb(status: DishStatus): DbDishStatus {
  if (status.isInactive()) {
    throw invalidState(
      "DishStatus.inactive cannot be persisted until dish_status supports inactive",
    );
  }

  return status.toString() as DbDishStatus;
}
