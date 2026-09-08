import type { CommercialOffer, CustomerTier } from "../domain/types";
import { MoneyUtil } from "../domain/money";

/**
 * Universal Tenant Commercial Offer Registry.
 * Instances configure their commercial offers; Core provides deterministic resolution.
 */
const tenantOffersRegistry = new Map<string, CommercialOffer[]>();

/**
 * Canonical default offers for known tenants when operating in standalone mode.
 */
export const CANONICAL_TENANT_OFFERS: Record<string, CommercialOffer[]> = {
  eatclean: [
    {
      id: "eatclean_offer_individual",
      code: "individual_menu",
      title: "Pedido Individual",
      subtitle: "Elige tus platos para días puntuales",
      description: "Cocina saludable sin compromiso.",
      basePrice: MoneyUtil.fromCents(1190, "EUR"),
      unitLabel: "menú",
      slotsIncluded: 1,
      promotions: [],
    },
    {
      id: "eatclean_offer_weekly",
      code: "weekly_plan",
      title: "Suscripción Semanal",
      subtitle: "5 almuerzos de Lunes a Viernes",
      description: "Come saludable toda la semana sin tener que cocinar.",
      basePrice: MoneyUtil.fromCents(5950, "EUR"),
      unitLabel: "semana",
      slotsIncluded: 5,
      promotions: [
        {
          id: "promo_eatclean_weekly_10",
          code: "SEMANAL_10",
          name: "Descuento Plan Semanal",
          type: "percentage",
          value: 10.0,
          appliesTo: "offer_base",
          eligibility: "public",
          badgeLabel: "🟢 Ahorras 5,95 € (10%)",
        },
        {
          id: "promo_eatclean_weekly_extras_10",
          code: "EXTRAS_SEMANAL_10",
          name: "10% dto. en Extras",
          type: "percentage",
          value: 10.0,
          appliesTo: "extras",
          eligibility: "subscriber_weekly",
        },
      ],
    },
    {
      id: "eatclean_offer_monthly",
      code: "monthly_plan",
      title: "Suscripción Mensual",
      subtitle: "La máxima comodidad al mejor precio por menú",
      description: "La mejor tarifa diaria para tu planificación alimentaria.",
      basePrice: MoneyUtil.fromCents(1190, "EUR"),
      unitLabel: "menú",
      slotsIncluded: 20,
      promotions: [
        {
          id: "promo_eatclean_monthly_fixed_997",
          code: "MENSUAL_997",
          name: "Tarifa Especial Plan Mensual",
          type: "fixed_price",
          value: 997,
          appliesTo: "offer_base",
          eligibility: "public",
          badgeLabel: "🟢 Ahorras 1,93 € (16%)",
        },
        {
          id: "promo_eatclean_monthly_extras_30",
          code: "EXTRAS_MENSUAL_30",
          name: "30% dto. en Extras",
          type: "percentage",
          value: 30.0,
          appliesTo: "extras",
          eligibility: "subscriber_monthly",
        },
      ],
    },
  ],
};

/**
 * Register or override commercial offers for a specific tenant.
 */
export function registerTenantOffers(tenantSlug: string, offers: CommercialOffer[]): void {
  tenantOffersRegistry.set(tenantSlug.toLowerCase().trim(), offers);
}

/**
 * Retrieve commercial offers for a tenant.
 */
export function getTenantOffers(tenantSlug: string): CommercialOffer[] {
  const normalized = tenantSlug.toLowerCase().trim();
  const registered = tenantOffersRegistry.get(normalized);
  if (registered && registered.length > 0) return registered;
  return CANONICAL_TENANT_OFFERS[normalized] ?? [];
}

/**
 * Resolves the appropriate commercial offer based on explicit offer code or customer/order context.
 */
export function resolveCommercialOffer(
  tenantSlug: string,
  context: {
    offerCode?: string;
    menuCount?: number;
    customerTier?: CustomerTier;
  },
): CommercialOffer | null {
  const offers = getTenantOffers(tenantSlug);
  if (!offers || offers.length === 0) return null;

  // 1. Explicit offer code matching
  if (context.offerCode) {
    const matched = offers.find((o) => o.code === context.offerCode);
    if (matched) return matched;
  }

  // 2. Tier-specific default (e.g. monthly subscriber)
  if (context.customerTier === "subscriber_monthly") {
    const monthly = offers.find((o) => o.code === "monthly_plan");
    if (monthly) return monthly;
  }

  // 3. Multi-slot plan matching if menuCount matches package size
  const menuCount = context.menuCount ?? 1;
  if (menuCount >= 5) {
    const weekly = offers.find((o) => o.code === "weekly_plan");
    if (weekly) return weekly;
  }

  // 4. Default to individual menu or first available offer
  return offers.find((o) => o.code === "individual_menu") ?? offers[0] ?? null;
}
