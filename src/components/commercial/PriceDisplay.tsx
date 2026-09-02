import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { Money } from "@/modules/commercial";
import { PromotionBadge } from "./PromotionBadge";

export interface PriceDisplayProps extends HTMLAttributes<HTMLDivElement> {
  basePrice: Money;
  finalPrice: Money;
  unitLabel?: string;
  savingsBadge?: string | null;
  size?: "sm" | "md" | "lg";
  layout?: "stacked" | "inline";
  showReferenceLabel?: boolean;
}

export function PriceDisplay({
  basePrice,
  finalPrice,
  unitLabel,
  savingsBadge,
  size = "md",
  layout = "stacked",
  showReferenceLabel = false,
  className,
  ...props
}: PriceDisplayProps) {
  const hasDiscount = basePrice.cents > finalPrice.cents;

  const sizeStyles = {
    sm: {
      final: "text-lg font-bold",
      base: "text-xs",
      unit: "text-xs",
    },
    md: {
      final: "text-2xl font-bold",
      base: "text-sm",
      unit: "text-sm",
    },
    lg: {
      final: "text-3xl sm:text-4xl font-extrabold",
      base: "text-base sm:text-lg",
      unit: "text-sm sm:text-base",
    },
  };

  return (
    <div
      className={cn(
        "flex",
        layout === "stacked" ? "flex-col items-start gap-1" : "flex-row items-baseline gap-2 flex-wrap",
        className,
      )}
      {...props}
    >
      {hasDiscount && (
        <div className="flex items-baseline gap-1.5 text-muted-foreground">
          {showReferenceLabel && <span className="text-xs uppercase tracking-wider">Precio habitual:</span>}
          <span className={cn("line-through opacity-75", sizeStyles[size].base)}>
            {basePrice.formatted}
          </span>
        </div>
      )}

      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className={cn("tracking-tight text-foreground", sizeStyles[size].final)}>
          {finalPrice.formatted}
        </span>
        {unitLabel && (
          <span className={cn("text-muted-foreground font-normal", sizeStyles[size].unit)}>
            {`/ ${unitLabel}`}
          </span>
        )}
        {savingsBadge && (
          <PromotionBadge label={savingsBadge} variant="success" className="ml-1" />
        )}
      </div>
    </div>
  );
}
