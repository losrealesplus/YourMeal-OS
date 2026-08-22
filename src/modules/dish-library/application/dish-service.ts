import type { Json, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { AuditService } from "@/services/audit-service";
import type { DishCreateInput, DishUpdateInput, ServiceContext } from "@/services/types";
import { requireCapability } from "@/permissions";
import { dishNotFound, DomainError, invalidState } from "@/domain/errors";
import {
  createDishRepository,
  type DishRow,
} from "@/modules/dish-library/infrastructure/dish-repository";

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
 * Dish Library application service — business rules only.
 * Persistence via DishRepository. Never exposes delete(); use archive/restore/purge.
 */
export const DishService = {
  async list(ctx: ServiceContext) {
    requireCapability(ctx.roles, "dishes.read");
    return createDishRepository(ctx.supabase, ctx.tenantId).listActive();
  },

  async listArchived(ctx: ServiceContext) {
    requireCapability(ctx.roles, "dishes.read");
    return createDishRepository(ctx.supabase, ctx.tenantId).listArchived();
  },

  async get(ctx: ServiceContext, id: string) {
    requireCapability(ctx.roles, "dishes.read");
    const dish = await createDishRepository(ctx.supabase, ctx.tenantId).findActiveById(id);
    if (!dish) throw dishNotFound(id);
    return dish;
  },

  async create(ctx: ServiceContext, input: DishCreateInput) {
    requireCapability(ctx.roles, "dishes.create");
    if (!input.name?.trim()) {
      throw new DomainError("INVALID_STATE", "Dish name is required");
    }

    const repo = createDishRepository(ctx.supabase, ctx.tenantId);
    const dish = await repo.insert(toInsert(ctx.tenantId, input));

    await AuditService.write(ctx, {
      entityType: "dish",
      entityId: dish.id,
      action: "create",
      newData: dish as unknown as Record<string, unknown>,
    });

    return dish;
  },

  async update(ctx: ServiceContext, id: string, input: DishUpdateInput) {
    requireCapability(ctx.roles, "dishes.update");
    const repo = createDishRepository(ctx.supabase, ctx.tenantId);
    const existing = await repo.findActiveById(id);
    if (!existing) throw dishNotFound(id);

    const patch: TablesUpdate<"dishes"> = {};
    if (input.name !== undefined) {
      if (!input.name.trim()) throw invalidState("Dish name is required");
      patch.name = input.name.trim();
    }
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

    const dish = await repo.update(id, patch);

    await AuditService.write(ctx, {
      entityType: "dish",
      entityId: id,
      action: input.status && input.status !== existing.status ? "status_change" : "update",
      oldData: existing as unknown as Record<string, unknown>,
      newData: dish as unknown as Record<string, unknown>,
    });

    return dish;
  },

  /** Soft-retire. Never hard-deletes. */
  async archive(ctx: ServiceContext, id: string) {
    requireCapability(ctx.roles, "dishes.archive");
    const repo = createDishRepository(ctx.supabase, ctx.tenantId);
    const existing = await repo.findActiveById(id);
    if (!existing) throw dishNotFound(id);

    const deletedAt = new Date().toISOString();
    const dish = await repo.update(id, {
      deleted_at: deletedAt,
      deleted_by: ctx.userId,
      status: "archived",
    } as TablesUpdate<"dishes">);

    await AuditService.write(ctx, {
      entityType: "dish",
      entityId: id,
      action: "archive",
      oldData: existing as unknown as Record<string, unknown>,
      newData: dish as unknown as Record<string, unknown>,
    });

    return dish;
  },

  async restore(ctx: ServiceContext, id: string) {
    requireCapability(ctx.roles, "dishes.restore");
    const repo = createDishRepository(ctx.supabase, ctx.tenantId);
    const existing = await repo.findByIdIncludingArchived(id);
    if (!existing) throw dishNotFound(id);
    if (existing.deleted_at == null) {
      throw invalidState("Dish is not archived");
    }

    const dish = await repo.update(id, {
      deleted_at: null,
      deleted_by: null,
      status: "draft",
    } as TablesUpdate<"dishes">);

    await AuditService.write(ctx, {
      entityType: "dish",
      entityId: id,
      action: "restore",
      oldData: existing as unknown as Record<string, unknown>,
      newData: dish as unknown as Record<string, unknown>,
    });

    return dish;
  },

  /** Hard remove — SaaS Admin only. Prefer archive in normal flows. */
  async purge(ctx: ServiceContext, id: string) {
    requireCapability(ctx.roles, "dishes.purge");
    requireCapability(ctx.roles, "records.purge");
    const repo = createDishRepository(ctx.supabase, ctx.tenantId);
    const existing = await repo.findByIdIncludingArchived(id);
    if (!existing) throw dishNotFound(id);

    await AuditService.write(ctx, {
      entityType: "dish",
      entityId: id,
      action: "purge",
      oldData: existing as unknown as Record<string, unknown>,
    });

    await repo.hardDelete(id);
  },
};

export type { DishRow };
