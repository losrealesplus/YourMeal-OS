import type { HTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { CommercialOffer, PricingEvaluationResult } from "@/modules/commercial";
import { PriceDisplay } from "./PriceDisplay";
import { PromotionBadge } from "./PromotionBadge";

export interface OfferCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  offer: CommercialOffer;
  evaluation: PricingEvaluationResult;
  selected?: boolean;
  onSelect?: (offer: CommercialOffer) => void;
  ctaText?: string;
}

export function OfferCard({
  offer,
  evaluation,
  selected = false,
  onSelect,
  ctaText = "Elegir plan",
  className,
  ...props
}: OfferCardProps) {
  const isRecommended = offer.recommended;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between p-6 rounded-2xl border transition-all duration-200 bg-card",
        selected
          ? "border-primary ring-2 ring-primary/20 shadow-lg"
          : "border-border hover:border-foreground/20 hover:shadow-md",
        className,
      )}
      {...props}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <PromotionBadge
            label="⭐ Más Popular"
            variant="highlight"
            className="shadow-sm uppercase text-[10px] tracking-wider"
          />
        </div>
      )}

      <div>
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">{offer.title}</h3>
            {offer.subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{offer.subtitle}</p>
            )}
          </div>
        </div>

        <div className="my-5">
          <PriceDisplay
            basePrice={evaluation.basePrice}
            finalPrice={evaluation.finalPrice}
            unitLabel={offer.unitLabel}
            savingsBadge={evaluation.pricingBadge}
            size="lg"
            showReferenceLabel
          />
        </div>

        {offer.description && (
          <p className="text-sm text-muted-foreground mb-4">{offer.description}</p>
        )}

        {offer.benefits && offer.benefits.length > 0 && (
          <ul className="space-y-2 mb-6 border-t border-border/60 pt-4">
            {offer.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-foreground/90">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" />
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        onClick={() => onSelect?.(offer)}
        variant={selected ? "default" : "outline"}
        className="w-full font-semibold mt-2"
        size="lg"
      >
        {ctaText}
      </Button>
    </div>
  );
}
