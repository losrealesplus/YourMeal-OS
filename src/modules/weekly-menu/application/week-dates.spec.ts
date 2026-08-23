import { describe, expect, it } from "vitest";
import {
  isDayDateInWeek,
  utcWeekDates,
  isValidMondayIso,
  offsetWeekMonday,
  formatDayDateEs,
  formatWeekRangeEs,
} from "./week-dates";

describe("week-dates calendar helpers", () => {
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

  it("validates Monday ISO strings correctly", () => {
    expect(isValidMondayIso("2026-08-24")).toBe(true); // Monday
    expect(isValidMondayIso("2026-08-25")).toBe(false); // Tuesday
    expect(isValidMondayIso("invalid")).toBe(false);
    expect(isValidMondayIso("2026-02-30")).toBe(false);
  });

  it("calculates offset week Mondays accurately", () => {
    expect(offsetWeekMonday("2026-08-24", -1)).toBe("2026-08-17");
    expect(offsetWeekMonday("2026-08-24", 1)).toBe("2026-08-31");
    expect(offsetWeekMonday("2026-08-24", 0)).toBe("2026-08-24");
  });

  it("formats day dates in Spanish with day name and date", () => {
    const res = formatDayDateEs("2026-08-24");
    expect(res.dayName).toBe("Lunes");
    expect(res.formattedDate).toBe("24 ago");
  });

  it("formats week ranges in Spanish", () => {
    expect(formatWeekRangeEs("2026-08-24")).toBe("24 — 30 ago 2026");
  });
});
