import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { AuditService } from "@/services/audit-service";
import { PUBLISH_OUT_OF_WEEK_MESSAGE, WeeklyMenuService } from "./weekly-menu-service";

const getById = vi.fn();
const listSlotsWithDishes = vi.fn();
const addSlot = vi.fn();
const addSlots = vi.fn();
const removeSlot = vi.fn();
const archive = vi.fn();
const deleteMenu = vi.fn();
const publish = vi.fn();
const unpublish = vi.fn();
const getSlotById = vi.fn();
const updateSlotDayDate = vi.fn();
const listActive = vi.fn();
const findByWeekStart = vi.fn();
const insertDraft = vi.fn();

vi.mock("@/services/audit-service", () => ({
  AuditService: { write: vi.fn(async () => {}) },
}));

vi.mock("@/modules/dish-library/infrastructure/dish-repository", () => ({
  createDishRepository: () => ({ listActive }),
}));

vi.mock("@/modules/weekly-menu/infrastructure/weekly-menu-repository", () => ({
  createWeeklyMenuRepository: () => ({
    getById,
    listSlotsWithDishes,
    addSlot,
    addSlots,
    removeSlot,
    archive,
    deleteMenu,
    publish,
    unpublish,
    getSlotById,
    updateSlotDayDate,
    listAll: vi.fn(),
    findByWeekStart,
    insertDraft,
    findPublishedByWeekStart: vi.fn(),
  }),
}));

function ctx(roles: ServiceContext["roles"] = ["company_admin"]): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "u1",
    tenantId: "t1",
    roles,
    capabilities: new Set(["menus.read", "menus.write"]) as ServiceContext["capabilities"],
  };
}

function readOnlyCtx(): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "u1",
    tenantId: "t1",
    roles: ["kitchen"], // kitchen only has menus.read, not menus.write in standard matrix unless admin
    capabilities: new Set(["menus.read"]) as ServiceContext["capabilities"],
  };
}

const menuDraft = {
  id: "m1",
  tenant_id: "t1",
  week_start: "2026-08-10",
  status: "draft",
  published_at: null,
  deleted_at: null,
};

const menuPublished = {
  ...menuDraft,
  status: "published",
  published_at: "2026-08-10T13:17:44Z",
};

const menuArchived = {
  ...menuDraft,
  status: "archived",
};

