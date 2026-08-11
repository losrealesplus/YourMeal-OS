/**
 * Weekly Menu application service — OP-001 bootstrap write path.
 * Read path for customers remains CAP-003 queries.
 *
 * Integrity (Minimum Indispensable):
 * - addDishToDay asserts day_date ∈ week_start..+6
 * - publish rejects any out-of-week slot (no silent auto-fix)
 * - unpublish + reassignSlotDay allow Admin repair of published menus
 */
import { requireCapability } from "@/permissions";
import { DomainError } from "@/domain/errors";
import { AuditService } from "@/services/audit-service";
import type { ServiceContext } from "@/services/types";
import {
  createWeeklyMenuRepository,
  type WeeklyMenuRow,
  type WeeklyMenuSlotRow,
  type WeeklyMenuSlotWithDish,
} from "@/modules/weekly-menu/infrastructure/weekly-menu-repository";
import {
  utcWeekDates,
  utcWeekStartMonday,
  isDayDateInWeek,
} from "@/modules/weekly-menu/application/week-dates";
import {
  canComposeWeeklyMenu,
  canPublishWeeklyMenu,
} from "@/modules/bootstrap-integrity";
import { createDishRepository } from "@/modules/dish-library/infrastructure/dish-repository";

export const PUBLISH_OUT_OF_WEEK_MESSAGE =
  "El menú contiene un plato asignado a un día fuera de la semana seleccionada. Corrige el día antes de publicar.";

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
    if (menu.status === "published") {
      throw new DomainError(
        "INVALID_STATE",
        "El menú está publicado. Ábrelo para editar antes de añadir platos.",
      );
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

  /**
   * Reassign an existing slot to a day inside the menu week.
   * Menu must be draft (use unpublish first). Does not invent dates.
   */
  async reassignSlotDay(
    ctx: ServiceContext,
    input: { slotId: string; dayDate: string },
  ): Promise<WeeklyMenuSlotRow> {
    requireCapability(ctx.roles, "menus.write");
    const repo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
    const slot = await repo.getSlotById(input.slotId);
    if (!slot) {
      throw new DomainError("NOT_FOUND", "Menu slot not found");
    }
    const menu = await repo.getById(slot.weekly_menu_id);
    if (!menu) {
      throw new DomainError("NOT_FOUND", "Weekly menu not found");
    }
    if (menu.status === "published") {
      throw new DomainError(
        "INVALID_STATE",
        "El menú está publicado. Ábrelo para editar antes de corregir el día.",
      );
    }
    assertDayDateInWeek(menu.week_start, input.dayDate);
    const updated = await repo.updateSlotDayDate(input.slotId, input.dayDate);
    await AuditService.write(ctx, {
      entityType: "weekly_menu_slot",
      entityId: updated.id,
      action: "update",
      newData: updated as unknown as Record<string, unknown>,
    });
    return updated;
  },

  /** published → draft so Admin can repair slots / republish. */
  async unpublish(
    ctx: ServiceContext,
    weeklyMenuId: string,
  ): Promise<WeeklyMenuRow> {
    requireCapability(ctx.roles, "menus.write");
    const repo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
    const menu = await repo.getById(weeklyMenuId);
    if (!menu) {
      throw new DomainError("NOT_FOUND", "Weekly menu not found");
    }
    if (menu.status !== "published") {
      throw new DomainError("INVALID_STATE", "El menú no está publicado");
    }
    const draft = await repo.unpublish(weeklyMenuId);
    await AuditService.write(ctx, {
      entityType: "weekly_menu",
      entityId: weeklyMenuId,
      action: "status_change",
      newData: draft as unknown as Record<string, unknown>,
    });
    return draft;
  },

  async publish(ctx: ServiceContext, weeklyMenuId: string): Promise<WeeklyMenuRow> {
    requireCapability(ctx.roles, "menus.write");
    const repo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
    const menu = await repo.getById(weeklyMenuId);
    if (!menu) {
      throw new DomainError("NOT_FOUND", "Weekly menu not found");
    }
    const slots = await repo.listSlotsWithDishes(weeklyMenuId);
    const outOfWeek = slots.filter(
      (s) => !isDayDateInWeek(menu.week_start, s.day_date),
    );
    if (outOfWeek.length > 0) {
      throw new DomainError("INVALID_STATE", PUBLISH_OUT_OF_WEEK_MESSAGE);
    }
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
