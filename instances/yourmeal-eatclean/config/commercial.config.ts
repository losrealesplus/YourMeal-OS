/**
 * YOURMEAL OS — EATCLEAN COMMERCIAL PRICING CONFIGURATION
 *
 * Tenant-specific commercial offers, price books, and promotional benefits
 * for EatClean Tenerife Catering.
 *
 * Architectural Invariant (FASE 3N-R2):
 * Evaluated through the Core Universal CommercialPricingEngine.
 * 0 × client-side math. Prices, promotions, and savings are evaluated deterministically in integer cents.
 * Automatically registers EatClean commercial offers into Core's universal registry.
 */

import { registerTenantOffers } from "../../YourMeal-OS/src/modules/commercial";
import type { CommercialOffer } from "../../YourMeal-OS/src/modules/commercial";

export const EATCLEAN_COMMERCIAL_OFFERS: CommercialOffer[] = [
  {
    id: "eatclean_offer_individual",
    code: "individual_menu",
    title: "Pedido Individual",
    subtitle: "Elige tus platos para días puntuales",
    description: "Cocina saludable sin compromiso.",
    pricingModel: "per_unit",
    basePrice: {
      cents: 1190,
      currency: "EUR",
      formatted: "11,90 €",
    },
    unitLabel: "menú",
    slotsIncluded: 1,
    benefits: [
      "Más de 100 opciones de menú",
      "Cocina saludable al grill y horno",
      "Ingredientes 100% naturales",
      "Reparto gratuito",
    ],
    recommended: false,
    promotions: [],
  },
  {
    id: "eatclean_offer_weekly",
    code: "weekly_plan",
    title: "Suscripción Semanal",
    subtitle: "5 almuerzos de Lunes a Viernes",
    description: "Come saludable toda la semana sin tener que cocinar.",
    pricingModel: "fixed_package",
    basePrice: {
      cents: 5950,
      currency: "EUR",
      formatted: "59,50 €",
    },
    unitLabel: "semana",
    slotsIncluded: 5,
    benefits: [
      "5 almuerzos completos (Lunes a Viernes)",
      "10% de descuento en todos los extras",
      "Reparto gratuito diario",
      "Sin permanencia",
    ],
    recommended: false,
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
    pricingModel: "per_unit",
    basePrice: {
      cents: 1190,
      currency: "EUR",
      formatted: "11,90 €",
    },
    unitLabel: "menú",
    slotsIncluded: 20,
    benefits: [
      "Tarifa especial reducida por menú",
      "30% de descuento en todos los extras",
      "Reparto gratuito",
      "Atención y personalización prioritaria",
    ],
    recommended: true,
    promotions: [
      {
        id: "promo_eatclean_monthly_fixed_997",
        code: "MENSUAL_997",
        name: "Tarifa Especial Plan Mensual",
        type: "fixed_price",
        value: 997, // 9,97 € en céntimos
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
];

/**
 * Deterministic runtime registration of EatClean commercial offers into Core registry.
 */
export function registerEatCleanCommercialOffers(): void {
  registerTenantOffers("eatclean", EATCLEAN_COMMERCIAL_OFFERS);
}

// Auto-register at bootstrap/runtime
registerEatCleanCommercialOffers();
