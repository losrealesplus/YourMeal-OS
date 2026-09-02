import { useState, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { CommercialOffer, PricingEvaluationResult } from "@/modules/commercial";
import { OfferCard } from "./OfferCard";

export interface EvaluatedOfferItem {
  offer: CommercialOffer;
  evaluation: PricingEvaluationResult;
}

export interface OfferSelectorProps extends HTMLAttributes<HTMLDivElement> {
  evaluatedOffers: EvaluatedOfferItem[];
  selectedOfferCode?: string;
  onSelectOffer?: (offer: CommercialOffer, evaluation: PricingEvaluationResult) => void;
  title?: string;
  subtitle?: string;
}

export function OfferSelector({
  evaluatedOffers,
  selectedOfferCode,
  onSelectOffer,
  title = "Elige tu plan",
  subtitle = "Selecciona la modalidad que mejor se adapta a tu rutina.",
  className,
  ...props
}: OfferSelectorProps) {
  const [internalSelected, setInternalSelected] = useState<string>(
    selectedOfferCode ?? evaluatedOffers[0]?.offer.code ?? "",
  );

  const activeCode = selectedOfferCode ?? internalSelected;

  const handleSelect = (item: EvaluatedOfferItem) => {
    setInternalSelected(item.offer.code);
    onSelectOffer?.(item.offer, item.evaluation);
  };

  return (
    <section className={cn("w-full py-6", className)} {...props}>
      {(title || subtitle) && (
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          {title && (
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm sm:text-base text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {evaluatedOffers.map((item) => {
          const isSelected = item.offer.code === activeCode;

          return (
            <OfferCard
              key={item.offer.id || item.offer.code}
              offer={item.offer}
              evaluation={item.evaluation}
              selected={isSelected}
              onSelect={() => handleSelect(item)}
              ctaText={isSelected ? "Plan seleccionado" : "Elegir este plan"}
            />
          );
        })}
      </div>
    </section>
  );
}
