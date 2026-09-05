import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface PromotionBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  variant?: "success" | "highlight" | "outline";
}

export function PromotionBadge({
  label,
  variant = "success",
  className,
  ...props
}: PromotionBadgeProps) {
  const variantStyles = {
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    highlight: "bg-primary/10 text-primary border-primary/20",
    outline: "bg-background text-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-tight transition-colors",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {label}
    </span>
  );
}
