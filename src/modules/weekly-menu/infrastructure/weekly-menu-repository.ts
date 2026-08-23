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
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data as WeeklyMenuRow | null;
    },

    /** OP-001 · Bootstrap: list all non-deleted menus for admin planning. */
    async listAll(): Promise<WeeklyMenuRow[]> {
      const { data, error } = await supabase
        .from("weekly_menus")
        .select("*")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("week_start", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WeeklyMenuRow[];
    },

    async getById(id: string): Promise<WeeklyMenuRow | null> {
      const { data, error } = await supabase
        .from("weekly_menus")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data as WeeklyMenuRow | null;
    },

    async findByWeekStart(weekStart: string): Promise<WeeklyMenuRow | null> {
      const { data, error } = await supabase
        .from("weekly_menus")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("week_start", weekStart)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data as WeeklyMenuRow | null;
    },

    async insertDraft(weekStart: string): Promise<WeeklyMenuRow> {
      const { data, error } = await supabase
        .from("weekly_menus")
        .insert({
          tenant_id: tenantId,
          week_start: weekStart,
          status: "draft",
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as WeeklyMenuRow;
    },

    async publish(id: string): Promise<WeeklyMenuRow> {
      const { data, error } = await supabase
        .from("weekly_menus")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as WeeklyMenuRow;
    },

    async unpublish(id: string): Promise<WeeklyMenuRow> {
      const { data, error } = await supabase
        .from("weekly_menus")
        .update({
          status: "draft",
          published_at: null,
        })
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as WeeklyMenuRow;
    },

    async addSlot(input: {
      weeklyMenuId: string;
      dayDate: string;
      dishId: string;
      sortOrder?: number;
    }): Promise<WeeklyMenuSlotRow> {
      const { data, error } = await supabase
        .from("weekly_menu_slots")
        .insert({
          tenant_id: tenantId,
          weekly_menu_id: input.weeklyMenuId,
          day_date: input.dayDate,
          dish_id: input.dishId,
          sort_order: input.sortOrder ?? 0,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as WeeklyMenuSlotRow;
    },

    async updateSlotDayDate(slotId: string, dayDate: string): Promise<WeeklyMenuSlotRow> {
      const { data, error } = await supabase
        .from("weekly_menu_slots")
        .update({ day_date: dayDate })
        .eq("tenant_id", tenantId)
        .eq("id", slotId)
        .select("*")
        .single();
      if (error) throw error;
      return data as WeeklyMenuSlotRow;
    },

    async getSlotById(slotId: string): Promise<WeeklyMenuSlotRow | null> {
      const { data, error } = await supabase
        .from("weekly_menu_slots")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", slotId)
        .maybeSingle();
      if (error) throw error;
      return data as WeeklyMenuSlotRow | null;
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
      // Soft-deleted dishes excluded; slots without an active dish are dropped by mapper/service.
      return ((data ?? []) as WeeklyMenuSlotWithDish[]).filter((slot) => !slot.dishes?.deleted_at);
    },

    async removeSlot(slotId: string): Promise<void> {
      const { error } = await supabase
        .from("weekly_menu_slots")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", slotId);
      if (error) throw error;
    },

    async archive(id: string): Promise<WeeklyMenuRow> {
      const { data, error } = await supabase
        .from("weekly_menus")
        .update({
          status: "archived",
        })
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as WeeklyMenuRow;
    },

    async addSlots(
      slots: Array<{
        weeklyMenuId: string;
        dayDate: string;
        dishId: string;
        sortOrder?: number;
      }>,
    ): Promise<WeeklyMenuSlotRow[]> {
      if (slots.length === 0) return [];
      const { data, error } = await supabase
        .from("weekly_menu_slots")
        .insert(
          slots.map((s) => ({
            tenant_id: tenantId,
            weekly_menu_id: s.weeklyMenuId,
            day_date: s.dayDate,
            dish_id: s.dishId,
            sort_order: s.sortOrder ?? 0,
          })),
        )
        .select("*");
      if (error) throw error;
      return (data ?? []) as WeeklyMenuSlotRow[];
    },

    async deleteMenu(id: string): Promise<void> {
      const { error } = await supabase
        .from("weekly_menus")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
      if (error) throw error;
    },
  };
}

export type WeeklyMenuRepository = ReturnType<typeof createWeeklyMenuRepository>;
