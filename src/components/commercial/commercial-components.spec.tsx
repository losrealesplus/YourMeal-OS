import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { PriceDisplay } from "./PriceDisplay";
import { PromotionBadge } from "./PromotionBadge";
import { OrderPricingSummary } from "./OrderPricingSummary";
import { OfferCard } from "./OfferCard";
import { OfferSelector, type EvaluatedOfferItem } from "./OfferSelector";
import { MoneyUtil } from "@/modules/commercial/domain/money";
import { CommercialPricingEngine } from "@/modules/commercial/application/CommercialPricingEngine";
import type { CommercialOffer } from "@/modules/commercial/domain/types";

describe("Commercial UI Components — Zero Client Math & HTML Rendering", () => {
  it("renders PromotionBadge correctly", () => {
    const html = renderToString(<PromotionBadge label="🟢 Ahorras 1,93 € (16%)" />);
    expect(html).toContain("🟢 Ahorras 1,93 € (16%)");
  });

  it("renders PriceDisplay with reference price struck through and evaluated final price", () => {
    const base = MoneyUtil.fromCents(1190, "EUR");
    const final = MoneyUtil.fromCents(997, "EUR");

    const html = renderToString(
      <PriceDisplay
        basePrice={base}
        finalPrice={final}
        unitLabel="menú"
        savingsBadge="🟢 Ahorras 1,93 € (16%)"
        showReferenceLabel
      />,
    );

    expect(html).toContain("11,90 €");
    expect(html).toContain("9,97 €");
    expect(html).toContain("/ menú");
    expect(html).toContain("🟢 Ahorras 1,93 € (16%)");
    expect(html).toContain("Precio habitual:");
    expect(html).toContain("line-through");
  });

  it("renders OfferCard with all benefits and CTA text", () => {
    const offer: CommercialOffer = {
      id: "off_mo",
      code: "monthly_plan",
      title: "Plan Mensual",
      subtitle: "Máximo ahorro",
      description: "El mejor precio garantizado",
      basePrice: MoneyUtil.fromCents(1190, "EUR"),
      unitLabel: "menú",
      slotsIncluded: 20,
      benefits: ["Reparto gratuito", "30% dto. en extras"],
      recommended: true,
      promotions: [
        {
          id: "p_mo",
          code: "PLAN_997",
          name: "Plan Mensual",
          type: "fixed_price",
          value: 997,
          appliesTo: "offer_base",
          eligibility: "public",
        },
      ],
    };

    const evaluation = CommercialPricingEngine.evaluate(offer, {
      offerCode: "monthly_plan",
      customerTier: "public",
    });

    const html = renderToString(
      <OfferCard offer={offer} evaluation={evaluation} selected={true} ctaText="Plan seleccionado" />,
    );

    expect(html).toContain("Plan Mensual");
    expect(html).toContain("Máximo ahorro");
    expect(html).toContain("9,97 €");
    expect(html).toContain("11,90 €");
    expect(html).toContain("Reparto gratuito");
    expect(html).toContain("30% dto. en extras");
    expect(html).toContain("⭐ Más Popular");
    expect(html).toContain("Plan seleccionado");
  });

  it("renders OfferSelector containing pre-evaluated offers without client-side math", () => {
    const indOffer: CommercialOffer = {
      id: "ind",
      code: "individual",
      title: "Individual",
      subtitle: "Días sueltos",
      description: "Sin suscripción",
      basePrice: MoneyUtil.fromCents(1190, "EUR"),
      unitLabel: "menú",
      slotsIncluded: 1,
      promotions: [],
    };

    const wkOffer: CommercialOffer = {
      id: "wk",
      code: "weekly",
      title: "Semanal",
      subtitle: "L-V",
      description: "10% dto.",
      basePrice: MoneyUtil.fromCents(5950, "EUR"),
      unitLabel: "semana",
      slotsIncluded: 5,
      promotions: [
        {
          id: "pwk",
          code: "SEMANAL_10",
          name: "10% Semanal",
          type: "percentage",
          value: 10.0,
          appliesTo: "offer_base",
          eligibility: "public",
        },
      ],
    };

    const evaluatedOffers: EvaluatedOfferItem[] = [
      {
        offer: indOffer,
        evaluation: CommercialPricingEngine.evaluate(indOffer, { offerCode: "individual", customerTier: "public" }),
      },
      {
        offer: wkOffer,
        evaluation: CommercialPricingEngine.evaluate(wkOffer, { offerCode: "weekly", customerTier: "public" }),
      },
    ];

    const html = renderToString(
      <OfferSelector evaluatedOffers={evaluatedOffers} title="Elige tu modalidad" subtitle="Planes saludables" />,
    );

    expect(html).toContain("Elige tu modalidad");
    expect(html).toContain("Planes saludables");
    expect(html).toContain("Individual");
    expect(html).toContain("11,90 €");
    expect(html).toContain("Semanal");
    expect(html).toContain("53,55 €");
    expect(html).toContain("59,50 €");
  });

  it("renders OrderPricingSummary with transparent breakdown of base, promotions, extras and grand total", () => {
    const offer: CommercialOffer = {
      id: "off_wk",
      code: "weekly_plan",
      title: "Plan Semanal",
      subtitle: "5 almuerzos",
      description: "Test",
      basePrice: MoneyUtil.fromCents(5950, "EUR"),
      unitLabel: "semana",
      slotsIncluded: 5,
      promotions: [
        {
          id: "p_wk",
          code: "SEMANAL_10",
          name: "Descuento Plan Semanal",
          type: "percentage",
          value: 10.0,
          appliesTo: "offer_base",
          eligibility: "public",
        },
      ],
    };

    const evaluation = CommercialPricingEngine.evaluate(offer, {
      offerCode: "weekly_plan",
      customerTier: "public",
      extras: [
        {
          dishId: "d1",
          dishName: "Crema de calabaza",
          basePriceCents: 450,
          qty: 1,
        },
      ],
    });

    const html = renderToString(<OrderPricingSummary evaluation={evaluation} shippingLabel="Gratis" />);

    expect(html).toContain("Resumen del pedido");
    expect(html).toContain("59,50 €");
    expect(html).toContain("-5,95 €");
    expect(html).toContain("Descuento Plan Semanal");
    expect(html).toContain("Crema de calabaza");
    expect(html).toContain("Gratis");
    expect(html).toContain("58,05 €"); // 53,55 + 4,50 = 58,05 €
    expect(html).toContain("¡Ahorras 5,95 € en este pedido!");
  });
});
