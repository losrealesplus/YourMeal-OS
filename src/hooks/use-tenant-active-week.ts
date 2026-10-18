import { useState, useMemo } from "react";
import { useActiveTenantSlug } from "@/identity/active-tenant-slug";
import {
  resolveTenantActiveWeek,
  offsetWeekMonday,
  utcWeekDates,
  formatWeekRangeEs,
  MAX_FUTURE_WEEKS,
  isPastWeek,
} from "@/modules/weekly-menu/application/week-dates";

export interface UseTenantActiveWeekOptions {
  tenantSlug?: string | null;
  initialOffset?: number;
}

export function useTenantActiveWeek(options?: UseTenantActiveWeekOptions) {
  const detectedSlug = useActiveTenantSlug();
  const tenantSlug = options?.tenantSlug ?? detectedSlug;

  const baseResolution = useMemo(
    () => resolveTenantActiveWeek({ tenantSlug }),
    [tenantSlug],
  );

  const [weekOffset, setWeekOffset] = useState<number>(options?.initialOffset ?? 0);

  const weekStart = useMemo(
    () => offsetWeekMonday(baseResolution.defaultActiveMondayIso, weekOffset),
    [baseResolution.defaultActiveMondayIso, weekOffset],
  );

  const allWeekDates = useMemo(() => utcWeekDates(weekStart), [weekStart]);

  const activeDeliveryDates = useMemo(() => {
    return allWeekDates.filter((_, idx) =>
      baseResolution.config.activeDeliveryDays.includes(idx + 1),
    );
  }, [allWeekDates, baseResolution.config.activeDeliveryDays]);

  const weekLabel = useMemo(() => formatWeekRangeEs(weekStart), [weekStart]);

  const canGoPrev = weekOffset > 0;
  const canGoNext = weekOffset < (baseResolution.config.maxFutureWeeks ?? MAX_FUTURE_WEEKS);

  const isCurrentSelectionInPast = useMemo(() => isPastWeek(weekStart), [weekStart]);

  return {
    tenantSlug,
    config: baseResolution.config,
    baseActiveMondayIso: baseResolution.defaultActiveMondayIso,
    calendarMondayIso: baseResolution.calendarMondayIso,
    isPastCutoff: baseResolution.isPastCutoff,
    weekStart,
    weekOffset,
    setWeekOffset,
    allWeekDates,
    activeDeliveryDates,
    weekLabel,
    canGoPrev,
    canGoNext,
    isCurrentSelectionInPast,
    resetToDefaultWeek: () => setWeekOffset(0),
  };
}