describe("WeeklyMenuService integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listActive.mockResolvedValue([{ id: "d1" }]);
  });

  describe("addDishToDay & publish & unpublish", () => {
    it("T3: addDishToDay rejects day_date outside week", async () => {
      getById.mockResolvedValue(menuDraft);
      await expect(
        WeeklyMenuService.addDishToDay(ctx(), {
          weeklyMenuId: "m1",
          dayDate: "2026-08-03",
          dishId: "dish-1",
        }),
      ).rejects.toBeInstanceOf(DomainError);
      expect(addSlot).not.toHaveBeenCalled();
    });

    it("T4: publish rejects out-of-week slots with admin message", async () => {
      getById.mockResolvedValue(menuDraft);
      listSlotsWithDishes.mockResolvedValue([
        {
          id: "s1",
          weekly_menu_id: "m1",
          tenant_id: "t1",
          day_date: "2026-08-03",
          dish_id: "dish-1",
          sort_order: 0,
          dishes: { id: "dish-1", deleted_at: null, status: "active" },
        },
      ]);
      await expect(WeeklyMenuService.publish(ctx(), "m1")).rejects.toMatchObject({
        message: PUBLISH_OUT_OF_WEEK_MESSAGE,
      });
      expect(publish).not.toHaveBeenCalled();
    });

    it("T5: publish allows all in-week slots", async () => {
      getById.mockResolvedValue(menuDraft);
      listSlotsWithDishes.mockResolvedValue([
        {
          id: "s1",
          weekly_menu_id: "m1",
          tenant_id: "t1",
          day_date: "2026-08-10",
          dish_id: "dish-1",
          sort_order: 0,
          dishes: { id: "dish-1", deleted_at: null, status: "active" },
        },
      ]);
      publish.mockResolvedValue(menuPublished);
      const result = await WeeklyMenuService.publish(ctx(), "m1");
      expect(result.status).toBe("published");
      expect(publish).toHaveBeenCalledWith("m1");
    });

    it("T6: unpublish + reassignSlotDay moves slot into week", async () => {
      getById.mockResolvedValue(menuPublished);
      unpublish.mockResolvedValue(menuDraft);
      const draft = await WeeklyMenuService.unpublish(ctx(), "m1");
      expect(draft.status).toBe("draft");

      getSlotById.mockResolvedValue({
        id: "s1",
        weekly_menu_id: "m1",
        tenant_id: "t1",
        day_date: "2026-08-03",
        dish_id: "dish-1",
        sort_order: 0,
      });
      getById.mockResolvedValue(menuDraft);
      updateSlotDayDate.mockResolvedValue({
        id: "s1",
        weekly_menu_id: "m1",
        tenant_id: "t1",
        day_date: "2026-08-10",
        dish_id: "dish-1",
        sort_order: 0,
      });

      const updated = await WeeklyMenuService.reassignSlotDay(ctx(), {
        slotId: "s1",
        dayDate: "2026-08-10",
      });
      expect(updated.day_date).toBe("2026-08-10");
      expect(updateSlotDayDate).toHaveBeenCalledWith("s1", "2026-08-10");
    });
  });

  describe("removeSlot", () => {
    it("successfully removes slot from a draft menu and emits delete audit", async () => {
      const slot = {
        id: "s1",
        weekly_menu_id: "m1",
        tenant_id: "t1",
        day_date: "2026-08-10",
        dish_id: "dish-1",
        sort_order: 0,
      };
      getSlotById.mockResolvedValue(slot);
      getById.mockResolvedValue(menuDraft);
      removeSlot.mockResolvedValue(undefined);

      const res = await WeeklyMenuService.removeSlot(ctx(), "s1");
      expect(res).toEqual({ id: "s1", weeklyMenuId: "m1" });
      expect(removeSlot).toHaveBeenCalledWith("s1");
      expect(AuditService.write).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          entityType: "weekly_menu_slot",
          entityId: "s1",
          action: "purge",
          oldData: slot,
        }),
      );
    });

    it("rejects non-existent slot with NOT_FOUND", async () => {
      getSlotById.mockResolvedValue(null);
      await expect(WeeklyMenuService.removeSlot(ctx(), "missing")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      expect(removeSlot).not.toHaveBeenCalled();
    });

    it("rejects slot removal when menu is published", async () => {
      getSlotById.mockResolvedValue({ id: "s1", weekly_menu_id: "m1" });
      getById.mockResolvedValue(menuPublished);
      await expect(WeeklyMenuService.removeSlot(ctx(), "s1")).rejects.toMatchObject({
        code: "INVALID_STATE",
      });
      expect(removeSlot).not.toHaveBeenCalled();
    });

    it("rejects slot removal when menu is archived", async () => {
      getSlotById.mockResolvedValue({ id: "s1", weekly_menu_id: "m1" });
      getById.mockResolvedValue(menuArchived);
      await expect(WeeklyMenuService.removeSlot(ctx(), "s1")).rejects.toMatchObject({
        code: "INVALID_STATE",
      });
      expect(removeSlot).not.toHaveBeenCalled();
    });

    it("requires menus.write capability", async () => {
      await expect(WeeklyMenuService.removeSlot(readOnlyCtx(), "s1")).rejects.toBeInstanceOf(
        DomainError,
      );
    });
  });

  describe("archiveMenu", () => {
    it("successfully archives a draft menu and emits status_change audit", async () => {
      getById.mockResolvedValue(menuDraft);
      archive.mockResolvedValue(menuArchived);

      const res = await WeeklyMenuService.archiveMenu(ctx(), "m1");
      expect(res.status).toBe("archived");
      expect(archive).toHaveBeenCalledWith("m1");
      expect(AuditService.write).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          entityType: "weekly_menu",
          entityId: "m1",
          action: "status_change",
          newData: menuArchived,
        }),
      );
    });

    it("rejects non-existent menu with NOT_FOUND", async () => {
      getById.mockResolvedValue(null);
      await expect(WeeklyMenuService.archiveMenu(ctx(), "missing")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      expect(archive).not.toHaveBeenCalled();
    });

    it("rejects archiving a published menu directly", async () => {
      getById.mockResolvedValue(menuPublished);
      await expect(WeeklyMenuService.archiveMenu(ctx(), "m1")).rejects.toMatchObject({
        code: "INVALID_STATE",
      });
      expect(archive).not.toHaveBeenCalled();
    });

    it("rejects archiving an already archived menu", async () => {
      getById.mockResolvedValue(menuArchived);
      await expect(WeeklyMenuService.archiveMenu(ctx(), "m1")).rejects.toMatchObject({
        code: "INVALID_STATE",
      });
      expect(archive).not.toHaveBeenCalled();
    });

    it("requires menus.write capability", async () => {
      await expect(WeeklyMenuService.archiveMenu(readOnlyCtx(), "m1")).rejects.toBeInstanceOf(
        DomainError,
      );
    });
  });

  describe("duplicateWeek", () => {
    it("successfully duplicates slots from source menu into target week with date mapping", async () => {
      const sourceMenu = {
        id: "m-source",
        tenant_id: "t1",
        week_start: "2026-08-10",
        status: "published",
      };
      const sourceSlots = [
        {
          id: "s1",
          weekly_menu_id: "m-source",
          tenant_id: "t1",
          day_date: "2026-08-10", // Monday
          dish_id: "dish-1",
          sort_order: 0,
          dishes: { id: "dish-1", name: "Dish 1" },
        },
        {
          id: "s2",
          weekly_menu_id: "m-source",
          tenant_id: "t1",
          day_date: "2026-08-12", // Wednesday
          dish_id: "dish-2",
          sort_order: 1,
          dishes: { id: "dish-2", name: "Dish 2" },
        },
      ];

      getById.mockResolvedValue(sourceMenu);
      findByWeekStart.mockResolvedValue(null);
      listSlotsWithDishes.mockResolvedValue(sourceSlots);

      const targetDraft = {
        id: "m-target",
        tenant_id: "t1",
        week_start: "2026-08-17",
        status: "draft",
      };
      insertDraft.mockResolvedValue(targetDraft);
      addSlots.mockResolvedValue([]);

      const result = await WeeklyMenuService.duplicateWeek(ctx(), {
        sourceMenuId: "m-source",
        targetWeekStart: "2026-08-17",
      });

      expect(result.id).toBe("m-target");
      expect(insertDraft).toHaveBeenCalledWith("2026-08-17");
      expect(addSlots).toHaveBeenCalledWith([
        {
          weeklyMenuId: "m-target",
          dayDate: "2026-08-17", // Monday -> Monday
          dishId: "dish-1",
          sortOrder: 0,
        },
        {
          weeklyMenuId: "m-target",
          dayDate: "2026-08-19", // Wednesday -> Wednesday
          dishId: "dish-2",
          sortOrder: 1,
        },
      ]);
      expect(AuditService.write).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          entityType: "weekly_menu",
          entityId: "m-target",
          action: "create",
        }),
      );
    });

    it("rejects invalid Monday ISO target date", async () => {
      await expect(
        WeeklyMenuService.duplicateWeek(ctx(), {
          sourceMenuId: "m-source",
          targetWeekStart: "2026-08-11", // Tuesday, not Monday
        }),
      ).rejects.toMatchObject({
        code: "INVALID_STATE",
      });
    });

    it("rejects when source and target weeks are identical", async () => {
      getById.mockResolvedValue({
        id: "m-source",
        week_start: "2026-08-10",
        status: "draft",
      });
      await expect(
        WeeklyMenuService.duplicateWeek(ctx(), {
          sourceMenuId: "m-source",
          targetWeekStart: "2026-08-10",
        }),
      ).rejects.toMatchObject({
        code: "INVALID_STATE",
      });
    });

    it("rejects when target week already has an active menu", async () => {
      getById.mockResolvedValue({
        id: "m-source",
        week_start: "2026-08-10",
        status: "draft",
      });
      findByWeekStart.mockResolvedValue({
        id: "m-existing",
        week_start: "2026-08-17",
        status: "draft",
      });
      await expect(
        WeeklyMenuService.duplicateWeek(ctx(), {
          sourceMenuId: "m-source",
          targetWeekStart: "2026-08-17",
        }),
      ).rejects.toMatchObject({
        code: "INVALID_STATE",
      });
    });

    it("rejects when source menu is archived", async () => {
      getById.mockResolvedValue({
        id: "m-source",
        week_start: "2026-08-10",
        status: "archived",
      });
      await expect(
        WeeklyMenuService.duplicateWeek(ctx(), {
          sourceMenuId: "m-source",
          targetWeekStart: "2026-08-17",
        }),
      ).rejects.toMatchObject({
        code: "INVALID_STATE",
      });
    });

    it("cleans up orphan target draft menu if slot insertion fails", async () => {
      getById.mockResolvedValue({
        id: "m-source",
        week_start: "2026-08-10",
        status: "published",
      });
      findByWeekStart.mockResolvedValue(null);
      listSlotsWithDishes.mockResolvedValue([
        {
          id: "s1",
          weekly_menu_id: "m-source",
          day_date: "2026-08-10",
          dish_id: "dish-1",
          sort_order: 0,
        },
      ]);
      insertDraft.mockResolvedValue({
        id: "m-orphan",
        week_start: "2026-08-17",
        status: "draft",
      });
      addSlots.mockRejectedValue(new Error("DB slot insert failed"));
      deleteMenu.mockResolvedValue(undefined);

      await expect(
        WeeklyMenuService.duplicateWeek(ctx(), {
          sourceMenuId: "m-source",
          targetWeekStart: "2026-08-17",
        }),
      ).rejects.toThrow("DB slot insert failed");

      expect(deleteMenu).toHaveBeenCalledWith("m-orphan");
    });

    it("requires menus.write capability", async () => {
      await expect(
        WeeklyMenuService.duplicateWeek(readOnlyCtx(), {
          sourceMenuId: "m-source",
          targetWeekStart: "2026-08-17",
        }),
      ).rejects.toBeInstanceOf(DomainError);
    });
  });
});
