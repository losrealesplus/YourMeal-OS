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
      // Default fallback has no weekly cutoff and full 7-day operation
      const configDefault = getTenantScheduleConfig();
      expect(configDefault.timezone).toBe("Europe/Madrid");
      expect(configDefault.cutoffDay).toBeNull();
      expect(configDefault.cutoffTime).toBe("23:59");
      expect(configDefault.activeDeliveryDays).toEqual([1, 2, 3, 4, 5, 6, 7]);

      // An unconfigured tenant does not inherit EatClean's Friday 14:00 cutoff
      const unconfiguredTenant = getTenantScheduleConfig({ tenantSlug: "peninsula-bistro", tenantTimezone: "Europe/Madrid" });
      expect(unconfiguredTenant.timezone).toBe("Europe/Madrid");
      expect(unconfiguredTenant.cutoffDay).toBeNull();
      expect(unconfiguredTenant.activeDeliveryDays).toEqual([1, 2, 3, 4, 5, 6, 7]);

      // EatClean tenant retains its specific operational schedule
      const configCanary = getTenantScheduleConfig("eatclean");
      expect(configCanary.timezone).toBe("Atlantic/Canary");
      expect(configCanary.cutoffDay).toBe(5);
      expect(configCanary.cutoffTime).toBe("14:00");
      expect(configCanary.activeDeliveryDays).toEqual([1, 2, 3, 4, 5]);
    });

    it("does not advance week for unconfigured tenants on Friday afternoon (no weekly pre-cutoff)", () => {
      // Friday Oct 16, 2026 at 15:30 Madrid time (after Friday 14:00)
      const now = new Date("2026-10-16T13:30:00Z");

      // EatClean: passed cutoff -> rolls over to Oct 19
      const eatcleanResult = resolveTenantActiveWeek({ tenantSlug: "eatclean", now });
      expect(eatcleanResult.isPastCutoff).toBe(true);
      expect(eatcleanResult.defaultActiveMondayIso).toBe("2026-10-19");

      // Generic/unconfigured tenant: no cutoff -> stays on Oct 12
      const genericResult = resolveTenantActiveWeek({ tenantSlug: "generic-tenant", now });
      expect(genericResult.isPastCutoff).toBe(false);
      expect(genericResult.defaultActiveMondayIso).toBe("2026-10-12");
      expect(genericResult.activeDeliveryDates).toHaveLength(7);
    });

    it("respects custom tenant schedule like Wednesday 18:00 cutoff", () => {
      const customConfig = {
        timezone: "Europe/Madrid",
        cutoffDay: 3, // Wednesday
        cutoffTime: "18:00",
        activeDeliveryDays: [1, 2, 3, 4, 5],
        maxFutureWeeks: 4,
      };

      // Wednesday Oct 14, 2026 at 17:59 Madrid time (15:59 UTC) -> before cutoff
      const beforeCutoff = new Date("2026-10-14T15:59:00Z");
      const resBefore = resolveTenantActiveWeek({ scheduleConfig: customConfig, now: beforeCutoff });
      expect(resBefore.isPastCutoff).toBe(false);
      expect(resBefore.defaultActiveMondayIso).toBe("2026-10-12");

      // Wednesday Oct 14, 2026 at 18:00 Madrid time (16:00 UTC) -> at cutoff
      const atCutoff = new Date("2026-10-14T16:00:00Z");
      const resAt = resolveTenantActiveWeek({ scheduleConfig: customConfig, now: atCutoff });
      expect(resAt.isPastCutoff).toBe(true);
      expect(resAt.defaultActiveMondayIso).toBe("2026-10-19");
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

    it("unconfigured tenant rejects historical weeks but allows current week", () => {
      const now = new Date("2026-10-16T15:00:00Z"); // Friday 15:00 UTC
      // 2026-10-05 is past week -> rejected
      expect(isWeeklyOrderCutoffPassed("2026-10-05", { tenantSlug: "unconfigured", now })).toBe(true);
      // 2026-10-12 is current week -> open (cutoffDay is null)
      expect(isWeeklyOrderCutoffPassed("2026-10-12", { tenantSlug: "unconfigured", now })).toBe(false);
      // 2026-10-19 is future week -> open
      expect(isWeeklyOrderCutoffPassed("2026-10-19", { tenantSlug: "unconfigured", now })).toBe(false);
    });

    it("evaluates custom schedule cutoff (Wednesday 18:00) accurately", () => {
      const scheduleConfig = {
        timezone: "Europe/Madrid",
        cutoffDay: 3,
        cutoffTime: "18:00",
        activeDeliveryDays: [1, 2, 3, 4, 5],
        maxFutureWeeks: 4,
      };

      // Wednesday 17:59 Madrid (15:59 UTC)
      const before = new Date("2026-10-14T15:59:00Z");
      expect(isWeeklyOrderCutoffPassed("2026-10-12", { scheduleConfig, now: before })).toBe(false);

      // Wednesday 18:00 Madrid (16:00 UTC)
      const after = new Date("2026-10-14T16:00:00Z");
      expect(isWeeklyOrderCutoffPassed("2026-10-12", { scheduleConfig, now: after })).toBe(true);
      expect(isWeeklyOrderCutoffPassed("2026-10-19", { scheduleConfig, now: after })).toBe(false);
    });
  });
});
