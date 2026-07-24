/**
 * EP-002A.3 — Customer Preferences / Favoritos (pure helpers).
 * Explicit favorites vs frequency-based suggestions (never auto-hearted).
 */

export type PreferenceSource = "explicit" | "suggested";

export type PreferenceAction =
  | "view_nutrition"
  | "add_to_order"
  | "remove_favorite"
  | "add_favorite";

export type DishFrequency = {
  dishId: string;
  orderCount: number;
  totalQty: number;
};

export type PreferenceDishBase = {
  dishId: string;
  source: PreferenceSource;
  /** Times ordered (suggestions); null for explicit-only without history */
  orderCount: number | null;
  availableThisWeek: boolean;
  /** First day on published menu this week, if available */
  availableDayDate: string | null;
};

/** High-frequency threshold for suggesting (not auto-marking). */
export const SUGGESTION_MIN_ORDERS = 3;

export function actionsForPreference(input: {
  source: PreferenceSource;
  availableThisWeek: boolean;
}): PreferenceAction[] {
  const actions: PreferenceAction[] = ["view_nutrition"];
  if (input.availableThisWeek) {
    actions.push("add_to_order");
  }
  if (input.source === "explicit") {
    actions.push("remove_favorite");
  } else {
    actions.push("add_favorite");
  }
  return actions;
}

/**
 * Rank history by total qty, exclude already-favorited dishes,
 * keep only those meeting the suggestion threshold.
 */
export function selectSuggestedDishes(input: {
  frequencies: readonly DishFrequency[];
  favoritedDishIds: ReadonlySet<string>;
  limit?: number;
}): DishFrequency[] {
  const limit = input.limit ?? 8;
  return [...input.frequencies]
    .filter(
      (f) =>
        f.orderCount >= SUGGESTION_MIN_ORDERS &&
        !input.favoritedDishIds.has(f.dishId),
    )
    .sort((a, b) => {
      if (b.totalQty !== a.totalQty) return b.totalQty - a.totalQty;
      return b.orderCount - a.orderCount;
    })
    .slice(0, limit);
}

export function availableDayForDish(
  dishId: string,
  offerByDish: ReadonlyMap<string, readonly string[]>,
): string | null {
  const days = offerByDish.get(dishId);
  if (!days || days.length === 0) return null;
  return [...days].sort()[0] ?? null;
}
