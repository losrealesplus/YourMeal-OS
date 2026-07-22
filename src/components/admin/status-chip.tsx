import { cn } from "@/lib/utils";

type Tone = "neutral" | "positive" | "warning" | "danger" | "info";

const toneMap: Record<Tone, string> = {
  neutral:  "bg-secondary text-secondary-foreground",
  positive: "bg-primary/12 text-primary",
  warning:  "bg-warn/20 text-[oklch(0.5_0.12_75)]",
  danger:   "bg-destructive/10 text-destructive",
  info:     "bg-chart-2/20 text-chart-2",
};

const dotMap: Record<Tone, string> = {
  neutral:  "bg-muted-foreground",
  positive: "bg-primary",
  warning:  "bg-[oklch(0.68_0.16_75)]",
  danger:   "bg-destructive",
  info:     "bg-chart-2",
};

export function StatusChip({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
        toneMap[tone],
      )}
    >
      <span className={cn("size-1.5 rounded-full", dotMap[tone])} />
      {label}
    </span>
  );
}
