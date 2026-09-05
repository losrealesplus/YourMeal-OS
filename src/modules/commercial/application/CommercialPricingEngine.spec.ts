import { describe, expect, it } from "vitest";
import { CommercialPricingEngine, PRICING_ENGINE_VERSION } from "./CommercialPricingEngine";
import { MoneyUtil } from "../domain/money";
import type { CommercialOffer } from "../domain/types";

describe("CommercialPricingEngine — Pure Evaluation & Snapshot Engine", () => {
  const sampleOffers: Record<string, CommercialOffer> = {
    individual: {
      id: "offer_ind_01",
      code: "individual_menu",
      title: "Menú Individual",
      subtitle: "Platos sueltos",
      description: "Come saludable sin compromiso.",
      basePrice: MoneyUtil.fromCents(1190, "EUR"),
      unitLabel: "menú",
      slotsIncluded: 1,
      promotions: [],
    },
    weekly: {
      id: "offer_wk_01",
      code: "weekly_plan",
      title: "Plan Semanal",
      subtitle: "5 almuerzos de lunes a viernes",
      description: "Tu semana organizada.",
      basePrice: MoneyUtil.fromCents(5950, "EUR"),
      unitLabel: "semana",
      slotsIncluded: 5,
      promotions: [
        {
          id: "promo_wk_10",
          code: "PLAN_SEMANAL_10",
          name: "Descuento Plan Semanal",
          type: "percentage",
          value: 10.0,
          appliesTo: "offer_base",
          eligibility: "public",
        },
        {
          id: "promo_wk_extras_10",
          code: "EXTRAS_SEMANAL_10",
          name: "10% dto. en Extras",
          type: "percentage",
          value: 10.0,
          appliesTo: "extras",
          eligibility: "subscriber_weekly", // Strictly for weekly subscribers
        },
      ],
    },
    monthly: {
      id: "offer_mo_01",
      code: "monthly_plan",
      title: "Plan Mensual",
      subtitle: "Máximo ahorro por menú",
      description: "La mejor tarifa diaria.",
      basePrice: MoneyUtil.fromCents(1190, "EUR"),
      unitLabel: "menú",
      slotsIncluded: 20,
      promotions: [
        {
          id: "promo_mo_fixed_997",
          code: "PLAN_MENSUAL_997",
          name: "Tarifa Especial Plan Mensual",
          type: "fixed_price",
          value: 997, // 9,97 € in cents
          appliesTo: "offer_base",
          eligibility: "public",
        },
        {
          id: "promo_mo_extras_30",
          code: "EXTRAS_MENSUAL_30",
          name: "30% dto. en Extras",
          type: "percentage",
          value: 30.0,
          appliesTo: "extras",
          eligibility: "subscriber_monthly", // Strictly for monthly subscribers
        },
      ],
    },
  };

  it("1. Evaluates individual menu without promotions (base = final = 11,90 €)", () => {
    const result = CommercialPricingEngine.evaluate(sampleOffers.individual, {
      offerCode: "individual_menu",
      customerTier: "public",
    });

    expect(result.basePrice.cents).toBe(1190);
    expect(result.finalPrice.cents).toBe(1190);
    expect(result.totalSavings.cents).toBe(0);
    expect(result.hasDiscount).toBe(false);
    expect(result.pricingBadge).toBeNull();
    expect(result.appliedPromotions).toHaveLength(0);
  });

  it("2. Evaluates percentage promotion: 59,50 € with 10% -> 53,55 € (saving 5,95 €)", () => {
    const result = CommercialPricingEngine.evaluate(sampleOffers.weekly, {
      offerCode: "weekly_plan",
      customerTier: "public",
    });

    expect(result.basePrice.cents).toBe(5950);
    expect(result.basePrice.formatted).toBe("59,50 €");
    expect(result.finalPrice.cents).toBe(5355);
    expect(result.finalPrice.formatted).toBe("53,55 €");
    expect(result.totalSavings.cents).toBe(595);
    expect(result.totalSavings.formatted).toBe("5,95 €");
    expect(result.savingsPercentage).toBe(10);
    expect(result.hasDiscount).toBe(true);
    expect(result.pricingBadge).toBe("🟢 Ahorras 5,95 € (10%)");
    expect(result.appliedPromotions).toHaveLength(1);
    expect(result.appliedPromotions[0].discountCents).toBe(595);
    expect(result.appliedPromotions[0].formattedDiscount).toBe("5,95 €");
  });

  it("3. Evaluates fixed_price promotion: 11,90 € with target 9,97 € -> 1,93 € saving (16%)", () => {
    const result = CommercialPricingEngine.evaluate(sampleOffers.monthly, {
      offerCode: "monthly_plan",
      customerTier: "public",
    });

    expect(result.basePrice.cents).toBe(1190);
    expect(result.finalPrice.cents).toBe(997);
    expect(result.finalPrice.formatted).toBe("9,97 €");
    expect(result.totalSavings.cents).toBe(193);
    expect(result.totalSavings.formatted).toBe("1,93 €");
    expect(result.savingsPercentage).toBe(16);
    expect(result.hasDiscount).toBe(true);
    expect(result.pricingBadge).toBe("🟢 Ahorras 1,93 € (16%)");
    expect(result.appliedPromotions).toHaveLength(1);
    expect(result.appliedPromotions[0].discountCents).toBe(193);
    expect(result.appliedPromotions[0].formattedDiscount).toBe("1,93 €");
  });

  it("4. Evaluates fixed_amount promotion correctly", () => {
    const offerWithFixedDiscount: CommercialOffer = {
      ...sampleOffers.individual,
      promotions: [
        {
          id: "promo_fixed_200",
          code: "DISCOUNT_2EUR",
          name: "Descuento 2 €",
          type: "fixed_amount",
          value: 200, // 2,00 €
          appliesTo: "offer_base",
          eligibility: "public",
        },
      ],
    };

    const result = CommercialPricingEngine.evaluate(offerWithFixedDiscount, {
      offerCode: "individual_menu",
      customerTier: "public",
    });

    expect(result.basePrice.cents).toBe(1190);
    expect(result.finalPrice.cents).toBe(990);
    expect(result.totalSavings.cents).toBe(200);
    expect(result.savingsPercentage).toBe(17);
  });

  it("5. Strict tier eligibility for extras: public customer gets 0% discount on subscriber extras", () => {
    const extras = [
      {
        dishId: "dish_crema_01",
        dishName: "Crema de calabaza asada",
        basePriceCents: 450, // 4,50 €
        qty: 1,
      },
    ];

    // Public customer evaluating weekly offer: does NOT get 10% extra discount
    const publicWeeklyResult = CommercialPricingEngine.evaluate(sampleOffers.weekly, {
      offerCode: "weekly_plan",
      customerTier: "public",
      extras,
    });
    expect(publicWeeklyResult.extrasBreakdown[0].finalUnitPrice.cents).toBe(450);
    expect(publicWeeklyResult.extrasBreakdown[0].totalSavings.cents).toBe(0);
    expect(publicWeeklyResult.extrasBreakdown[0].appliedPromotion).toBeNull();

    // Public customer evaluating monthly offer: does NOT get 30% extra discount
    const publicMonthlyResult = CommercialPricingEngine.evaluate(sampleOffers.monthly, {
      offerCode: "monthly_plan",
      customerTier: "public",
      extras,
    });
    expect(publicMonthlyResult.extrasBreakdown[0].finalUnitPrice.cents).toBe(450);
    expect(publicMonthlyResult.extrasBreakdown[0].totalSavings.cents).toBe(0);
    expect(publicMonthlyResult.extrasBreakdown[0].appliedPromotion).toBeNull();
  });

  it("6. Evaluates optional extras with subscriber tier-specific discounts (10% weekly vs 30% monthly)", () => {
    const extras = [
      {
        dishId: "dish_crema_01",
        dishName: "Crema de calabaza asada",
        basePriceCents: 450, // 4,50 €
        qty: 1,
      },
    ];

    // Weekly subscriber extra: 4,50 € with 10% -> 4,05 € (saving 0,45 €)
    const weeklyResult = CommercialPricingEngine.evaluate(sampleOffers.weekly, {
      offerCode: "weekly_plan",
      customerTier: "subscriber_weekly",
      extras,
    });

    expect(weeklyResult.extrasBreakdown).toHaveLength(1);
    const weeklyExtra = weeklyResult.extrasBreakdown[0];
    expect(weeklyExtra.baseUnitPrice.cents).toBe(450);
    expect(weeklyExtra.finalUnitPrice.cents).toBe(405);
    expect(weeklyExtra.totalSavings.cents).toBe(45);
    expect(weeklyExtra.savingsPercentage).toBe(10);
    expect(weeklyResult.grandTotalFinalPrice.cents).toBe(5355 + 405); // 5760 cents = 57,60 €

    // Monthly subscriber extra: 4,50 € with 30% -> 3,15 € (saving 1,35 €)
    const monthlyResult = CommercialPricingEngine.evaluate(sampleOffers.monthly, {
      offerCode: "monthly_plan",
      customerTier: "subscriber_monthly",
      extras,
    });

    expect(monthlyResult.extrasBreakdown).toHaveLength(1);
    const monthlyExtra = monthlyResult.extrasBreakdown[0];
    expect(monthlyExtra.baseUnitPrice.cents).toBe(450);
    expect(monthlyExtra.finalUnitPrice.cents).toBe(315);
    expect(monthlyExtra.totalSavings.cents).toBe(135);
    expect(monthlyExtra.savingsPercentage).toBe(30);
  });

  it("7. Multi-promotion stacking policy: sequential stackable promotions", () => {
    const multiPromoOffer: CommercialOffer = {
      id: "offer_multi",
      code: "multi_promo_offer",
      title: "Oferta con Descuentos Acumulables",
      subtitle: "Multi-promo",
      description: "Test stacking",
      basePrice: MoneyUtil.fromCents(10000, "EUR"), // 100,00 €
      unitLabel: "pack",
      slotsIncluded: 1,
      promotions: [
        {
          id: "p1",
          code: "PROMO_10_PCT",
          name: "10% Inicial",
          type: "percentage",
          value: 10.0,
          appliesTo: "offer_base",
          eligibility: "public",
          stackable: true,
          priority: 10,
        },
        {
          id: "p2",
          code: "PROMO_5_EUR",
          name: "5 € Cupón",
          type: "fixed_amount",
          value: 500, // 5,00 €
          appliesTo: "offer_base",
          eligibility: "public",
          stackable: true,
          priority: 5,
        },
      ],
    };

    const result = CommercialPricingEngine.evaluate(multiPromoOffer, {
      offerCode: "multi_promo_offer",
      customerTier: "public",
    });

    // 100,00 € -> 10% discount = 10,00 € (running: 90,00 €)
    // 90,00 € -> 5,00 € discount = 5,00 € (final: 85,00 €)
    expect(result.basePrice.cents).toBe(10000);
    expect(result.finalPrice.cents).toBe(8500);
    expect(result.totalSavings.cents).toBe(1500);
    expect(result.appliedPromotions).toHaveLength(2);
    expect(result.appliedPromotions[0].discountCents).toBe(1000);
    expect(result.appliedPromotions[1].discountCents).toBe(500);
  });

  it("8. Generates immutable OrderPriceSnapshot with explicit line items (no total division)", () => {
    const evalResult = CommercialPricingEngine.evaluate(sampleOffers.weekly, {
      offerCode: "weekly_plan",
      customerTier: "subscriber_weekly",
      extras: [
        {
          dishId: "dish_crema_01",
          dishName: "Crema de calabaza asada",
          basePriceCents: 450,
          qty: 1,
        },
      ],
    });

    const explicitLineItems = [
      {
        slotId: "slot_01",
        dishId: "dish_chicken_01",
        dishName: "Pechuga de pollo al grill",
        itemType: "menu_dish" as const,
        qty: 1,
        basePriceCents: 1190,
        finalPriceCents: 1071,
        discountCents: 119,
      },
      {
        slotId: "slot_02",
        dishId: "dish_salmon_01",
        dishName: "Salmón al horno",
        itemType: "menu_dish" as const,
        qty: 1,
        basePriceCents: 1190,
        finalPriceCents: 1071,
        discountCents: 119,
      },
    ];

    const snapshot = CommercialPricingEngine.createSnapshot(evalResult, {
      orderId: "ord_test_2026",
      lineItems: explicitLineItems,
    });

    expect(snapshot.orderId).toBe("ord_test_2026");
    expect(snapshot.offerCode).toBe("weekly_plan");
    expect(snapshot.customerTier).toBe("subscriber_weekly");
    expect(snapshot.baseAmountCents).toBe(5950 + 450); // 6400 cents = 64,00 €
    expect(snapshot.discountAmountCents).toBe(595 + 45); // 640 cents = 6,40 €
    expect(snapshot.finalAmountCents).toBe(5355 + 405); // 5760 cents = 57,60 €
    expect(snapshot.currency).toBe("EUR");
    expect(snapshot.engineVersion).toBe(PRICING_ENGINE_VERSION);
    expect(snapshot.items).toHaveLength(3); // 2 explicit menu dishes + 1 extra
    expect(snapshot.items[0].dishName).toBe("Pechuga de pollo al grill");
    expect(snapshot.items[0].basePriceCents).toBe(1190);
    expect(snapshot.items[0].finalPriceCents).toBe(1071);
    expect(snapshot.items[2].itemType).toBe("extra");
    expect(snapshot.items[2].dishName).toBe("Crema de calabaza asada");
    expect(snapshot.items[2].finalPriceCents).toBe(405);

    // Verify individual promotion discount integrity
    expect(snapshot.appliedPromotions).toHaveLength(1);
    expect(snapshot.appliedPromotions[0].discountCents).toBe(595);
  });
});
