/**
 * Admin menu dayDate integrity — keep selected day inside the active week.
 * Pure helper (no React) so stale-day regressions are unit-testable.
 */
import { isDayDateInWeek, utcWeekDates } from "./week-dates";

/**
 * Resolve the day picker value for a weekly menu.
 * If `currentDayDate` is missing or outside `weekStart..+6`, return Monday of that week.
 */
export function resolveDayDateForWeek(
  weekStart: string,
  currentDayDate: string | null | undefined,
): string {
  const dates = utcWeekDates(weekStart);
  const first = dates[0];
  if (!first) {
    throw new Error(`resolveDayDateForWeek: empty week for ${weekStart}`);
  }
  if (currentDayDate && isDayDateInWeek(weekStart, currentDayDate)) {
    return currentDayDate;
  }
  return first;
}
