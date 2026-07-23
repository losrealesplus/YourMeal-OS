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
  weekStart: string;
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
    const list = byDate.get(slot.day_date) ?? [];
    list.push(dish);
    byDate.set(slot.day_date, list);
  }

  const days = utcWeekDates(menu.week_start).map((dayDate) => ({
    dayDate,
    dishes: byDate.get(dayDate) ?? [],
  }));

  return {
    id: menu.id,
    weekStart: menu.week_start,
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
