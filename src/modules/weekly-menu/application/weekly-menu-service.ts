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
  isValidMondayIso,
} from "@/modules/weekly-menu/application/week-dates";
import { canComposeWeeklyMenu, canPublishWeeklyMenu } from "@/modules/bootstrap-integrity";
import { createDishRepository } from "@/modules/dish-library/infrastructure/dish-repository";

export const PUBLISH_OUT_OF_WEEK_MESSAGE =
  "El menú contiene un plato asignado a un día fuera de la semana seleccionada. Corrige el día antes de publicar.";

async function activeDishCount(ctx: ServiceContext): Promise<number> {
  const dishes = await createDishRepository(ctx.supabase, ctx.tenantId).listActive();
  return dishes.length;
}

function assertDayDateInWeek(weekStart: string | null, dayDate: string): void {
  if (!weekStart) return;
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

  async ensureDraft(ctx: ServiceContext, weekStart?: string): Promise<WeeklyMenuRow> {
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

  async listSlots(ctx: ServiceContext, weeklyMenuId: string): Promise<WeeklyMenuSlotWithDish[]> {
    requireCapability(ctx.roles, "menus.read");
    return createWeeklyMenuRepository(ctx.supabase, ctx.tenantId).listSlotsWithDishes(weeklyMenuId);
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
  async unpublish(ctx: ServiceContext, weeklyMenuId: string): Promise<WeeklyMenuRow> {
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
    // Template menus (week_start null) use day_of_week — skip calendar boundary check
    if (menu.week_start != null) {
      const outOfWeek = slots.filter((s) => s.day_date != null && !isDayDateInWeek(menu.week_start!, s.day_date));
      if (outOfWeek.length > 0) {
        throw new DomainError("INVALID_STATE", PUBLISH_OUT_OF_WEEK_MESSAGE);
      }
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

  async removeSlot(
    ctx: ServiceContext,
    slotId: string,
  ): Promise<{ id: string; weeklyMenuId: string }> {
    requireCapability(ctx.roles, "menus.write");
    const repo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
    const slot = await repo.getSlotById(slotId);
    if (!slot) {
      throw new DomainError("NOT_FOUND", "Menu slot not found");
    }
    const menu = await repo.getById(slot.weekly_menu_id);
    if (!menu) {
      throw new DomainError("NOT_FOUND", "Weekly menu not found");
    }
    if (menu.status !== "draft") {
      throw new DomainError(
        "INVALID_STATE",
        "Solo se pueden eliminar platos de un menú en borrador",
      );
    }
    await repo.removeSlot(slotId);
    await AuditService.write(ctx, {
      entityType: "weekly_menu_slot",
      entityId: slotId,
      action: "purge",
      oldData: slot as unknown as Record<string, unknown>,
    });
    return { id: slotId, weeklyMenuId: slot.weekly_menu_id };
  },

  async archiveMenu(ctx: ServiceContext, weeklyMenuId: string): Promise<WeeklyMenuRow> {
    requireCapability(ctx.roles, "menus.write");
    const repo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
    const menu = await repo.getById(weeklyMenuId);
    if (!menu) {
      throw new DomainError("NOT_FOUND", "Weekly menu not found");
    }
    if (menu.status === "archived") {
      throw new DomainError("INVALID_STATE", "El menú ya está archivado");
    }
    if (menu.status === "published") {
      throw new DomainError(
        "INVALID_STATE",
        "No se puede archivar un menú publicado directamente. Ábrelo para editar primero.",
      );
    }
    if (menu.status !== "draft") {
      throw new DomainError("INVALID_STATE", "Solo se pueden archivar menús en borrador");
    }
    const archived = await repo.archive(weeklyMenuId);
    await AuditService.write(ctx, {
      entityType: "weekly_menu",
      entityId: weeklyMenuId,
      action: "status_change",
      oldData: menu as unknown as Record<string, unknown>,
      newData: archived as unknown as Record<string, unknown>,
    });
    return archived;
  },

  async duplicateWeek(
    ctx: ServiceContext,
    input: {
      sourceMenuId: string;
      targetWeekStart: string;
    },
  ): Promise<WeeklyMenuRow> {
    requireCapability(ctx.roles, "menus.write");
    if (!isValidMondayIso(input.targetWeekStart)) {
      throw new DomainError(
        "INVALID_STATE",
        "La semana de destino debe ser un lunes válido (YYYY-MM-DD)",
      );
    }
    const repo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
    const sourceMenu = await repo.getById(input.sourceMenuId);
    if (!sourceMenu) {
      throw new DomainError("NOT_FOUND", "Menú de origen no encontrado");
    }
    if (sourceMenu.status === "archived") {
      throw new DomainError("INVALID_STATE", "No se puede duplicar un menú archivado");
    }
    if (sourceMenu.week_start === input.targetWeekStart) {
      throw new DomainError(
        "INVALID_STATE",
        "La semana de origen y destino no pueden ser la misma",
      );
    }
    const existingTarget = await repo.findByWeekStart(input.targetWeekStart);
    if (existingTarget && existingTarget.status !== "archived") {
      throw new DomainError(
        "INVALID_STATE",
        `Ya existe un menú activo para la semana ${input.targetWeekStart}`,
      );
    }
    const dishesOk = canComposeWeeklyMenu({
      activeDishCount: await activeDishCount(ctx),
    });
    if (!dishesOk.ok) {
      throw new DomainError("INVALID_STATE", dishesOk.message, {
        code: dishesOk.code,
      });
    }

    const sourceSlots = await repo.listSlotsWithDishes(input.sourceMenuId);
    if (!sourceMenu.week_start) {
      throw new DomainError("INVALID_STATE", "El menú de origen es una plantilla relativa y no puede duplicarse como menú con fecha. Usa la función de programación de plantillas.");
    }
    const sourceDates = utcWeekDates(sourceMenu.week_start);
    const targetDates = utcWeekDates(input.targetWeekStart);

    const createdMenu = await repo.insertDraft(input.targetWeekStart);

    try {
      if (sourceSlots.length > 0) {
      const slotsToInsert = sourceSlots.map((s) => {
          const dayIdx = s.day_date != null ? sourceDates.indexOf(s.day_date) : -1;
          const targetDay = dayIdx >= 0 ? targetDates[dayIdx]! : input.targetWeekStart;
          return {
            weeklyMenuId: createdMenu.id,
            dayDate: targetDay,
            dishId: s.dish_id,
            sortOrder: s.sort_order,
          };
        });
        await repo.addSlots(slotsToInsert);
      }
    } catch (err) {
      // Safe cleanup of orphan target to protect integrity
      await repo.deleteMenu(createdMenu.id).catch(() => {});
      throw err;
    }

    await AuditService.write(ctx, {
      entityType: "weekly_menu",
      entityId: createdMenu.id,
      action: "create",
      newData: createdMenu as unknown as Record<string, unknown>,
    });

    return createdMenu;
  },
};
