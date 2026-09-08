import type { CommercialOffer, CustomerTier } from "../domain/types";

/**
 * Universal Tenant Commercial Offer Registry.
 *
 * Architectural Invariant (FASE 3N-R):
 * Core (YourMeal-OS) provides the registry interface and evaluation engine.
 * Tenant instances (e.g., YourMeal-EatClean) register their own concrete offers,
 * price books, and promotions at initialization or bootstrap.
 *
 * Core contains ZERO hardcoded tenant prices, offers, or defaults.
 */
const tenantOffersRegistry = new Map<string, CommercialOffer[]>();

/**
 * Register commercial offers for a specific tenant slug.
 */
export function registerTenantOffers(tenantSlug: string, offers: CommercialOffer[]): void {
  if (!tenantSlug) return;
  tenantOffersRegistry.set(tenantSlug.toLowerCase().trim(), [...offers]);
}

/**
 * Retrieve commercial offers registered for a tenant.
 */
export function getTenantOffers(tenantSlug?: string | null): CommercialOffer[] {
  if (!tenantSlug) return [];
  const normalized = tenantSlug.toLowerCase().trim();
  return tenantOffersRegistry.get(normalized) ?? [];
}

/**
 * Clear registry (primarily for test isolation and multi-tenant teardown).
 */
export function clearTenantOffersRegistry(): void {
  tenantOffersRegistry.clear();
}

/**
 * Resolves the appropriate commercial offer based on explicit offer code or customer tier.
 *
 * Invariant:
 * 1. Explicit offerCode always takes priority.
 * 2. Active subscriber tier maps to tier-specific plan if available.
 * 3. Default fallback to offer marked isDefault, code "individual_menu", or first available offer.
 * 4. Never deduce or switch offer type silently based solely on itemCount/menuCount.
 */
export function resolveCommercialOffer(
  tenantSlug: string | undefined | null,
  context: {
    offerCode?: string;
    customerTier?: CustomerTier;
    menuCount?: number;
  },
): CommercialOffer | null {
  if (!tenantSlug) return null;
  const offers = getTenantOffers(tenantSlug);
  if (!offers || offers.length === 0) return null;

  // 1. Explicit offer code matching
  if (context.offerCode) {
    const matched = offers.find((o) => o.code === context.offerCode);
    if (matched) return matched;
  }

  // 2. Tier-specific matching for active subscribers
  if (context.customerTier === "subscriber_monthly") {
    const monthly = offers.find((o) => o.code === "monthly_plan");
    if (monthly) return monthly;
  }
  if (context.customerTier === "subscriber_weekly") {
    const weekly = offers.find((o) => o.code === "weekly_plan");
    if (weekly) return weekly;
  }

  // 3. Fallback to default offer (explicit isDefault or first registered)
  const defaultOffer =
    offers.find((o) => (o as { isDefault?: boolean }).isDefault) ??
    offers.find((o) => o.code === "individual_menu") ??
    offers[0];

  return defaultOffer ?? null;
}
