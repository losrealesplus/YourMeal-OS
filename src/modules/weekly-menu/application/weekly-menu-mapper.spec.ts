import { describe, expect, it } from "vitest";
import { utcWeekDates, utcWeekStartMonday } from "./week-dates";
import { mapWeeklyMenuToView } from "./weekly-menu-mapper";
import type { Tables } from "@/integrations/supabase/types";
import type { WeeklyMenuRow, WeeklyMenuSlotWithDish } from "../infrastructure/weekly-menu-repository";

type DishRow = Tables<"dishes">;

describe("utcWeekStartMonday", () => {
  it("returns Monday for a Wednesday", () => {
    // 2026-07-22 is Wednesday UTC
    expect(utcWeekStartMonday(new Date("2026-07-22T12:00:00Z"))).toBe("2026-07-20");
  });

  it("returns same day when already Monday", () => {
    expect(utcWeekStartMonday(new Date("2026-07-20T08:00:00Z"))).toBe("2026-07-20");
  });

  it("maps Sunday back to previous Monday", () => {
    expect(utcWeekStartMonday(new Date("2026-07-26T08:00:00Z"))).toBe("2026-07-20");
  });
});

describe("utcWeekDates", () => {
  it("returns seven consecutive dates", () => {
    expect(utcWeekDates("2026-07-20")).toEqual([
      "2026-07-20",
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
      "2026-07-25",
      "2026-07-26",
    ]);
  });
});

function dish(id: string, status: DishRow["status"] = "active"): DishRow {
  return {
    id,
    tenant_id: "t1",
    name: `Dish ${id}`,
    description: null,
    photo_url: null,
    kcal: 100,
    macros: {},
    allergens: [],
    tags: [],
    status,
    category_id: "c1",
    recipe_id: null,
    cost: 0,
    price: 0,
    prep_minutes: null,
    prep_instructions: null,
    weight_g: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    deleted_at: null,
    deleted_by: null,
  };
}

describe("mapWeeklyMenuToView", () => {
  it("groups active dishes by day_date and fills empty days", () => {
    const menu = {
      id: "m1",
      tenant_id: "t1",
      week_start: "2026-07-20",
      status: "published",
      published_at: "2026-07-19T00:00:00Z",
    } satisfies WeeklyMenuRow;

    const slots: WeeklyMenuSlotWithDish[] = [
      {
        id: "s1",
        tenant_id: "t1",
        weekly_menu_id: "m1",
        day_date: "2026-07-20",
        dish_id: "d1",
        sort_order: 0,
        dishes: dish("d1"),
      },
      {
        id: "s2",
        tenant_id: "t1",
        weekly_menu_id: "m1",
        day_date: "2026-07-20",
        dish_id: "d2",
        sort_order: 1,
        dishes: dish("d2", "draft"),
      },
      {
        id: "s3",
        tenant_id: "t1",
        weekly_menu_id: "m1",
        day_date: "2026-07-22",
        dish_id: "d3",
        sort_order: 0,
        dishes: dish("d3"),
      },
    ];

    const view = mapWeeklyMenuToView(menu, slots);
    expect(view.days).toHaveLength(7);
    expect(view.days[0].dishes.map((d) => d.id)).toEqual(["d1"]);
    expect(view.days[2].dishes.map((d) => d.id)).toEqual(["d3"]);
    expect(view.days[1].dishes).toEqual([]);
  });

  it("T7: out-of-week slot is discarded; in-week slot is visible to Customer", () => {
    const menu = {
      id: "m1",
      tenant_id: "t1",
      week_start: "2026-08-10",
      status: "published",
      published_at: "2026-08-10T13:17:44Z",
    } satisfies WeeklyMenuRow;

    const slots: WeeklyMenuSlotWithDish[] = [
      {
        id: "bad",
        tenant_id: "t1",
        weekly_menu_id: "m1",
        day_date: "2026-08-03",
        dish_id: "d-bad",
        sort_order: 0,
        dishes: dish("d-bad"),
      },
      {
        id: "ok",
        tenant_id: "t1",
        weekly_menu_id: "m1",
        day_date: "2026-08-10",
        dish_id: "d-ok",
        sort_order: 0,
        dishes: { ...dish("d-ok"), name: "Visible" },
      },
    ];

    const view = mapWeeklyMenuToView(menu, slots);
    const allIds = view.days.flatMap((d) => d.dishes.map((x) => x.id));
    expect(allIds).toEqual(["d-ok"]);
    expect(view.days[0]?.dishes[0]?.name).toBe("Visible");
  });
});
