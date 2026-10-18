/**
 * Canonical UTC calendar helpers for Weekly Menu week_start (YYYY-MM-DD).
 * Matches platform UTC rule — does not invent commercial week policies.
 */

export function utcDateOnly(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Monday (UTC) of the ISO-like week containing `date`. */
export function utcWeekStartMonday(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday
  const offset = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + offset);
  return utcDateOnly(d);
}

/** Seven consecutive dates starting at `weekStart` (YYYY-MM-DD). */
export function utcWeekDates(weekStart: string): string[] {
  const [y, m, d] = weekStart.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    return utcDateOnly(day);
  });
}

/** True when dayDate is in [weekStart, weekStart+6] UTC calendar days. */
export function isDayDateInWeek(weekStart: string, dayDate: string): boolean {
  return utcWeekDates(weekStart).includes(dayDate);
}

/** True when weekStart is a valid UTC Monday date (YYYY-MM-DD). */
export function isValidMondayIso(weekStart: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) return false;
  const [y, m, d] = weekStart.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (isNaN(date.getTime())) return false;
  return utcWeekStartMonday(date) === weekStart;
}

/** Returns the Monday date string offset by `weekDelta` weeks (e.g. -1 for previous week, +1 for next week). */
export function offsetWeekMonday(weekStart: string, weekDelta: number): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d + weekDelta * 7));
  return utcWeekStartMonday(start);
}

export const DAY_NAMES_ES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

export const MONTH_NAMES_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

export function formatDayDateEs(dayDate: string): {
  dayName: string;
  formattedDate: string;
} {
  const [y, m, d] = dayDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayIndex = (date.getUTCDay() + 6) % 7; // 0 = Lunes, 6 = Domingo
  const dayName = DAY_NAMES_ES[dayIndex] ?? "";
  const monthName = MONTH_NAMES_ES[m - 1] ?? "";
  return {
    dayName,
    formattedDate: `${d} ${monthName}`,
  };
}

export function formatWeekRangeEs(weekStart: string): string {
  const dates = utcWeekDates(weekStart);
  const first = dates[0]!;
  const last = dates[6]!;
  const [y1, m1, d1] = first.split("-").map(Number);
  const [y2, m2, d2] = last.split("-").map(Number);
  const m1Name = MONTH_NAMES_ES[m1 - 1] ?? "";
  const m2Name = MONTH_NAMES_ES[m2 - 1] ?? "";
  if (m1 === m2 && y1 === y2) {
    return `${d1} — ${d2} ${m1Name} ${y1}`;
  }
  if (y1 === y2) {
    return `${d1} ${m1Name} — ${d2} ${m2Name} ${y1}`;
  }
  return `${d1} ${m1Name} ${y1} — ${d2} ${m2Name} ${y2}`;
}

/** Maximum allowed forward planning horizon in weeks for customer self-service schedule. */
export const MAX_FUTURE_WEEKS = 4;

/**
 * Returns true if the given weekStart is strictly in the past relative to referenceDate's Monday.
 */
export function isPastWeek(weekStart: string, referenceDate: Date = new Date()): boolean {
  const currentMonday = utcWeekStartMonday(referenceDate);
  return weekStart < currentMonday;
}

export interface TenantOperationalScheduleConfig {
  timezone: string;
  cutoffDay: number; // 1 = Monday .. 5 = Friday .. 7 = Sunday (ISO)
  cutoffTime: string; // "14:00" in 24h format
  activeDeliveryDays: number[]; // e.g. [1, 2, 3, 4, 5]
  maxFutureWeeks: number;
}

export const DEFAULT_SCHEDULE_CONFIG: TenantOperationalScheduleConfig = {
  timezone: "Europe/Madrid",
  cutoffDay: 5,
  cutoffTime: "14:00",
  activeDeliveryDays: [1, 2, 3, 4, 5],
  maxFutureWeeks: 4,
};

export const TENANT_SCHEDULE_CONFIGS: Record<string, TenantOperationalScheduleConfig> = {
  eatclean: {
    timezone: "Atlantic/Canary",
    cutoffDay: 5,
    cutoffTime: "14:00",
    activeDeliveryDays: [1, 2, 3, 4, 5],
    maxFutureWeeks: 4,
  },
  "eatclean-staging": {
    timezone: "Atlantic/Canary",
    cutoffDay: 5,
    cutoffTime: "14:00",
    activeDeliveryDays: [1, 2, 3, 4, 5],
    maxFutureWeeks: 4,
  },
};

