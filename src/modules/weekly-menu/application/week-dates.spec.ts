import { describe, expect, it } from "vitest";
import { isDayDateInWeek, utcWeekDates } from "./week-dates";

describe("isDayDateInWeek", () => {
  it("accepts dates inside week_start..+6", () => {
    const weekStart = "2026-08-10";
    const days = utcWeekDates(weekStart);
    expect(days).toHaveLength(7);
    for (const d of days) {
      expect(isDayDateInWeek(weekStart, d)).toBe(true);
    }
  });

  it("rejects day_date before week_start (known bug pattern)", () => {
    expect(isDayDateInWeek("2026-08-10", "2026-08-03")).toBe(false);
  });

  it("rejects day_date after week_start+6", () => {
    expect(isDayDateInWeek("2026-08-10", "2026-08-17")).toBe(false);
  });
});
