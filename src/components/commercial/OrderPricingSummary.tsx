import type { HTMLAttributes } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PricingEvaluationResult } from "@/modules/commercial";

export interface OrderPricingSummaryProps extends HTMLAttributes<HTMLDivElement> {
  evaluation: PricingEvaluationResult;
  shippingLabel?: string;
  className?: string;
}

export function OrderPricingSummary({
  evaluation,
  shippingLabel = "Gratis",
  className,
  ...props
}: OrderPricingSummaryProps) {
  const {
    basePrice,
    appliedPromotions,
    extrasBreakdown,
    extrasTotalBasePrice,
    grandTotalBasePrice,
    grandTotalFinalPrice,
    grandTotalSavings,
  } = evaluation;

  const hasSavings = grandTotalSavings.cents > 0;

  return (
    <div
      className={cn("p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4", className)}
      {...props}
    >
      <h3 className="text-lg font-bold tracking-tight text-foreground border-b border-border pb-3">
        Resumen del pedido
      </h3>

      <div className="space-y-2.5 text-sm">
        {/* Base Offer Price */}
        <div className="flex justify-between items-center text-foreground">
          <span>Precio base oferta</span>
          <span className="font-medium">{basePrice.formatted}</span>
        </div>

        {/* Applied Promotions */}
        {appliedPromotions.map((promo) => (
          <div
            key={promo.ruleId || promo.code}
            className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {promo.name}
            </span>
            <span>{`-${promo.formattedDiscount}`}</span>
          </div>
        ))}

        {/* Extras Breakdown */}
        {extrasBreakdown.length > 0 && (
          <div className="border-t border-border/50 pt-2.5 space-y-2">
            <div className="flex justify-between items-center text-muted-foreground text-xs uppercase tracking-wider font-semibold">
              <span>{`Extras añadidos (${extrasBreakdown.length})`}</span>
              <span>{extrasTotalBasePrice.formatted}</span>
            </div>
            {extrasBreakdown.map((extra) => (
              <div
                key={extra.dishId}
                className="flex justify-between items-center text-xs text-foreground/85 pl-2"
              >
                <span>
                  {extra.qty > 1 ? `${extra.qty}× ` : ""}
                  {extra.dishName}
                </span>
                <div className="flex items-center gap-1.5">
                  {extra.totalSavings.cents > 0 && (
                    <span className="line-through text-muted-foreground text-[11px]">
                      {extra.totalBasePrice.formatted}
                    </span>
                  )}
                  <span className="font-medium">{extra.totalFinalPrice.formatted}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shipping */}
        <div className="flex justify-between items-center text-foreground border-t border-border/50 pt-2.5">
          <span>Gastos de entrega</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {shippingLabel}
          </span>
        </div>
      </div>

      {/* Grand Total */}
      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-base font-bold text-foreground">Total a pagar</span>
          <div className="text-right">
            {hasSavings && (
              <span className="block text-xs text-muted-foreground line-through">
                {grandTotalBasePrice.formatted}
              </span>
            )}
            <span className="text-2xl font-extrabold text-foreground tracking-tight">
              {grandTotalFinalPrice.formatted}
            </span>
          </div>
        </div>

        {hasSavings && (
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span>{`🎉 ¡Ahorras ${grandTotalSavings.formatted} en este pedido!`}</span>
          </div>
        )}
      </div>
    </div>
  );
}