export interface TenantScheduleConfigOptions {
  tenantSlug?: string | null;
  tenantTimezone?: string | null;
  scheduleConfig?: Partial<TenantOperationalScheduleConfig> | null;
}

export function getTenantScheduleConfig(
  optionsOrSlug?: string | null | TenantScheduleConfigOptions,
): TenantOperationalScheduleConfig {
  const opts: TenantScheduleConfigOptions =
    typeof optionsOrSlug === "string"
      ? { tenantSlug: optionsOrSlug }
      : (optionsOrSlug ?? {});

  const baseConfig =
    opts.tenantSlug && TENANT_SCHEDULE_CONFIGS[opts.tenantSlug]
      ? TENANT_SCHEDULE_CONFIGS[opts.tenantSlug]
      : {
          ...DEFAULT_SCHEDULE_CONFIG,
          ...(opts.tenantTimezone ? { timezone: opts.tenantTimezone } : {}),
        };

  if (opts.scheduleConfig) {
    return {
      ...baseConfig,
      ...opts.scheduleConfig,
    };
  }
  return baseConfig;
}

export interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  isoDow: number; // 1 = Monday .. 7 = Sunday
  dateIso: string; // "YYYY-MM-DD"
}

export function getZonedDateParts(
  date: Date = new Date(),
  timezone: string = "Atlantic/Canary",
): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  const year = parseInt(parts.year, 10);
  const month = parseInt(parts.month, 10);
  const day = parseInt(parts.day, 10);
  const hour = parseInt(parts.hour, 10);
  const minute = parseInt(parts.minute, 10);
  const second = parseInt(parts.second, 10);
  const civilUtc = new Date(Date.UTC(year, month - 1, day));
  const dow = civilUtc.getUTCDay();
  const isoDow = dow === 0 ? 7 : dow;
  const dateIso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { year, month, day, hour, minute, second, isoDow, dateIso };
}

export function isPastWeeklyCutoff(
  parts: Pick<ZonedDateParts, "isoDow" | "hour" | "minute" | "second">,
  cutoffDay: number = 5,
  cutoffTime: string = "14:00",
): boolean {
  const [cutoffH, cutoffM] = cutoffTime.split(":").map(Number);
  if (parts.isoDow > cutoffDay) return true;
  if (parts.isoDow < cutoffDay) return false;
  if (parts.hour > cutoffH) return true;
  if (parts.hour < cutoffH) return false;
  return parts.minute >= cutoffM;
}

export interface TenantActiveWeekResult {
  calendarMondayIso: string;
  defaultActiveMondayIso: string;
  isPastCutoff: boolean;
  activeDeliveryDates: string[];
  allWeekDates: string[];
  config: TenantOperationalScheduleConfig;
}

export function resolveTenantActiveWeek(options?: {
  tenantSlug?: string | null;
  tenantTimezone?: string | null;
  scheduleConfig?: Partial<TenantOperationalScheduleConfig> | null;
  now?: Date;
}): TenantActiveWeekResult {
  const config = getTenantScheduleConfig(options);
  const now = options?.now ?? new Date();
  const parts = getZonedDateParts(now, config.timezone);

  // Monday of the civil week in tenant's timezone
  const offset = parts.isoDow === 1 ? 0 : 1 - parts.isoDow;
  const mondayUtc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + offset));
  const calendarMondayIso = mondayUtc.toISOString().slice(0, 10);

  const pastCutoff = isPastWeeklyCutoff(parts, config.cutoffDay, config.cutoffTime);
  const defaultActiveMondayIso = pastCutoff
    ? offsetWeekMonday(calendarMondayIso, 1)
    : calendarMondayIso;

  const allWeekDates = utcWeekDates(defaultActiveMondayIso);
  const activeDeliveryDates = allWeekDates.filter((_, idx) =>
    config.activeDeliveryDays.includes(idx + 1),
  );

  return {
    calendarMondayIso,
    defaultActiveMondayIso,
    isPastCutoff: pastCutoff,
    allWeekDates,
    activeDeliveryDates,
    config,
  };
}

/**
 * Validates whether the given weekStart has already passed the weekly cutoff for ordering/modifying.
 * Returns true if weekStart is earlier than the defaultActiveMondayIso for the tenant.
 */
export function isWeeklyOrderCutoffPassed(
  weekStart: string,
  options?: {
    tenantSlug?: string | null;
    tenantTimezone?: string | null;
    scheduleConfig?: Partial<TenantOperationalScheduleConfig> | null;
    now?: Date;
  },
): boolean {
  const active = resolveTenantActiveWeek(options);
  return weekStart < active.defaultActiveMondayIso;
}


