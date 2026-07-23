import type { Tables } from "@/integrations/supabase/types";
import type { AppSupabase } from "@/services/types";

export type WeeklyMenuRow = Tables<"weekly_menus">;
export type WeeklyMenuSlotRow = Tables<"weekly_menu_slots">;
export type DishRow = Tables<"dishes">;

export type WeeklyMenuSlotWithDish = WeeklyMenuSlotRow & {
  dishes: DishRow | null;
};

/**
 * Persistence only — no business rules beyond published offer read (CAP-003).
 * @see docs/17-operational-model (Weekly Menu · Menu Slot · Dish)
 */
export function createWeeklyMenuRepository(supabase: AppSupabase, tenantId: string) {
  return {
    async findPublishedByWeekStart(weekStart: string): Promise<WeeklyMenuRow | null> {
      const { data, error } = await supabase
        .from("weekly_menus")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("week_start", weekStart)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data as WeeklyMenuRow | null;
    },

    async listSlotsWithDishes(weeklyMenuId: string): Promise<WeeklyMenuSlotWithDish[]> {
      const { data, error } = await supabase
        .from("weekly_menu_slots")
        .select("*, dishes(*)")
        .eq("tenant_id", tenantId)
        .eq("weekly_menu_id", weeklyMenuId)
        .order("day_date", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as WeeklyMenuSlotWithDish[];
    },
  };
}

export type WeeklyMenuRepository = ReturnType<typeof createWeeklyMenuRepository>;
