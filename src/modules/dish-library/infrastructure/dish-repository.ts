import type { Json, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import type { AppSupabase } from "@/services/types";

export type DishRow = Tables<"dishes">;

/**
 * Persistence only — no business rules.
 * @see docs/10-api/README.md
 */
export function createDishRepository(supabase: AppSupabase, tenantId: string) {
  return {
    async listActive(): Promise<DishRow[]> {
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DishRow[];
    },

    async findActiveById(id: string): Promise<DishRow | null> {
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data as DishRow | null;
    },

    async findByIdIncludingArchived(id: string): Promise<DishRow | null> {
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as DishRow | null;
    },

    async insert(row: TablesInsert<"dishes">): Promise<DishRow> {
      const { data, error } = await supabase
        .from("dishes")
        .insert(row)
        .select("*")
        .single();
      if (error) throw error;
      return data as DishRow;
    },

    async update(id: string, patch: TablesUpdate<"dishes">): Promise<DishRow> {
      const { data, error } = await supabase
        .from("dishes")
        .update(patch)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select("*")
        .single();
      if (error) throw error;
      return data as DishRow;
    },

    /** Hard delete — only called from Service.purge after capability check. */
    async hardDelete(id: string): Promise<void> {
      const { error } = await supabase
        .from("dishes")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (error) throw error;
    },
  };
}

export type DishRepository = ReturnType<typeof createDishRepository>;

export type { Json };
