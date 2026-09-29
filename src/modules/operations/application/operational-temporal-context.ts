import {
  DAY_NAMES_ES,
  MONTH_NAMES_ES,
  formatWeekRangeEs,
} from "@/modules/weekly-menu";

/**
 * Deterministic temporal formatting utilities for operational order views (CR-OPS-09A).
 */

/**
 * Formats a service day date (YYYY-MM-DD) into Spanish operational format:
 * e.g. "2026-10-01" -> "Jueves · 01 oct 2026"
 */
export function formatServiceDayEs(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayIndex = (date.getUTCDay() + 6) % 7; // 0 = Lunes, 6 = Domingo
  const dayName = DAY_NAMES_ES[dayIndex] ?? "";
  const monthName = MONTH_NAMES_ES[m - 1] ?? "";
  const dayPadded = String(d).padStart(2, "0");
  return `${dayName} · ${dayPadded} ${monthName} ${y}`;
}

/**
 * Formats a date (YYYY-MM-DD) into standard short display format:
 * e.g. "2026-10-01" -> "01/10/2026"
 */
export function formatShortDateEs(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

/**
 * Formats a creation ISO timestamp into human-readable Spanish datetime:
 * e.g. "2026-09-29T12:13:00Z" -> "29 sep 2026, 12:13"
 */
export function formatCreationDateTimeEs(
  isoDateTime: string | null | undefined,
): string {
  if (!isoDateTime) return "—";
  const d = new Date(isoDateTime);
  if (isNaN(d.getTime())) return isoDateTime;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const monthName = MONTH_NAMES_ES[d.getUTCMonth()] ?? "";
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day} ${monthName} ${year}, ${hours}:${minutes}`;
}

/**
 * Formats weekly menu origin context:
 * e.g. "2026-09-28" -> "Semana: 28 sep — 4 oct 2026"
 */
export function formatMenuWeekEs(weekStart: string | null | undefined): string {
  if (!weekStart) return "—";
  return `Semana: ${formatWeekRangeEs(weekStart)}`;
}

/**
 * Calculates sum of portions across line items.
 */
export function calculateTotalPortions(
  items: Array<{ qty?: number | null }>,
): number {
  return items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
}
