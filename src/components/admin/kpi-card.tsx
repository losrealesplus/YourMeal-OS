import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  hint?: string;
};

export function KpiCard({ label, value, delta, trend = "flat", hint }: Props) {
  const Icon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const tone =
    trend === "up"
      ? "text-primary bg-primary/10"
      : trend === "down"
      ? "text-destructive bg-destructive/10"
      : "text-muted-foreground bg-secondary";
  return (
    <div className="bg-card border border-border ring-1 ring-black/[0.03] rounded-2xl p-5">
      <p className="meta-label">{label}</p>
      <div className="flex items-baseline gap-3 mt-3">
        <p className="text-3xl font-extrabold tracking-tight tabular-nums">{value}</p>
        {delta ? (
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5", tone)}>
            <Icon className="size-3" />
            {delta}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="text-[10px] font-mono text-muted-foreground mt-2 uppercase tracking-widest">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
