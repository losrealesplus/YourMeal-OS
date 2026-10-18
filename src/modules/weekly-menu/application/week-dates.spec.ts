import { describe, expect, it } from "vitest";
import {
  isDayDateInWeek,
  utcWeekDates,
  isValidMondayIso,
  offsetWeekMonday,
  formatDayDateEs,
  formatWeekRangeEs,
  resolveTenantActiveWeek,
  getTenantScheduleConfig,
  isWeeklyOrderCutoffPassed,
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

  it.each([
    ["2026-09-28", "Lunes", "28 sep"],
    ["2026-10-04", "Domingo", "4 oct"],
    ["2026-10-05", "Lunes", "5 oct"],
    ["2026-12-31", "Jueves", "31 dic"],
    ["2027-01-03", "Domingo", "3 ene"],
  ])(
    "formats civil date %s independently of the local timezone",
    (date, dayName, formattedDate) => {
      expect(formatDayDateEs(date)).toEqual({ dayName, formattedDate });
    },
  );

  it("formats week ranges in Spanish", () => {
    expect(formatWeekRangeEs("2026-08-24")).toBe("24 — 30 ago 2026");
  });

  describe("resolveTenantActiveWeek (Weekly Cutoff & Active Dates)", () => {
    it("rolls over to next Monday when today is Sunday (Oct 18, 2026)", () => {
      // Sunday Oct 18, 2026 at 17:21 Canary time (UTC 16:21)
      const now = new Date("2026-10-18T16:21:05Z");
      const result = resolveTenantActiveWeek({ tenantSlug: "eatclean", now });

      expect(result.calendarMondayIso).toBe("2026-10-12");
      expect(result.isPastCutoff).toBe(true);
      expect(result.defaultActiveMondayIso).toBe("2026-10-19");
      expect(result.activeDeliveryDates).toEqual([
        "2026-10-19",
        "2026-10-20",
        "2026-10-21",
        "2026-10-22",
        "2026-10-23",
      ]);
    });

    it("stays in current week before Friday 14:00 Canary time", () => {
      // Friday Oct 16, 2026 at 13:59 Canary time (UTC 12:59)
      const now = new Date("2026-10-16T12:59:00Z");
      const result = resolveTenantActiveWeek({ tenantSlug: "eatclean", now });

      expect(result.calendarMondayIso).toBe("2026-10-12");
      expect(result.isPastCutoff).toBe(false);
      expect(result.defaultActiveMondayIso).toBe("2026-10-12");
    });

    it("rolls over to next Monday exactly at Friday 14:00 Canary time", () => {
      // Friday Oct 16, 2026 at 14:00 Canary time (UTC 13:00)
      const now = new Date("2026-10-16T13:00:00Z");
      const result = resolveTenantActiveWeek({ tenantSlug: "eatclean", now });

      expect(result.calendarMondayIso).toBe("2026-10-12");
      expect(result.isPastCutoff).toBe(true);
      expect(result.defaultActiveMondayIso).toBe("2026-10-19");
    });

    it("stays on Monday on Monday morning (Oct 19, 2026)", () => {
      // Monday Oct 19, 2026 at 09:00 Canary time (UTC 08:00)
      const now = new Date("2026-10-19T08:00:00Z");
      const result = resolveTenantActiveWeek({ tenantSlug: "eatclean", now });

      expect(result.calendarMondayIso).toBe("2026-10-19");
      expect(result.isPastCutoff).toBe(false);
      expect(result.defaultActiveMondayIso).toBe("2026-10-19");
    });

    it("respects isolated multi-tenant timezone configuration without leaking EatClean defaults", () => {
      // A peninsular tenant with Europe/Madrid
      const configMadrid = getTenantScheduleConfig({ tenantSlug: "other-tenant", tenantTimezone: "Europe/Madrid" });
      expect(configMadrid.timezone).toBe("Europe/Madrid");

      // Default fallback
      const configDefault = getTenantScheduleConfig();
      expect(configDefault.timezone).toBe("Europe/Madrid");

      // EatClean tenant
      const configCanary = getTenantScheduleConfig("eatclean");
      expect(configCanary.timezone).toBe("Atlantic/Canary");
    });
  });

  describe("isWeeklyOrderCutoffPassed", () => {
    it("returns true for a past week when cutoff has passed", () => {
      const now = new Date("2026-10-18T16:21:05Z"); // Sunday
      // Active week is 2026-10-19, so 2026-10-12 is cutoff passed
      expect(isWeeklyOrderCutoffPassed("2026-10-12", { tenantSlug: "eatclean", now })).toBe(true);
    });

    it("returns false for the active week or future weeks", () => {
      const now = new Date("2026-10-18T16:21:05Z"); // Sunday
      expect(isWeeklyOrderCutoffPassed("2026-10-19", { tenantSlug: "eatclean", now })).toBe(false);
      expect(isWeeklyOrderCutoffPassed("2026-10-26", { tenantSlug: "eatclean", now })).toBe(false);
    });
  });
});
