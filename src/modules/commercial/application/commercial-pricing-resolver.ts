import { CommercialPricingEngine } from "./CommercialPricingEngine";
import { resolveCommercialOffer } from "./commercial-offer-registry";
import { DomainError } from "../../../domain/errors";
import type {
  CustomerTier,
  ExtraItemInput,
  PricingEvaluationResult,
} from "../domain/types";

export interface OrderPricingResolutionInput {
  tenantSlug?: string | null;
  customerTier?: CustomerTier;
  offerCode?: string;
  /** Explicit number of billable menu units / packages. If omitted, deduced from non-extra item context */
  menuUnits?: number;
  items?: Array<{
    dishId: string;
    dayDate: string;
    qty: number;
    isExtra?: boolean;
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

  const hasItems = input.items && input.items.length > 0;
  const hasExtras = input.extras && input.extras.length > 0;
  if (!hasItems && !hasExtras) {
    return null;
  }

  const customerTier: CustomerTier = input.customerTier ?? "public";

  const offer = resolveCommercialOffer(input.tenantSlug, {
    offerCode: input.offerCode,
    customerTier,
  });

  if (!offer) {
    return null;
  }

  // Determine billable menu units
  let menuUnits: number;
  if (input.menuUnits !== undefined) {
    menuUnits = Math.max(0, input.menuUnits);
  } else if (hasItems) {
    const nonExtraItems = (input.items ?? []).filter((i) => !i.isExtra);
    const pricingModel =
      offer.pricingModel ?? (offer.slotsIncluded > 1 ? "fixed_package" : "per_unit");

    if (nonExtraItems.length === 0) {
      menuUnits = 0;
    } else if (pricingModel === "fixed_package") {
      const totalMealUnits = nonExtraItems.reduce(
        (sum, item) => sum + (item.qty ?? 1),
        0,
      );
      if (offer.slotsIncluded > 0 && totalMealUnits > offer.slotsIncluded) {
        throw new DomainError(
          "INVALID_STATE",
          `El plan '${offer.title}' admite un máximo de ${offer.slotsIncluded} comidas (se han seleccionado ${totalMealUnits}).`,
          {
            offerCode: offer.code,
            slotsIncluded: offer.slotsIncluded,
            selectedMealUnits: totalMealUnits,
          },
        );
      }
      menuUnits = 1;
    } else {
      // Unit-based plan (e.g. individual_menu / monthly_plan priced per billable meal unit)
      // Every non-extra item dish qty represents a billable meal unit regardless of delivery day
      const totalMealUnits = nonExtraItems.reduce(
        (sum, item) => sum + (item.qty ?? 1),
        0,
      );
      menuUnits = Math.max(0, totalMealUnits);
    }
  } else {
    menuUnits = 0;
  }

  return CommercialPricingEngine.evaluate(offer, {
    offerCode: offer.code,
    customerTier,
    menuUnits,
    extras: input.extras ?? [],
  });
}
