import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearTenantOffersRegistry,
  registerTenantOffers,
  getTenantOffers,
  resolveOrderCommercialPricing,
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
});
