import { cn } from "@/lib/utils";

export function ProgressBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "warn" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          tone === "warn" ? "bg-[oklch(0.68_0.16_75)]" : "bg-primary",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
