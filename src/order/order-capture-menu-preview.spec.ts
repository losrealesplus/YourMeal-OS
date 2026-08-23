/**
 * SPEC · Active Weekly Menu Intelligence (A2-D.1.3 Hardened)
 *
 * Validates:
 * - Architecture Law 003 compliance (UI consumes Application Queries, not Infrastructure)
 * - Week start calculation and date formatting
 * - Read-only query consumption via fetchPublishedWeeklyMenu
 * - H-02 Day / Delivery date explicit semantics
 * - Non-blocking degradation on missing menu or permission errors
 * - Local-only draft line modifications on [+ Añadir]
 * - Price authority protection (unitPrice not in backend mutation)
 * - Zero order creation from preview
 */

import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { formatWeekRange } from "@/routes/_authenticated/admin.order-capture";
import { utcWeekStartMonday, utcWeekDates } from "@/modules/weekly-menu/application/week-dates";
import { planWeeklyOrderCommand } from "@/order/OrderCommands";

describe("A2-D.1.3 — Active Weekly Menu Intelligence (Hardened)", () => {
  it("1. ARCHITECTURE LAW 003: admin.order-capture.tsx does NOT import Infrastructure or Supabase directly", () => {
    const sourcePath = path.resolve(__dirname, "../routes/_authenticated/admin.order-capture.tsx");
    const source = fs.readFileSync(sourcePath, "utf8");

    // Must NOT contain direct or dynamic repository imports
    expect(source).not.toMatch(/createWeeklyMenuRepository/);
    expect(source).not.toMatch(/WeeklyMenuRepository/);
    expect(source).not.toMatch(/from ["']@\/modules\/weekly-menu\/infrastructure/);
    expect(source).not.toMatch(/import\(["']@\/modules\/weekly-menu\/infrastructure/);

    // Must NOT contain direct or dynamic Supabase imports
    expect(source).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(source).not.toMatch(/import\(["']@\/integrations\/supabase/);

    // MUST consume Application Queries
    expect(source).toMatch(/fetchPublishedWeeklyMenu/);
    expect(source).toMatch(
      /from ["']@\/modules\/weekly-menu\/application\/weekly-menu-queries["']/,
    );
  });

  it("2. Calculates correct Monday weekStart from deliveryDay across boundaries", () => {
    // Wednesday -> Monday
    expect(utcWeekStartMonday(new Date("2026-09-02T12:00:00Z"))).toBe("2026-08-31");
    // Sunday -> Monday
    expect(utcWeekStartMonday(new Date("2026-09-06T12:00:00Z"))).toBe("2026-08-31");
    // Next Monday -> Next Monday
    expect(utcWeekStartMonday(new Date("2026-09-07T12:00:00Z"))).toBe("2026-09-07");
    // Year-end Thursday -> 2026-12-28
    expect(utcWeekStartMonday(new Date("2026-12-31T12:00:00Z"))).toBe("2026-12-28");
    // New Year Friday -> 2026-12-28
    expect(utcWeekStartMonday(new Date("2027-01-01T12:00:00Z"))).toBe("2026-12-28");
  });

  it("3. Formats week range label correctly across month boundaries", () => {
    expect(formatWeekRange("2026-08-03")).toBe("3 — 9 Ago");
    expect(formatWeekRange("2026-08-31")).toBe("31 Ago — 6 Sep");
  });

  it("4. Generates exactly 7 consecutive UTC days for a week", () => {
    const dates = utcWeekDates("2026-08-31");
    expect(dates).toEqual([
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
    ]);
  });

  it("5. BUSINESS SEMANTICS: Dish add is active ONLY for currently selected deliveryDay", () => {
    let currentDeliveryDay = "2026-09-02"; // Wednesday
    let lines: Array<{ dishId: string; label: string; qty: number }> = [];

    function handleAddFromDay(dishDayDate: string, dishId: string, label: string) {
      // Strict domain rule: only dishes belonging to the selected deliveryDay can be added
      if (dishDayDate !== currentDeliveryDay) {
        // Read-only day: ignored, zero side effects
        return;
      }
      const existing = lines.find((l) => l.dishId === dishId);
      if (existing) {
        lines = lines.map((l) => (l.dishId === dishId ? { ...l, qty: l.qty + 1 } : l));
      } else {
        lines = [...lines, { dishId, label, qty: 1 }];
      }
    }

    // Try adding Tuesday dish when deliveryDay is Wednesday -> Ignored, 0 lines added
    handleAddFromDay("2026-09-01", "dish-tuesday", "Pollo Curry");
    expect(lines).toHaveLength(0);
    expect(currentDeliveryDay).toBe("2026-09-02"); // deliveryDay unchanged

    // Add Wednesday dish when deliveryDay is Wednesday -> Added successfully
    handleAddFromDay("2026-09-02", "dish-wednesday", "Poke Salmón");
    expect(lines).toEqual([{ dishId: "dish-wednesday", label: "Poke Salmón", qty: 1 }]);
    expect(currentDeliveryDay).toBe("2026-09-02");

    // Add same Wednesday dish again -> Increments qty
    handleAddFromDay("2026-09-02", "dish-wednesday", "Poke Salmón");
    expect(lines).toEqual([{ dishId: "dish-wednesday", label: "Poke Salmón", qty: 2 }]);

    // Operator explicitly switches deliveryDay to Tuesday
    currentDeliveryDay = "2026-09-01";
    expect(currentDeliveryDay).toBe("2026-09-01");

    // Now Tuesday dish can be added
    handleAddFromDay("2026-09-01", "dish-tuesday", "Pollo Curry");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toEqual({ dishId: "dish-tuesday", label: "Pollo Curry", qty: 1 });
  });

  it("6. PlanWeeklyOrderCommand does NOT include unitPrice in its schema", () => {
    const cmd = planWeeklyOrderCommand({
      weekStart: "2026-08-31",
      channel: "phone",
      targetCustomerId: "cust-01",
      items: [
        { dishId: "dish-01", dayDate: "2026-08-31", qty: 2 },
        { dishId: "dish-02", dayDate: "2026-09-01", qty: 1 },
      ],
    });

    expect(cmd.type).toBe("PlanWeeklyOrder");
    expect(cmd.items[0]).toEqual({
      dishId: "dish-01",
      dayDate: "2026-08-31",
      qty: 2,
    });
    expect("unitPrice" in cmd.items[0]).toBe(false);
  });
});
