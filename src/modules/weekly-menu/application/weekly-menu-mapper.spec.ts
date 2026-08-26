import { describe, expect, it } from "vitest";
import { utcWeekDates, utcWeekStartMonday } from "./week-dates";
import { mapWeeklyMenuToView } from "./weekly-menu-mapper";
import type { Tables } from "@/integrations/supabase/types";
import type {
  WeeklyMenuRow,
  WeeklyMenuSlotWithDish,
} from "../infrastructure/weekly-menu-repository";

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

function mockMenu(overrides: Partial<WeeklyMenuRow> = {}): WeeklyMenuRow {
  return {
    id: "m1",
    tenant_id: "t1",
    week_start: "2026-07-20",
    status: "published",
    published_at: "2026-07-19T00:00:00Z",
    deleted_at: null,
    relative_week: null,
    menu_type: "scheduled",
    internal_go_live_date: null,
    customer_go_live_date: null,
    ...overrides,
  };
}

function mockSlot(overrides: Partial<WeeklyMenuSlotWithDish> = {}): WeeklyMenuSlotWithDish {
  return {
    id: "s1",
    tenant_id: "t1",
    weekly_menu_id: "m1",
    day_date: "2026-07-20",
    day_of_week: null,
    dish_id: "d1",
    sort_order: 0,
    dishes: dish("d1"),
    ...overrides,
  };
}

describe("mapWeeklyMenuToView", () => {
  it("groups active dishes by day_date and fills empty days", () => {
    const menu = mockMenu();

    const slots: WeeklyMenuSlotWithDish[] = [
      mockSlot({ id: "s1", day_date: "2026-07-20", dish_id: "d1", sort_order: 0, dishes: dish("d1") }),
      mockSlot({ id: "s2", day_date: "2026-07-20", dish_id: "d2", sort_order: 1, dishes: dish("d2", "draft") }),
      mockSlot({ id: "s3", day_date: "2026-07-22", dish_id: "d3", sort_order: 0, dishes: dish("d3") }),
    ];

    const view = mapWeeklyMenuToView(menu, slots);
    expect(view.days).toHaveLength(7);
    expect(view.days[0].dishes.map((d) => d.id)).toEqual(["d1"]);
    expect(view.days[2].dishes.map((d) => d.id)).toEqual(["d3"]);
    expect(view.days[1].dishes).toEqual([]);
  });

  it("T7: out-of-week slot is discarded; in-week slot is visible to Customer", () => {
    const menu = mockMenu({ week_start: "2026-08-10", published_at: "2026-08-10T13:17:44Z" });

    const slots: WeeklyMenuSlotWithDish[] = [
      mockSlot({
        id: "bad",
        day_date: "2026-08-03",
        dish_id: "d-bad",
        dishes: dish("d-bad"),
      }),
      mockSlot({
        id: "ok",
        day_date: "2026-08-10",
        dish_id: "d-ok",
        dishes: { ...dish("d-ok"), name: "Visible" },
      }),
    ];

    const view = mapWeeklyMenuToView(menu, slots);
    const allIds = view.days.flatMap((d) => d.dishes.map((x) => x.id));
    expect(allIds).toEqual(["d-ok"]);
    expect(view.days[0]?.dishes[0]?.name).toBe("Visible");
  });

  it("maps template menus with relative_week and day_of_week", () => {
    const templateMenu = mockMenu({
      week_start: null,
      relative_week: 1,
      menu_type: "template",
    });

    const slots: WeeklyMenuSlotWithDish[] = [
      mockSlot({
        id: "t1",
        day_date: null,
        day_of_week: 1,
        dish_id: "d1",
        dishes: dish("d1"),
      }),
      mockSlot({
        id: "t2",
        day_date: null,
        day_of_week: 3,
        dish_id: "d3",
        dishes: dish("d3"),
      }),
    ];

    const view = mapWeeklyMenuToView(templateMenu, slots);
    expect(view.menuType).toBe("template");
    expect(view.relativeWeek).toBe(1);
    expect(view.weekStart).toBeNull();
    expect(view.days).toHaveLength(5);
    expect(view.days[0].dishes.map((d) => d.id)).toEqual(["d1"]);
    expect(view.days[2].dishes.map((d) => d.id)).toEqual(["d3"]);
    expect(view.days[1].dishes).toEqual([]);
  });
});
