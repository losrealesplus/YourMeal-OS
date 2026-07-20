import type { Json, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { AuditService } from "./audit-service";
import type { DishCreateInput, DishUpdateInput, ServiceContext } from "./types";

type DishRow = Tables<"dishes">;

function toInsert(tenantId: string, input: DishCreateInput): TablesInsert<"dishes"> {
  return {
    tenant_id: tenantId,
    name: input.name.trim(),
    description: input.description ?? null,
    photo_url: input.photoUrl ?? null,
    kcal: input.kcal ?? null,
    weight_g: input.weightG ?? null,
    macros: (input.macros ?? {}) as Json,
    cost: input.cost ?? 0,
    price: input.price ?? 0,
    prep_minutes: input.prepMinutes ?? null,
    prep_instructions: input.prepInstructions ?? null,
    allergens: input.allergens ?? [],
    status: input.status ?? "draft",
  };
}

/**
 * Dish Library — heart of the domain model.
 * UI must call this Service; never encode dish rules in components.
 * @see docs/12-domain-model/README.md
 */
export const DishService = {
  async list(ctx: ServiceContext, opts?: { includeDeleted?: boolean }) {
    let query = ctx.supabase
      .from("dishes")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .order("name", { ascending: true });

    if (!opts?.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    const { data, error } = await query;
    if (error) throw new Error(`DishService.list failed: ${error.message}`);
    return (data ?? []) as DishRow[];
  },

  async get(ctx: ServiceContext, id: string) {
    const { data, error } = await ctx.supabase
      .from("dishes")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw new Error(`DishService.get failed: ${error.message}`);
    return data as DishRow | null;
  },

  async create(ctx: ServiceContext, input: DishCreateInput) {
    if (!input.name?.trim()) {
      throw new Error("DishService.create: name is required");
    }

    const payload = toInsert(ctx.tenantId, input);
    const { data, error } = await ctx.supabase
      .from("dishes")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw new Error(`DishService.create failed: ${error.message}`);

    const dish = data as DishRow;
    await AuditService.write(ctx, {
      entityType: "dish",
      entityId: dish.id,
      action: "create",
      newData: dish as unknown as Record<string, unknown>,
    });

    return dish;
  },

  async update(ctx: ServiceContext, id: string, input: DishUpdateInput) {
    const existing = await DishService.get(ctx, id);
    if (!existing) throw new Error("DishService.update: dish not found");

    const patch: TablesUpdate<"dishes"> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.description !== undefined) patch.description = input.description;
    if (input.photoUrl !== undefined) patch.photo_url = input.photoUrl;
    if (input.kcal !== undefined) patch.kcal = input.kcal;
    if (input.weightG !== undefined) patch.weight_g = input.weightG;
    if (input.macros !== undefined) patch.macros = input.macros as Json;
    if (input.cost !== undefined) patch.cost = input.cost;
    if (input.price !== undefined) patch.price = input.price;
    if (input.prepMinutes !== undefined) patch.prep_minutes = input.prepMinutes;
    if (input.prepInstructions !== undefined) {
      patch.prep_instructions = input.prepInstructions;
    }
    if (input.allergens !== undefined) patch.allergens = input.allergens;
    if (input.status !== undefined) patch.status = input.status;

    const { data, error } = await ctx.supabase
      .from("dishes")
      .update(patch)
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) throw new Error(`DishService.update failed: ${error.message}`);

    const dish = data as DishRow;
    await AuditService.write(ctx, {
      entityType: "dish",
      entityId: id,
      action: input.status && input.status !== existing.status ? "status_change" : "update",
      oldData: existing as unknown as Record<string, unknown>,
      newData: dish as unknown as Record<string, unknown>,
    });

    return dish;
  },

  /** Soft delete — never hard-delete business records from app flows. */
  async softDelete(ctx: ServiceContext, id: string) {
    const existing = await DishService.get(ctx, id);
    if (!existing) throw new Error("DishService.softDelete: dish not found");

    const deletedAt = new Date().toISOString();
    const { data, error } = await ctx.supabase
      .from("dishes")
      .update({ deleted_at: deletedAt, status: "archived" })
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) throw new Error(`DishService.softDelete failed: ${error.message}`);

    const dish = data as DishRow;
    await AuditService.write(ctx, {
      entityType: "dish",
      entityId: id,
      action: "soft_delete",
      oldData: existing as unknown as Record<string, unknown>,
      newData: dish as unknown as Record<string, unknown>,
    });

    return dish;
  },
};
