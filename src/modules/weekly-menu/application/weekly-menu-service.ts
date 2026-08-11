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
import { utcWeekDates, utcWeekStartMonday, isDayDateInWeek } from "@/modules/weekly-menu/application/week-dates";
import {
  canComposeWeeklyMenu,
  canPublishWeeklyMenu,
} from "@/modules/bootstrap-integrity";
import { createDishRepository } from "@/modules/dish-library/infrastructure/dish-repository";

async function activeDishCount(ctx: ServiceContext): Promise<number> {
  const dishes = await createDishRepository(ctx.supabase, ctx.tenantId).listActive();
  return dishes.length;
}

function assertDayDateInWeek(weekStart: string, dayDate: string): void {
  if (!isDayDateInWeek(weekStart, dayDate)) {
    const allowed = utcWeekDates(weekStart);
    throw new DomainError(
      "INVALID_STATE",
      `day_date ${dayDate} is outside week_start ${weekStart}..${allowed[6] ?? weekStart}`,
    );
  }
}

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
    const dishesOk = canComposeWeeklyMenu({
      activeDishCount: await activeDishCount(ctx),
    });
    if (!dishesOk.ok) {
      throw new DomainError("INVALID_STATE", dishesOk.message, {
        code: dishesOk.code,
      });
    }
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
    const menu = await repo.getById(input.weeklyMenuId);
    if (!menu) {
      throw new DomainError("NOT_FOUND", "Weekly menu not found");
    }
    assertDayDateInWeek(menu.week_start, input.dayDate);
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
    const publishOk = canPublishWeeklyMenu({
      slotCount: slots.length,
      activeDishCount: await activeDishCount(ctx),
    });
    if (!publishOk.ok) {
      throw new DomainError("INVALID_STATE", publishOk.message, {
        code: publishOk.code,
      });
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
