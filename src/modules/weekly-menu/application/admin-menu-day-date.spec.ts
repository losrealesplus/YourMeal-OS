import { describe, expect, it } from "vitest";
import { resolveDayDateForWeek } from "./admin-menu-day-date";
import { utcWeekDates } from "./week-dates";

describe("resolveDayDateForWeek (Admin dayDate integrity)", () => {
  it("T1: stale dayDate from prior week is reset to week_start", () => {
    expect(resolveDayDateForWeek("2026-08-10", "2026-08-03")).toBe("2026-08-10");
  });

  it("T2: only week days are valid selections; in-week day is preserved", () => {
    const week = utcWeekDates("2026-08-10");
    expect(week).toEqual([
      "2026-08-10",
      "2026-08-11",
      "2026-08-12",
      "2026-08-13",
      "2026-08-14",
      "2026-08-15",
      "2026-08-16",
    ]);
    expect(resolveDayDateForWeek("2026-08-10", "2026-08-12")).toBe("2026-08-12");
    expect(resolveDayDateForWeek("2026-08-10", "2026-08-17")).toBe("2026-08-10");
    expect(resolveDayDateForWeek("2026-08-10", null)).toBe("2026-08-10");
  });
});
