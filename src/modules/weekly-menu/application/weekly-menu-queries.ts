import { supabase } from "@/integrations/supabase/client";
import { createWeeklyMenuRepository } from "../infrastructure/weekly-menu-repository";
import { utcWeekStartMonday } from "./week-dates";
import {
  emptyWeeklyMenuView,
  mapWeeklyMenuToView,
  type WeeklyMenuView,
} from "./weekly-menu-mapper";

export const weeklyMenuKeys = {
  all: (tenantId: string) => ["weekly-menu", tenantId] as const,
  current: (tenantId: string, weekStart: string) =>
    [...weeklyMenuKeys.all(tenantId), "published", weekStart] as const,
};

/**
 * CAP-003 — read published Weekly Menu for the current UTC week.
 * Customer path uses RLS + tenant membership (menus.read capability exists;
 * this path does not invent staff-only gates).
 */
export async function fetchPublishedWeeklyMenu(
  tenantId: string,
  weekStart: string = utcWeekStartMonday(),
): Promise<WeeklyMenuView> {
  const repo = createWeeklyMenuRepository(supabase, tenantId);
  const menu = await repo.findPublishedByWeekStart(weekStart);
  if (!menu) return emptyWeeklyMenuView(weekStart);

  const slots = await repo.listSlotsWithDishes(menu.id);
  return mapWeeklyMenuToView(menu, slots);
}
