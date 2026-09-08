import { CommercialPricingEngine } from "./CommercialPricingEngine";
import { resolveCommercialOffer } from "./commercial-offer-registry";
import type {
  CustomerTier,
  ExtraItemInput,
  PricingEvaluationResult,
} from "../domain/types";

export interface OrderPricingResolutionInput {
  tenantSlug?: string;
  customerTier?: CustomerTier;
  offerCode?: string;
  items: Array<{
    dishId: string;
    dayDate: string;
    qty: number;
  }>;
  extras?: ExtraItemInput[];
}

/**
 * Resolves commercial pricing for an order context.
 * Returns null when the tenant has no commercial offers configured or no tenantSlug provided.
 * In that case, callers fall back to standard a-la-carte catalog dish pricing.
 */
export function resolveOrderCommercialPricing(
  input: OrderPricingResolutionInput,
): PricingEvaluationResult | null {
  if (!input.tenantSlug) {
    return null;
  }

  if (!input.items || input.items.length === 0) {
    return null;
  }

  const customerTier: CustomerTier = input.customerTier ?? "public";

  const offer = resolveCommercialOffer(input.tenantSlug, {
    offerCode: input.offerCode,
    customerTier,
    menuCount: input.items.length,
  });

  if (!offer) {
    return null;
  }

  return CommercialPricingEngine.evaluate(offer, {
    offerCode: offer.code,
    customerTier,
    extras: input.extras ?? [],
  });
}
