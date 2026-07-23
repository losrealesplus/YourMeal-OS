/**
 * Canonical UTC calendar helpers for Weekly Menu week_start (YYYY-MM-DD).
 * Matches platform UTC rule — does not invent commercial week policies.
 */

export function utcDateOnly(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Monday (UTC) of the ISO-like week containing `date`. */
export function utcWeekStartMonday(date: Date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
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
