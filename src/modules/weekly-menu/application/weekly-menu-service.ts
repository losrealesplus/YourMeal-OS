/**
 * Weekly Menu application service — OP-001 bootstrap write path.
 * Read path for customers remains CAP-003 queries.
 */
import { requireCapability } from "@/permissions";
import { DomainError } from "@/domain/errors";
import { AuditService } from "@/services/audit-service";
import type { ServiceContext } from "@/services/types";
import {
  createWeeklyMenuRepository,
  type WeeklyMenuRow,
  type WeeklyMenuSlotWithDish,
} from "@/modules/weekly-menu/infrastructure/weekly-menu-repository";
import { utcWeekStartMonday } from "@/modules/weekly-menu/application/week-dates";

export const WeeklyMenuService = {
  async list(ctx: ServiceContext): Promise<WeeklyMenuRow[]> {
    requireCapability(ctx.roles, "menus.read");
    return createWeeklyMenuRepository(ctx.supabase, ctx.tenantId).listAll();
  },

  async ensureDraft(
    ctx: ServiceContext,
    weekStart?: string,
  ): Promise<WeeklyMenuRow> {
    requireCapability(ctx.roles, "menus.write");
    const start = weekStart ?? utcWeekStartMonday();
    const repo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
    const existing = await repo.findByWeekStart(start);
    if (existing) return existing;
    const created = await repo.insertDraft(start);
    await AuditService.write(ctx, {
      entityType: "weekly_menu",
      entityId: created.id,
      action: "create",
      newData: created as unknown as Record<string, unknown>,
    });
    return created;
  },

  async listSlots(
    ctx: ServiceContext,
    weeklyMenuId: string,
  ): Promise<WeeklyMenuSlotWithDish[]> {
    requireCapability(ctx.roles, "menus.read");
    return createWeeklyMenuRepository(ctx.supabase, ctx.tenantId).listSlotsWithDishes(
      weeklyMenuId,
    );
  },

  async addDishToDay(
    ctx: ServiceContext,
    input: { weeklyMenuId: string; dayDate: string; dishId: string },
  ) {
    requireCapability(ctx.roles, "menus.write");
    if (!input.dishId) {
      throw new DomainError("INVALID_STATE", "Dish is required");
    }
    const repo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
    const slot = await repo.addSlot(input);
    await AuditService.write(ctx, {
      entityType: "weekly_menu_slot",
      entityId: slot.id,
      action: "create",
      newData: slot as unknown as Record<string, unknown>,
    });
    return slot;
  },

  async publish(ctx: ServiceContext, weeklyMenuId: string): Promise<WeeklyMenuRow> {
    requireCapability(ctx.roles, "menus.write");
    const repo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
    const slots = await repo.listSlotsWithDishes(weeklyMenuId);
    if (slots.length === 0) {
      throw new DomainError(
        "INVALID_STATE",
        "Cannot publish an empty weekly menu — add at least one dish",
      );
    }
    const published = await repo.publish(weeklyMenuId);
    await AuditService.write(ctx, {
      entityType: "weekly_menu",
      entityId: weeklyMenuId,
      action: "status_change",
      newData: published as unknown as Record<string, unknown>,
    });
    return published;
  },
};
