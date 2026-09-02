import { useState, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
  CommercialPricingEngine,
  type CommercialOffer,
  type CustomerTier,
  type PricingEvaluationResult,
} from "@/modules/commercial";
import { OfferCard } from "./OfferCard";

export interface OfferSelectorProps extends HTMLAttributes<HTMLDivElement> {
  offers: CommercialOffer[];
  customerTier?: CustomerTier;
  selectedOfferCode?: string;
  onSelectOffer?: (offer: CommercialOffer, evaluation: PricingEvaluationResult) => void;
  title?: string;
  subtitle?: string;
}

export function OfferSelector({
  offers,
  customerTier = "public",
  selectedOfferCode,
  onSelectOffer,
  title = "Elige tu plan",
  subtitle = "Selecciona la modalidad que mejor se adapta a tu rutina.",
  className,
  ...props
}: OfferSelectorProps) {
  const [internalSelected, setInternalSelected] = useState<string>(
    selectedOfferCode ?? offers[0]?.code ?? "",
  );

  const activeCode = selectedOfferCode ?? internalSelected;

  const handleSelect = (offer: CommercialOffer) => {
    setInternalSelected(offer.code);
    const evaluation = CommercialPricingEngine.evaluate(offer, {
      offerCode: offer.code,
      customerTier,
    });
    onSelectOffer?.(offer, evaluation);
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
        {offers.map((offer) => {
          const evaluation = CommercialPricingEngine.evaluate(offer, {
            offerCode: offer.code,
            customerTier,
          });
          const isSelected = offer.code === activeCode;

          return (
            <OfferCard
              key={offer.id || offer.code}
              offer={offer}
              evaluation={evaluation}
              selected={isSelected}
              onSelect={handleSelect}
              ctaText={isSelected ? "Plan seleccionado" : "Elegir este plan"}
            />
          );
        })}
      </div>
    </section>
  );
}
