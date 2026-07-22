import type { MockOrderStatus } from "@/lib/mock-catalog";
import { cn } from "@/lib/utils";

const toneByStatus: Record<MockOrderStatus, string> = {
  pending:    "bg-secondary text-secondary-foreground",
  preparing:  "bg-warn/15 text-[oklch(0.5_0.12_75)]",
  dispatched: "bg-chart-2/20 text-chart-2",
  delivered:  "bg-primary/15 text-primary",
  cancelled:  "bg-destructive/10 text-destructive",
};

export function StatusPill({
  status,
  label,
}: {
  status: MockOrderStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1",
        toneByStatus[status],
      )}
    >
      {label}
    </span>
  );
}
