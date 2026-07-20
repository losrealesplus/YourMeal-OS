/** Dish lifecycle helpers — see docs/12-domain-model/STATE_MACHINES.md */

export const DISH_STATES = ["draft", "published", "archived"] as const;
export type DishState = (typeof DISH_STATES)[number];

/** Map DB dish_status ↔ ubiquitous language */
export function toUbiquitousDishState(
  db: "draft" | "active" | "archived",
): DishState {
  if (db === "active") return "published";
  return db;
}

export function toDbDishStatus(
  state: DishState,
): "draft" | "active" | "archived" {
  if (state === "published") return "active";
  return state;
}
