import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import {
  PUBLISH_OUT_OF_WEEK_MESSAGE,
  WeeklyMenuService,
} from "./weekly-menu-service";

const getById = vi.fn();
const listSlotsWithDishes = vi.fn();
const addSlot = vi.fn();
const publish = vi.fn();
const unpublish = vi.fn();
const getSlotById = vi.fn();
const updateSlotDayDate = vi.fn();
const listActive = vi.fn();

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
    publish,
    unpublish,
    getSlotById,
    updateSlotDayDate,
    listAll: vi.fn(),
    findByWeekStart: vi.fn(),
    insertDraft: vi.fn(),
    findPublishedByWeekStart: vi.fn(),
  }),
}));

function ctx(): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "u1",
    tenantId: "t1",
    roles: ["company_admin"],
    capabilities: new Set(["menus.read", "menus.write"]) as ServiceContext["capabilities"],
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

describe("WeeklyMenuService integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listActive.mockResolvedValue([{ id: "d1" }]);
  });

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
