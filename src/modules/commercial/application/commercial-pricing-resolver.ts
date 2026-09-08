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
 * Returns null when the tenant has no commercial offers configured (a-la-carte fallback).
 */
export function resolveOrderCommercialPricing(
  input: OrderPricingResolutionInput,
): PricingEvaluationResult | null {
  const tenantSlug = input.tenantSlug ?? "eatclean";
  const customerTier: CustomerTier = input.customerTier ?? "public";

  if (!input.items || input.items.length === 0) {
    return null;
  }

  // Calculate distinct delivery days / menu slots
  const distinctDays = new Set(input.items.map((i) => i.dayDate)).size;
  const menuCount = Math.max(1, distinctDays);

  const offer = resolveCommercialOffer(tenantSlug, {
    offerCode: input.offerCode,
    menuCount,
    customerTier,
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
