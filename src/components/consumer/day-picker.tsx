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
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 pb-2 -mx-6">
      {days.map((d, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={d + i}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              "size-12 rounded-xl font-bold text-sm shrink-0 border transition-colors",
              active
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-foreground border-border hover:border-primary/40",
            )}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}
