/** Offer Pricing r2 read foundation. Never a financial capture authority. */
export class OfferPricingError extends Error {
  constructor(
    public readonly code:
      "PRICE_UNAVAILABLE" | "OFFER_NOT_FOUND" | "OFFER_AMBIGUOUS" | "OFFER_REFERENCE_INVALID",
  ) {
    super(code);
    this.name = "OfferPricingError";
  }
}

/** Validate before numeric(12,4) cast: PostgreSQL otherwise rounds extra scale. */
export function validateOfferPrice(value: unknown): number {
  if (typeof value !== "number" && typeof value !== "string")
    throw new OfferPricingError("PRICE_UNAVAILABLE");
  const text = String(value);
  if (!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,4})?$/.test(text))
    throw new OfferPricingError("PRICE_UNAVAILABLE");
  const result = Number(text);
  if (!Number.isFinite(result) || result < 0 || result > 99999999.9999)
    throw new OfferPricingError("PRICE_UNAVAILABLE");
  return result;
}

export type WeeklyMenuOfferView = {
  slotId: string;
  menuId: string;
  tenantId: string;
  dishId: string;
  dayDate: string;
  basePrice: number;
  slotPrice: number | null;
  effectivePrice: number;
  priceSource: "slot" | "catalogue";
};

export function offerPrices(
  base: unknown,
  slot: unknown,
): Pick<WeeklyMenuOfferView, "basePrice" | "slotPrice" | "effectivePrice" | "priceSource"> {
  const basePrice = validateOfferPrice(base);
  const slotPrice = slot == null ? null : validateOfferPrice(slot);
  return {
    basePrice,
    slotPrice,
    effectivePrice: slotPrice ?? basePrice,
    priceSource: slotPrice === null ? "catalogue" : "slot",
  };
}

/** Read-only compatibility lookup; never selects first/latest for old DTOs. */
export function selectWeeklyMenuOffer(
  offers: WeeklyMenuOfferView[],
  reference: {
    tenantId: string;
    menuId: string;
    dishId: string;
    dayDate: string;
    slotId?: string;
  },
): WeeklyMenuOfferView {
  const candidates = offers.filter(
    (offer) =>
      offer.tenantId === reference.tenantId &&
      offer.menuId === reference.menuId &&
      offer.dishId === reference.dishId &&
      offer.dayDate === reference.dayDate &&
      (reference.slotId === undefined || offer.slotId === reference.slotId),
  );
  if (candidates.length === 0) throw new OfferPricingError("OFFER_NOT_FOUND");
  if (candidates.length !== 1) throw new OfferPricingError("OFFER_AMBIGUOUS");
  return candidates[0]!;
}
