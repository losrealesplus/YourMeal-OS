/**
 * EP-002A.2 — pure repeat-order planning.
 * Intersects historical lines with the published offer for the target week.
 * Never invents availability: missing dishes stay unavailable.
 */

export type SourceOrderLine = {
  dishId: string;
  dishName: string | null;
  qty: number;
  dayDate: string;
};

export type RepeatAvailableLine = {
  dishId: string;
  dishName: string | null;
  qty: number;
  sourceDayDate: string;
  targetDayDate: string;
};

export type RepeatUnavailableLine = {
  dishId: string;
  dishName: string | null;
  qty: number;
  sourceDayDate: string;
  reason: "not_on_menu";
};

export type RepeatOrderPlan = {
  targetWeekStart: string;
  available: RepeatAvailableLine[];
  unavailable: RepeatUnavailableLine[];
};

/** Days between weekStart and dayDate (0 = Monday of that week). */
export function weekdayOffset(weekStart: string, dayDate: string): number {
  const start = Date.parse(`${weekStart}T00:00:00.000Z`);
  const day = Date.parse(`${dayDate}T00:00:00.000Z`);
  if (Number.isNaN(start) || Number.isNaN(day)) return 0;
  const diff = Math.round((day - start) / 86_400_000);
  return Math.min(6, Math.max(0, diff));
}

export function addUtcDays(weekStart: string, offset: number): string {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() + offset);
  return start.toISOString().slice(0, 10);
}

/**
 * Prefer the same weekday in the target week; otherwise the earliest day
 * the dish is offered. If never offered → unavailable (not auto-added).
 */
export function resolveTargetDay(
  preferredDay: string,
  offeredDays: readonly string[],
): string | null {
  if (offeredDays.length === 0) return null;
  if (offeredDays.includes(preferredDay)) return preferredDay;
  return [...offeredDays].sort()[0] ?? null;
}

export function buildRepeatOrderPlan(input: {
  sourceWeekStart: string;
  sourceLines: readonly SourceOrderLine[];
  targetWeekStart: string;
  /** dishId → sorted day dates offered in the published target week */
  offerByDish: ReadonlyMap<string, readonly string[]>;
}): RepeatOrderPlan {
  const available: RepeatAvailableLine[] = [];
  const unavailable: RepeatUnavailableLine[] = [];

  for (const line of input.sourceLines) {
    if (!line.dishId || line.qty <= 0) continue;

    const offset = weekdayOffset(input.sourceWeekStart, line.dayDate);
    const preferred = addUtcDays(input.targetWeekStart, offset);
    const offered = input.offerByDish.get(line.dishId) ?? [];
    const targetDay = resolveTargetDay(preferred, offered);

    if (!targetDay) {
      unavailable.push({
        dishId: line.dishId,
        dishName: line.dishName,
        qty: line.qty,
        sourceDayDate: line.dayDate,
        reason: "not_on_menu",
      });
      continue;
    }

    available.push({
      dishId: line.dishId,
      dishName: line.dishName,
      qty: line.qty,
      sourceDayDate: line.dayDate,
      targetDayDate: targetDay,
    });
  }

  return {
    targetWeekStart: input.targetWeekStart,
    available,
    unavailable,
  };
}

export function canRepeatPlan(plan: RepeatOrderPlan): boolean {
  return plan.available.length > 0;
}
