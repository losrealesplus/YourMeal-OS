import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearTenantOffersRegistry,
  registerTenantOffers,
  getTenantOffers,
  resolveOrderCommercialPricing,
  CommercialPricingEngine,
} from "@/modules/commercial";
import {
  utcWeekStartMonday,
  offsetWeekMonday,
  formatWeekRangeEs,
  isPastWeek,
  MAX_FUTURE_WEEKS,
} from "@/modules/weekly-menu/application/week-dates";
import { resolveActiveTenantSlug } from "@/identity/active-tenant-slug";
import { EATCLEAN_COMMERCIAL_OFFERS, registerEatCleanCommercialOffers } from "../../../../instances/yourmeal-eatclean/config/commercial.config";

describe("FASE 3N-S1 — Tenant Context Resolution + Future Week Scheduling", () => {
  beforeEach(() => {
    clearTenantOffersRegistry();
  });

  afterEach(() => {
    clearTenantOffersRegistry();
  });

  describe("1. Real EatClean Runtime Registration & Calculation", () => {
    it("A. Registers EatClean commercial offers and computes 1 individual menu -> 11,90 €", () => {
      registerEatCleanCommercialOffers();
      const offers = getTenantOffers("eatclean");
      expect(offers).toHaveLength(3);

      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "individual_menu",
        items: [
          { dishId: "dish-01", dayDate: "2026-09-07", qty: 1 },
        ],
      });

      expect(pricing).not.toBeNull();
      expect(pricing?.grandTotalFinalPrice.cents).toBe(1190);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("11,90 €");
      expect(pricing?.offerCode).toBe("individual_menu");
    });

    it("B. Computes 5 menus weekly plan -> 53,55 € (with weekly plan discount)", () => {
      registerEatCleanCommercialOffers();

      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "weekly_plan",
        items: [
          { dishId: "dish-01", dayDate: "2026-09-07", qty: 1 },
          { dishId: "dish-02", dayDate: "2026-09-08", qty: 1 },
          { dishId: "dish-03", dayDate: "2026-09-09", qty: 1 },
          { dishId: "dish-04", dayDate: "2026-09-10", qty: 1 },
          { dishId: "dish-05", dayDate: "2026-09-11", qty: 1 },
        ],
      });

      expect(pricing).not.toBeNull();
      expect(pricing?.grandTotalFinalPrice.cents).toBe(5355);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("53,55 €");
      expect(pricing?.finalPrice.cents).toBe(5355);
      expect(pricing?.offerCode).toBe("weekly_plan");
    });

    it("C. Computes 20 monthly plan menus -> 199,40 € (20 daily menus @ 9,97 €)", () => {
      registerEatCleanCommercialOffers();

      const items = Array.from({ length: 20 }, (_, i) => ({
        dishId: `dish-${i + 1}`,
        dayDate: `2026-09-${String(i + 1).padStart(2, "0")}`,
        qty: 1,
      }));

      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "monthly_plan",
        items,
      });

      expect(pricing).not.toBeNull();
      expect(pricing?.menuUnits).toBe(20);
      expect(pricing?.grandTotalFinalPrice.cents).toBe(19940);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("199,40 €");
      expect(pricing?.offerCode).toBe("monthly_plan");
    });
  });

  describe("2. Temporal Scheduling Layer (Week Navigation & Validation)", () => {
    const fixedMonday = "2026-09-07";
    const refDate = new Date(Date.UTC(2026, 8, 11)); // Friday Sep 11, 2026

    it("A. Resolves current week start Monday correctly", () => {
      expect(utcWeekStartMonday(refDate)).toBe(fixedMonday);
    });

    it("B. Offsets weeks accurately (+1 next week, +4 max future week)", () => {
      const currentWeek = offsetWeekMonday(fixedMonday, 0);
      const nextWeek = offsetWeekMonday(fixedMonday, 1);
      const futureWeek4 = offsetWeekMonday(fixedMonday, MAX_FUTURE_WEEKS);

      expect(currentWeek).toBe("2026-09-07");
      expect(nextWeek).toBe("2026-09-14");
      expect(futureWeek4).toBe("2026-10-05");
      expect(MAX_FUTURE_WEEKS).toBe(4);
    });

    it("C. Blocks past weeks strictly using isPastWeek()", () => {
      const pastWeek = offsetWeekMonday(fixedMonday, -1); // 2026-08-31
      const currentWeek = offsetWeekMonday(fixedMonday, 0); // 2026-09-07
      const nextWeek = offsetWeekMonday(fixedMonday, 1); // 2026-09-14

      expect(isPastWeek(pastWeek, refDate)).toBe(true);
      expect(isPastWeek(currentWeek, refDate)).toBe(false);
      expect(isPastWeek(nextWeek, refDate)).toBe(false);
    });

    it("D. Formats week ranges in Spanish correctly", () => {
      expect(formatWeekRangeEs("2026-09-07")).toBe("7 — 13 sep 2026");
      expect(formatWeekRangeEs("2026-09-14")).toBe("14 — 20 sep 2026");
    });
  });

  describe("3. Canonical Tenant Resolution & Strict Multi-Tenant Isolation (Fail-Safe)", () => {
    it("A. Resolves tenant slug from authenticated session tenant", () => {
      const auth = { tenant: { slug: "eatclean" } };
      const resolved = resolveActiveTenantSlug(auth, "any-hostname.com");
      expect(resolved).toBe("eatclean");
    });

    it("B. Resolves tenant slug from staging host topology when session is unpopulated", () => {
      const auth = { tenant: null };
      const resolvedStaging = resolveActiveTenantSlug(auth, "eatclean-staging.yourmealos.com");
      const resolvedProd = resolveActiveTenantSlug(auth, "eatclean.yourmealos.com");

      expect(resolvedStaging).toBe("eatclean");
      expect(resolvedProd).toBe("eatclean");
    });

    it("C. Strictly returns null when tenant cannot be resolved (Fail-Safe)", () => {
      const auth = { tenant: null };
      const resolvedPublic = resolveActiveTenantSlug(auth, "www.yourmealos.com");
      const resolvedLocal = resolveActiveTenantSlug(auth, "localhost");

      expect(resolvedPublic).toBeNull();
      expect(resolvedLocal).toBeNull();
    });

    it("D. Unknown tenant receives zero offers and never falls back to EatClean", () => {
      registerEatCleanCommercialOffers();

      // Unknown tenant
      const unknownSlug = "nordic-kitchen";
      const offers = getTenantOffers(unknownSlug);
      expect(offers).toEqual([]);

      const pricing = resolveOrderCommercialPricing({
        tenantSlug: unknownSlug,
        offerCode: "weekly_plan",
        items: [{ dishId: "dish-01", dayDate: "2026-09-07", qty: 1 }],
      });

      // Must be null (FAIL SAFE), never EatClean
      expect(pricing).toBeNull();
    });

    it("E. Null tenant receives null pricing and zero offers", () => {
      registerEatCleanCommercialOffers();

      expect(getTenantOffers(null)).toEqual([]);
      expect(getTenantOffers(undefined)).toEqual([]);

      const pricing = resolveOrderCommercialPricing({
        tenantSlug: null,
        offerCode: "individual_menu",
        items: [{ dishId: "dish-01", dayDate: "2026-09-07", qty: 1 }],
      });

      expect(pricing).toBeNull();
    });
  });

  describe("4. Billable Meal Quantity & Snapshot Itemization (FASE 3N-S7)", () => {
    beforeEach(() => {
      registerEatCleanCommercialOffers();
    });

    it("A. 1 day / 1 dish -> 11,90 €", () => {
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "individual_menu",
        items: [{ dishId: "dish-01", dayDate: "2026-09-16", qty: 1 }],
      });
      expect(pricing?.menuUnits).toBe(1);
      expect(pricing?.grandTotalFinalPrice.cents).toBe(1190);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("11,90 €");
    });

    it("B. 1 day / 2 dishes (same day, 2 distinct items qty=1) -> 23,80 €", () => {
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "individual_menu",
        items: [
          { dishId: "dish-tacos", dayDate: "2026-09-16", qty: 1 },
          { dishId: "dish-fogonero", dayDate: "2026-09-16", qty: 1 },
        ],
      });
      expect(pricing?.menuUnits).toBe(2);
      expect(pricing?.grandTotalFinalPrice.cents).toBe(2380);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("23,80 €");
    });

    it("C. 1 day / 1 dish qty=2 -> 23,80 €", () => {
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "individual_menu",
        items: [{ dishId: "dish-tacos", dayDate: "2026-09-16", qty: 2 }],
      });
      expect(pricing?.menuUnits).toBe(2);
      expect(pricing?.grandTotalFinalPrice.cents).toBe(2380);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("23,80 €");
    });

    it("D. 2 days / 1 dish per day -> 23,80 €", () => {
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "individual_menu",
        items: [
          { dishId: "dish-01", dayDate: "2026-09-16", qty: 1 },
          { dishId: "dish-02", dayDate: "2026-09-17", qty: 1 },
        ],
      });
      expect(pricing?.menuUnits).toBe(2);
      expect(pricing?.grandTotalFinalPrice.cents).toBe(2380);
    });

    it("E. 2 dishes Wednesday + 1 dish Friday -> 35,70 €", () => {
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "individual_menu",
        items: [
          { dishId: "dish-01", dayDate: "2026-09-16", qty: 1 },
          { dishId: "dish-02", dayDate: "2026-09-16", qty: 1 },
          { dishId: "dish-03", dayDate: "2026-09-18", qty: 1 },
        ],
      });
      expect(pricing?.menuUnits).toBe(3);
      expect(pricing?.grandTotalFinalPrice.cents).toBe(3570);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("35,70 €");
    });

    it("F. 5 dishes Mon-Fri individual plan -> 59,50 €", () => {
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "individual_menu",
        items: [
          { dishId: "dish-01", dayDate: "2026-09-14", qty: 1 },
          { dishId: "dish-02", dayDate: "2026-09-15", qty: 1 },
          { dishId: "dish-03", dayDate: "2026-09-16", qty: 1 },
          { dishId: "dish-04", dayDate: "2026-09-17", qty: 1 },
          { dishId: "dish-05", dayDate: "2026-09-18", qty: 1 },
        ],
      });
      expect(pricing?.menuUnits).toBe(5);
      expect(pricing?.grandTotalFinalPrice.cents).toBe(5950);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("59,50 €");
    });

    it("G. 5 dishes weekly plan -> 53,55 €", () => {
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "weekly_plan",
        items: [
          { dishId: "dish-01", dayDate: "2026-09-14", qty: 1 },
          { dishId: "dish-02", dayDate: "2026-09-15", qty: 1 },
          { dishId: "dish-03", dayDate: "2026-09-16", qty: 1 },
          { dishId: "dish-04", dayDate: "2026-09-17", qty: 1 },
          { dishId: "dish-05", dayDate: "2026-09-18", qty: 1 },
        ],
      });
      expect(pricing?.menuUnits).toBe(5);
      expect(pricing?.grandTotalFinalPrice.cents).toBe(5355);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("53,55 €");
    });

    it("H. 2 dishes Wednesday monthly plan -> 19,94 €", () => {
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "monthly_plan",
        items: [
          { dishId: "dish-tacos", dayDate: "2026-09-16", qty: 1 },
          { dishId: "dish-fogonero", dayDate: "2026-09-16", qty: 1 },
        ],
      });
      expect(pricing?.menuUnits).toBe(2);
      expect(pricing?.grandTotalFinalPrice.cents).toBe(1994);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("19,94 €");
    });

    it("I. 20 dishes monthly plan -> 199,40 €", () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        dishId: `dish-${i + 1}`,
        dayDate: `2026-09-${String(i + 1).padStart(2, "0")}`,
        qty: 1,
      }));
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "monthly_plan",
        items,
      });
      expect(pricing?.menuUnits).toBe(20);
      expect(pricing?.grandTotalFinalPrice.cents).toBe(19940);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("199,40 €");
    });

    it("J. Snapshot itemizes both dishes at 11,90 € each on the same day (no 0,00 € for second line)", () => {
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "individual_menu",
        items: [
          { dishId: "dish-tacos", dayDate: "2026-09-16", qty: 1 },
          { dishId: "dish-fogonero", dayDate: "2026-09-16", qty: 1 },
        ],
      });
      expect(pricing).not.toBeNull();

      const snapshot = CommercialPricingEngine.createSnapshot(pricing!, {
        orderItems: [
          { dishId: "dish-tacos", dishName: "Tacos de pechuga", dayDate: "2026-09-16", qty: 1 },
          { dishId: "dish-fogonero", dishName: "Fogonero", dayDate: "2026-09-16", qty: 1 },
        ],
      });

      expect(snapshot.baseAmountCents).toBe(2380);
      expect(snapshot.finalAmountCents).toBe(2380);
      expect(snapshot.items).toHaveLength(2);

      expect(snapshot.items[0]).toEqual({
        dishId: "dish-tacos",
        dishName: "Tacos de pechuga",
        itemType: "menu_dish",
        qty: 1,
        basePriceCents: 1190,
        finalPriceCents: 1190,
        discountCents: 0,
      });

      expect(snapshot.items[1]).toEqual({
        dishId: "dish-fogonero",
        dishName: "Fogonero",
        itemType: "menu_dish",
        qty: 1,
        basePriceCents: 1190,
        finalPriceCents: 1190,
        discountCents: 0,
      });
    });

    it("K. Same dish multi-qty (Pasta x 5) -> 53,55 €", () => {
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "weekly_plan",
        items: [{ dishId: "dish-pasta", dayDate: "2026-09-14", qty: 5 }],
      });
      expect(pricing?.menuUnits).toBe(5);
      expect(pricing?.grandTotalFinalPrice.cents).toBe(5355);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("53,55 €");
    });

    it("L. Multi-day multi-qty (Lunes Pasta x 5 + Miércoles Arroz x 5) -> 107,10 €", () => {
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "weekly_plan",
        items: [
          { dishId: "dish-pasta", dayDate: "2026-09-14", qty: 5 },
          { dishId: "dish-arroz", dayDate: "2026-09-16", qty: 5 },
        ],
      });
      expect(pricing?.menuUnits).toBe(10);
      expect(pricing?.grandTotalFinalPrice.cents).toBe(10710);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("107,10 €");
    });

    it("M. 100 units weekly plan scale verification -> 1071,00 €", () => {
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "weekly_plan",
        items: [{ dishId: "dish-pasta", dayDate: "2026-09-14", qty: 100 }],
      });
      expect(pricing?.menuUnits).toBe(100);
      expect(pricing?.grandTotalFinalPrice.cents).toBe(107100);
      expect(pricing?.grandTotalFinalPrice.formatted).toBe("1071,00 €");
    });

    it("N. Snapshot itemizes dishes at 10,71 € each in per_unit weekly_plan", () => {
      const items = [
        { dishId: "dish-01", dayDate: "2026-09-14", qty: 2 },
        { dishId: "dish-02", dayDate: "2026-09-15", qty: 1 },
      ];
      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "weekly_plan",
        items,
      });
      expect(pricing).not.toBeNull();

      const snapshot = CommercialPricingEngine.createSnapshot(pricing!, {
        orderItems: [
          { dishId: "dish-01", dishName: "Plato 1", dayDate: "2026-09-14", qty: 2 },
          { dishId: "dish-02", dishName: "Plato 2", dayDate: "2026-09-15", qty: 1 },
        ],
      });

      expect(snapshot.baseAmountCents).toBe(3570);
      expect(snapshot.discountAmountCents).toBe(357);
      expect(snapshot.finalAmountCents).toBe(3213);
      expect(snapshot.items).toHaveLength(2);

      expect(snapshot.items[0]).toEqual({
        dishId: "dish-01",
        dishName: "Plato 1",
        itemType: "menu_dish",
        qty: 2,
        basePriceCents: 2380,
        finalPriceCents: 2142,
        discountCents: 238,
      });

      expect(snapshot.items[1]).toEqual({
        dishId: "dish-02",
        dishName: "Plato 2",
        itemType: "menu_dish",
        qty: 1,
        basePriceCents: 1190,
        finalPriceCents: 1071,
        discountCents: 119,
      });
    });

    it("O. Generic Core: supports fixed_package models for other tenants", () => {
      registerTenantOffers("generic_tenant", [
        {
          id: "generic_pack_5",
          code: "pack_5",
          title: "Pack 5 Comidas",
          subtitle: "Paquete cerrado",
          description: "5 comidas por precio fijo",
          pricingModel: "fixed_package",
          basePrice: {
            cents: 5000,
            currency: "EUR",
            formatted: "50,00 €",
          },
          unitLabel: "pack",
          slotsIncluded: 5,
          benefits: [],
          recommended: false,
          promotions: [
            {
              id: "promo_pack_10",
              code: "PACK_10",
              name: "10% dto",
              type: "percentage",
              value: 10.0,
              appliesTo: "offer_base",
              eligibility: "public",
            },
          ],
        },
      ]);

      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "generic_tenant",
        offerCode: "pack_5",
        items: [
          { dishId: "d1", dayDate: "2026-09-14", qty: 1 },
          { dishId: "d2", dayDate: "2026-09-15", qty: 1 },
          { dishId: "d3", dayDate: "2026-09-16", qty: 1 },
        ],
      });

      expect(pricing).not.toBeNull();
      // fixed_package base 50.00 € - 10% = 45.00 € (4500 cents)
      expect(pricing?.grandTotalFinalPrice.cents).toBe(4500);

      // Snapshot remainder-cent integer distribution across 3 items
      const snapshot = CommercialPricingEngine.createSnapshot(pricing!, {
        orderItems: [
          { dishId: "d1", dishName: "D1", dayDate: "2026-09-14", qty: 1 },
          { dishId: "d2", dishName: "D2", dayDate: "2026-09-15", qty: 1 },
          { dishId: "d3", dishName: "D3", dayDate: "2026-09-16", qty: 1 },
        ],
      });

      expect(snapshot.finalAmountCents).toBe(4500);
      expect(snapshot.items).toHaveLength(3);
      const sumFinal = snapshot.items.reduce((s, i) => s + i.finalPriceCents, 0);
      expect(sumFinal).toBe(4500);
    });
  });
});
