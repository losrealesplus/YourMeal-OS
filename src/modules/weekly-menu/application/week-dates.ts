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
