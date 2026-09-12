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
      expect(pricing?.menuUnits).toBe(1);
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

    it("K. Rejects 6 meals with weekly_plan (slotsIncluded: 5) with DomainError INVALID_STATE", () => {
      const items = Array.from({ length: 6 }, (_, i) => ({
        dishId: `dish-${i + 1}`,
        dayDate: `2026-09-${String(14 + i).padStart(2, "0")}`,
        qty: 1,
      }));

      expect(() =>
        resolveOrderCommercialPricing({
          tenantSlug: "eatclean",
          offerCode: "weekly_plan",
          items,
        }),
      ).toThrowError(/admite un m.ximo de 5 comidas/);
    });

    it("L. 5 meals weekly_plan snapshot itemizes 5 lines at 10,71 € with sum = 5355 cents (53,55 €)", () => {
      const items = [
        { dishId: "dish-01", dayDate: "2026-09-14", qty: 1 },
        { dishId: "dish-02", dayDate: "2026-09-15", qty: 1 },
        { dishId: "dish-03", dayDate: "2026-09-16", qty: 1 },
        { dishId: "dish-04", dayDate: "2026-09-17", qty: 1 },
        { dishId: "dish-05", dayDate: "2026-09-18", qty: 1 },
      ];

      const pricing = resolveOrderCommercialPricing({
        tenantSlug: "eatclean",
        offerCode: "weekly_plan",
        items,
      });
      expect(pricing).not.toBeNull();

      const snapshot = CommercialPricingEngine.createSnapshot(pricing!, {
        orderItems: items.map((i, idx) => ({
          ...i,
          dishName: `Plato ${idx + 1}`,
        })),
      });

      expect(snapshot.baseAmountCents).toBe(5950);
      expect(snapshot.discountAmountCents).toBe(595);
      expect(snapshot.finalAmountCents).toBe(5355);
      expect(snapshot.items).toHaveLength(5);

      let sumBase = 0;
      let sumDiscount = 0;
      let sumFinal = 0;

      for (const item of snapshot.items) {
        expect(item.basePriceCents).toBe(1190);
        expect(item.discountCents).toBe(119);
        expect(item.finalPriceCents).toBe(1071);
        sumBase += item.basePriceCents;
        sumDiscount += item.discountCents;
        sumFinal += item.finalPriceCents;
      }

      expect(sumBase).toBe(5950);
      expect(sumDiscount).toBe(595);
      expect(sumFinal).toBe(5355);
    });
  });
});
