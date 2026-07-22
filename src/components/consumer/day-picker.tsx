import { cn } from "@/lib/utils";

/** Selector horizontal de días — un solo toque. */
export function DayPicker({
  days,
  activeIndex,
  onSelect,
}: {
  days: string[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 pb-3 -mx-6 snap-x snap-mandatory">
      {days.map((d, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={d + i}
            type="button"
            onClick={() => onSelect(i)}
            aria-pressed={active}
            className={cn(
              "snap-start shrink-0 h-14 min-w-14 px-3 rounded-2xl border font-bold text-sm transition-all duration-200 active:scale-95",
              active
                ? "bg-foreground text-background border-foreground shadow-[0_8px_20px_-10px_color-mix(in_oklab,var(--color-foreground)_55%,transparent)] scale-100"
                : "bg-card text-foreground border-border/70 hover:border-primary/40",
            )}
          >
            <span className="block leading-none">{d}</span>
            <span
              className={cn(
                "block mt-1 font-mono text-[10px] tabular-nums uppercase tracking-widest",
                active ? "opacity-70" : "text-muted-foreground",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
