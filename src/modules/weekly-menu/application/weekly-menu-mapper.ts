import type { CatalogDish } from "@/modules/dish-library/application/dish-catalog-mapper";
import { mapDishRowToCatalogDish } from "@/modules/dish-library/application/dish-catalog-mapper";
import { utcWeekDates } from "./week-dates";
import type {
  WeeklyMenuRow,
  WeeklyMenuSlotWithDish,
} from "../infrastructure/weekly-menu-repository";

export type WeeklyMenuDayView = {
  dayDate: string;
  dishes: CatalogDish[];
};

export type WeeklyMenuView = {
  id: string;
  weekStart: string | null;
  relativeWeek?: number | null;
  menuType?: string;
  status: string;
  days: WeeklyMenuDayView[];
};

/**
 * CAP-003 — project published Weekly Menu + slots into the DayPicker contract.
 * No selection, stock, promotions, or order rules.
 */
export function mapWeeklyMenuToView(
  menu: WeeklyMenuRow,
  slots: WeeklyMenuSlotWithDish[],
): WeeklyMenuView {
  const byDate = new Map<string, CatalogDish[]>();

  for (const slot of slots) {
    if (!slot.dishes) continue;
    if (slot.dishes.deleted_at) continue;
    if (slot.dishes.status !== "active") continue;

    const dish = mapDishRowToCatalogDish(slot.dishes);
    const key = slot.day_date ?? (slot.day_of_week != null ? String(slot.day_of_week) : "");
    if (!key) continue;
    const list = byDate.get(key) ?? [];
    list.push(dish);
    byDate.set(key, list);
  }

  const days = menu.week_start != null
    ? utcWeekDates(menu.week_start).map((dayDate) => ({
        dayDate,
        dishes: byDate.get(dayDate) ?? [],
      }))
    : [1, 2, 3, 4, 5].map((dow) => ({
        dayDate: `Day ${dow}`,
        dishes: byDate.get(String(dow)) ?? [],
      }));

  return {
    id: menu.id,
    weekStart: menu.week_start,
    relativeWeek: menu.relative_week,
    menuType: menu.menu_type,
    status: menu.status,
    days,
  };
}

export function emptyWeeklyMenuView(weekStart: string): WeeklyMenuView {
  return {
    id: "",
    weekStart,
    status: "none",
    days: utcWeekDates(weekStart).map((dayDate) => ({ dayDate, dishes: [] })),
  };
}
