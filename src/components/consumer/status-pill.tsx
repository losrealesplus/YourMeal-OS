import type { MockOrderStatus } from "@/lib/mock-catalog";
import { cn } from "@/lib/utils";

const toneByStatus: Record<MockOrderStatus, { chip: string; dot: string }> = {
  pending:    { chip: "bg-secondary text-secondary-foreground",              dot: "bg-muted-foreground" },
  preparing:  { chip: "bg-warn/15 text-[oklch(0.5_0.12_75)]",                 dot: "bg-[oklch(0.68_0.16_75)]" },
  dispatched: { chip: "bg-chart-2/20 text-chart-2",                           dot: "bg-chart-2" },
  delivered:  { chip: "bg-primary/12 text-primary",                           dot: "bg-primary" },
  cancelled:  { chip: "bg-destructive/10 text-destructive",                   dot: "bg-destructive" },
};

export function StatusPill({
  status,
  label,
}: {
  status: MockOrderStatus;
  label: string;
}) {
  const tone = toneByStatus[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
        tone.chip,
      )}
    >
      <span className={cn("size-1.5 rounded-full", tone.dot)} />
      {label}
    </span>
  );
}
