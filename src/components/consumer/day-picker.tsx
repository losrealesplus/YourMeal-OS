import { cn } from "@/lib/utils";

export interface DayPickerProps {
  days: string[];
  activeIndex: number;
  onSelect: (i: number) => void;
  isDayDisabled?: (i: number) => boolean;
  dates?: string[];
  mealCounts?: Record<string, number>;
  dayBadges?: Record<number, number>;
}

/** Selector horizontal de días — fechas reales y conteo de platos acumulado. */
export function DayPicker({
  days,
  activeIndex,
  onSelect,
  isDayDisabled,
  dates,
  mealCounts,
  dayBadges,
}: DayPickerProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 pb-3 -mx-6 snap-x snap-mandatory">
      {days.map((d, i) => {
        const active = i === activeIndex;
        const disabled = isDayDisabled ? isDayDisabled(i) : false;
        const dateIso = dates?.[i];
        const dayNumber = dateIso ? dateIso.split("-")[2] : String(i + 1).padStart(2, "0");
        const count =
          (dateIso && mealCounts ? mealCounts[dateIso] : undefined) ??
          (dayBadges ? dayBadges[i] : undefined) ??
          0;

        return (
          <button
            key={d + (dateIso ?? i)}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onSelect(i)}
            aria-pressed={active}
            aria-disabled={disabled}
            className={cn(
              "relative snap-start shrink-0 h-14 min-w-14 px-3 rounded-2xl border font-bold text-sm transition-all duration-200",
              disabled
                ? "opacity-30 cursor-not-allowed bg-muted text-muted-foreground border-border/40"
                : active
                  ? "bg-foreground text-background border-foreground shadow-[0_8px_20px_-10px_color-mix(in_oklab,var(--color-foreground)_55%,transparent)] scale-100 active:scale-95 cursor-pointer"
                  : "bg-card text-foreground border-border/70 hover:border-primary/40 active:scale-95 cursor-pointer",
            )}
          >
            {count > 0 && (
              <span
                className={cn(
                  "absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center ring-2 ring-background tabular-nums shadow-xs",
                  active ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground",
                )}
                aria-label={`${count} platos seleccionados`}
              >
                {count}
              </span>
            )}
            <span className="block leading-none">{d}</span>
            <span
              className={cn(
                "block mt-1 font-mono text-[10px] tabular-nums uppercase tracking-widest",
                disabled ? "opacity-40" : active ? "opacity-70" : "text-muted-foreground",
              )}
            >
              {dayNumber}
            </span>
          </button>
        );
      })}
    </div>
  );
}
