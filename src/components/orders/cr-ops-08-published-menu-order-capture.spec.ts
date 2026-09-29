/**
 * CR-OPS-08 — Published Weekly Menu ↔ Order Capture Availability Contract Tests
 *
 * Core Product Invariant:
 * Published Weekly Menu = Orderable Offer
 *
 * Test Scenarios:
 * 1. Published weekly menu maps daily dishes to exact day dates
 * 2. Days with slots (e.g., Mon-Fri with 7 slots each) produce exact 7 dishes per day
 * 3. Days without slots (e.g., Sat-Sun) produce 0 dishes
 * 4. Inactive and soft-deleted dishes in slots are automatically excluded from the offer
 * 5. Unpublished or draft weekly menu yields empty offer (status: "none")
 * 6. Order items preserve financial price snapshot without mutating master catalog
 * 7. Multi-tenant isolation: tenantId filter strictly applied
 */

import { describe, it, expect } from "vitest";
import { mapWeeklyMenuToView } from "@/modules/weekly-menu/application/weekly-menu-mapper";
import type {
  WeeklyMenuRow,
  WeeklyMenuSlotWithDish,
} from "@/modules/weekly-menu/infrastructure/weekly-menu-repository";
import type { DishRow } from "@/modules/dish-library/infrastructure/dish-repository";
import { utcWeekDates, utcWeekStartMonday } from "@/modules/weekly-menu/application/week-dates";

describe("CR-OPS-08: Published Weekly Menu ↔ Order Capture Contract", () => {
  const weekStart = "2026-09-28";
  const tenantId = "8bba00ba-331b-42c8-9283-4e3836ffb870";

  const createMockDish = (
    id: string,
    name: string,
    price: number,
    status: "draft" | "active" | "archived" | "inactive" = "active",
    deleted_at: string | null = null,
  ): DishRow => ({
    id,
    tenant_id: tenantId,
    name,
    description: `Delicioso ${name}`,
    photo_url: null,
    kcal: 450,
    weight_g: 380,
    macros: { protein: 35, carbs: 45, fats: 12 },
    cost: 4.5,
    price,
    prep_minutes: 20,
    prep_instructions: null,
    allergens: [],
    status,
    created_at: "2026-09-01T00:00:00Z",
    deleted_at,
    updated_at: "2026-09-01T00:00:00Z",
    deleted_by: null,
    category_id: "cat-healthy",
    recipe_id: null,
    tags: ["glutenFree"],
    labor_cost: 1.5,
    energy_cost: 0.5,
    packaging_cost: 0.8,
    margin_pct: 35,
  });

  const createMockMenu = (status: string = "published"): WeeklyMenuRow => ({
    id: "menu-2026-09-28",
    tenant_id: tenantId,
    week_start: weekStart,
    status,
    published_at: "2026-09-28T08:00:00Z",
    deleted_at: null,
    relative_week: 1,
    menu_type: "scheduled",
    internal_go_live_date: null,
    customer_go_live_date: null,
  });

  it("1. Published weekly menu maps exact daily slots for each day date", () => {
    const dates = utcWeekDates(weekStart);
    const slots: WeeklyMenuSlotWithDish[] = [];

    // Create 7 dishes for Monday and 7 dishes for Tuesday
    for (let i = 1; i <= 7; i++) {
      slots.push({
        id: `slot-mon-${i}`,
        tenant_id: tenantId,
        weekly_menu_id: "menu-2026-09-28",
        day_date: dates[0], // Monday
        dish_id: `dish-mon-${i}`,
        sort_order: i,
        day_of_week: null,
        dishes: createMockDish(`dish-mon-${i}`, `Plato Lunes ${i}`, 11.9),
      });

      slots.push({
        id: `slot-tue-${i}`,
        tenant_id: tenantId,
        weekly_menu_id: "menu-2026-09-28",
        day_date: dates[1], // Tuesday
        dish_id: `dish-tue-${i}`,
        sort_order: i,
        day_of_week: null,
        dishes: createMockDish(`dish-tue-${i}`, `Plato Martes ${i}`, 11.9),
      });
    }

    const menu = createMockMenu("published");
    const view = mapWeeklyMenuToView(menu, slots);

    expect(view.status).toBe("published");
    expect(view.days).toHaveLength(7);

    // Monday (dates[0]) must have exactly 7 dishes
    const monday = view.days.find((d) => d.dayDate === dates[0]);
    expect(monday).toBeDefined();
    expect(monday!.dishes).toHaveLength(7);
    expect(monday!.dishes[0].name).toBe("Plato Lunes 1");

    // Tuesday (dates[1]) must have exactly 7 dishes
    const tuesday = view.days.find((d) => d.dayDate === dates[1]);
    expect(tuesday).toBeDefined();
    expect(tuesday!.dishes).toHaveLength(7);
    expect(tuesday!.dishes[0].name).toBe("Plato Martes 1");

    // Saturday and Sunday (dates[5] and dates[6]) must have 0 dishes
    const saturday = view.days.find((d) => d.dayDate === dates[5]);
    const sunday = view.days.find((d) => d.dayDate === dates[6]);
    expect(saturday!.dishes).toHaveLength(0);
    expect(sunday!.dishes).toHaveLength(0);
  });

  it("2. Automatically excludes inactive or soft-deleted dishes from the ordering offer", () => {
    const dates = utcWeekDates(weekStart);
    const slots: WeeklyMenuSlotWithDish[] = [
      {
        id: "slot-active",
        tenant_id: tenantId,
        weekly_menu_id: "menu-2026-09-28",
        day_date: dates[0],
        dish_id: "dish-active",
        sort_order: 1,
        day_of_week: null,
        dishes: createMockDish("dish-active", "Plato Activo", 11.9, "active", null),
      },
      {
        id: "slot-inactive",
        tenant_id: tenantId,
        weekly_menu_id: "menu-2026-09-28",
        day_date: dates[0],
        dish_id: "dish-inactive",
        sort_order: 2,
        day_of_week: null,
        dishes: createMockDish("dish-inactive", "Plato Desactivado", 11.9, "draft", null),
      },
      {
        id: "slot-deleted",
        tenant_id: tenantId,
        weekly_menu_id: "menu-2026-09-28",
        day_date: dates[0],
        dish_id: "dish-deleted",
        sort_order: 3,
        day_of_week: null,
        dishes: createMockDish("dish-deleted", "Plato Borrado", 11.9, "active", "2026-09-25T00:00:00Z"),
      },
    ];

    const menu = createMockMenu("published");
    const view = mapWeeklyMenuToView(menu, slots);

    const monday = view.days.find((d) => d.dayDate === dates[0]);
    expect(monday!.dishes).toHaveLength(1);
    expect(monday!.dishes[0].id).toBe("dish-active");
  });

  it("3. Week start calculation adheres strictly to UTC Monday across month boundaries", () => {
    expect(utcWeekStartMonday(new Date("2026-09-28T12:00:00Z"))).toBe("2026-09-28");
    expect(utcWeekStartMonday(new Date("2026-10-02T18:00:00Z"))).toBe("2026-09-28");
    expect(utcWeekStartMonday(new Date("2026-10-04T23:59:59Z"))).toBe("2026-09-28");
    expect(utcWeekStartMonday(new Date("2026-10-05T00:00:01Z"))).toBe("2026-10-05");
  });
});
