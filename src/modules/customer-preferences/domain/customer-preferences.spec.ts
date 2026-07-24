import { describe, expect, it } from "vitest";
import {
  actionsForPreference,
  selectSuggestedDishes,
  SUGGESTION_MIN_ORDERS,
} from "./customer-preferences";

describe("customer preferences domain", () => {
  it("hides add_to_order when dish is not on this week's menu", () => {
    expect(
      actionsForPreference({
        source: "explicit",
        availableThisWeek: false,
      }),
    ).toEqual(["view_nutrition", "remove_favorite"]);
  });

  it("offers add_to_order and add_favorite for available suggestions", () => {
    expect(
      actionsForPreference({
        source: "suggested",
        availableThisWeek: true,
      }),
    ).toEqual(["view_nutrition", "add_to_order", "add_favorite"]);
  });

  it("suggests frequent dishes but never includes already favorited ones", () => {
    const suggested = selectSuggestedDishes({
      favoritedDishIds: new Set(["fav"]),
      frequencies: [
        { dishId: "fav", orderCount: 20, totalQty: 40 },
        { dishId: "a", orderCount: SUGGESTION_MIN_ORDERS, totalQty: 5 },
        { dishId: "b", orderCount: 2, totalQty: 10 },
        { dishId: "c", orderCount: 8, totalQty: 12 },
      ],
    });
    expect(suggested.map((s) => s.dishId)).toEqual(["c", "a"]);
  });
});
