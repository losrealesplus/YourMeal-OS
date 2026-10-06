import { describe, expect, it } from "vitest";
import { offerPriceUnits, resolveOfferQuote, type OfferQuoteCandidate } from "./offer-quote";
const candidate: OfferQuoteCandidate = {
  tenantId: "tenant",
  menuTenantId: "tenant",
  dishTenantId: "tenant",
  menuId: "menu",
  slotId: "slot",
  dishId: "dish",
  dayDate: "2026-10-05",
  weekStart: "2026-10-05",
  menuStatus: "published",
  dishStatus: "active",
  menuDeleted: false,
  dishDeleted: false,
  basePrice: "11.9000",
  slotPrice: null,
};
const input = {
  tenantId: "tenant",
  weekStart: "2026-10-05",
  lines: [{ dishId: "dish", dayDate: "2026-10-05", qty: 2 }],
  candidates: [candidate],
  commercialActive: false,
  zeroConfirmed: false,
};
describe("trusted offer quote financial authority", () => {
  it("keeps legacy catalogue fallback and exact decimal sums", () =>
    expect(resolveOfferQuote(input)).toMatchObject({
      total: "23.80",
      lines: [{ unitPrice: "11.9000", priceSource: "catalogue" }],
    }));
  it("captures explicit slot authority without changing catalogue", () =>
    expect(
      resolveOfferQuote({ ...input, candidates: [{ ...candidate, slotPrice: "2.5000" }] }),
    ).toMatchObject({
      total: "5.00",
      lines: [{ basePrice: "11.9000", unitPrice: "2.5000", priceSource: "slot" }],
    }));
  it("preserves confirmed explicit zero", () =>
    expect(
      resolveOfferQuote({
        ...input,
        zeroConfirmed: true,
        candidates: [{ ...candidate, slotPrice: 0 }],
      }).lines[0]?.unitPrice,
    ).toBe("0.0000"));
  it("rejects zero without explicit confirmation", () =>
    expect(() =>
      resolveOfferQuote({ ...input, candidates: [{ ...candidate, slotPrice: 0 }] }),
    ).toThrow("ZERO_PRICE_CONFIRMATION_REQUIRED"));
  it("rejects zero catalogue fallback", () =>
    expect(() =>
      resolveOfferQuote({
        ...input,
        zeroConfirmed: true,
        candidates: [{ ...candidate, basePrice: 0 }],
      }),
    ).toThrow("PRICE_UNAVAILABLE"));
  it.each([
    null,
    undefined,
    -1,
    NaN,
    Infinity,
    "NaN",
    "Infinity",
    "1.00001",
    "100000000",
    "",
    "-0.01",
  ])("rejects invalid catalogue even with explicit slot %s", (basePrice) =>
    expect(() =>
      resolveOfferQuote({ ...input, candidates: [{ ...candidate, basePrice, slotPrice: "2.5" }] }),
    ).toThrow("PRICE_UNAVAILABLE"),
  );
  it.each(["1.00001", -1, Infinity, "NaN"])("rejects invalid slot %s", (slotPrice) =>
    expect(() =>
      resolveOfferQuote({ ...input, candidates: [{ ...candidate, slotPrice }] }),
    ).toThrow("PRICE_UNAVAILABLE"),
  );
  it("accepts individual_line_pricing_v1 mode with explicit slot price", () =>
    expect(
      resolveOfferQuote({
        ...input,
        commercialMode: "individual_line_pricing_v1",
        candidates: [{ ...candidate, slotPrice: "2.5000" }],
      }),
    ).toMatchObject({
      total: "5.00",
      lines: [{ basePrice: "11.9000", unitPrice: "2.5000", priceSource: "slot" }],
    }));
  it("accepts individual_line_pricing_v1 mode with NULL slot price falling back to catalogue", () =>
    expect(
      resolveOfferQuote({
        ...input,
        commercialMode: "individual_line_pricing_v1",
        candidates: [{ ...candidate, slotPrice: null }],
      }),
    ).toMatchObject({
      total: "23.80",
      lines: [{ basePrice: "11.9000", unitPrice: "11.9000", priceSource: "catalogue" }],
    }));
  it("rejects unsupported commercial modes with explicit slot price", () =>
    expect(() =>
      resolveOfferQuote({
        ...input,
        commercialMode: "weekly_plan",
        candidates: [{ ...candidate, slotPrice: "2.5000" }],
      }),
    ).toThrow("OFFER_PRICING_COMMERCIAL_UNSUPPORTED"));
  it("rejects unsupported commercial modes with NULL slot price requiring legacy commercial resolver", () =>
    expect(() =>
      resolveOfferQuote({
        ...input,
        commercialMode: "monthly_plan",
        candidates: [{ ...candidate, slotPrice: null }],
      }),
    ).toThrow("COMMERCIAL_QUOTE_REQUIRED"));
  it("rejects active commercial explicit price before irrelevant base validation", () =>
    expect(() =>
      resolveOfferQuote({
        ...input,
        commercialActive: true,
        candidates: [{ ...candidate, slotPrice: 0, basePrice: null }],
      }),
    ).toThrow("OFFER_PRICING_COMMERCIAL_UNSUPPORTED"));
  it("does not invent package allocation for commercial NULL", () =>
    expect(() => resolveOfferQuote({ ...input, commercialActive: true })).toThrow(
      "COMMERCIAL_QUOTE_REQUIRED",
    ));
  it("rejects ambiguity without selecting first or latest", () =>
    expect(() =>
      resolveOfferQuote({ ...input, candidates: [candidate, { ...candidate, slotId: "other" }] }),
    ).toThrow("OFFER_AMBIGUOUS"));
  it("accepts exact slot reference among otherwise ambiguous candidates", () =>
    expect(
      resolveOfferQuote({
        ...input,
        lines: [{ ...input.lines[0]!, slotId: "slot" }],
        candidates: [candidate, { ...candidate, slotId: "other" }],
      }).lines[0]?.slotId,
    ).toBe("slot"));
  it.each([
    { tenantId: "other" },
    { dishTenantId: "other" },
    { menuTenantId: "other" },
    { menuStatus: "draft" },
    { dishStatus: "inactive" },
    { dayDate: "2026-10-06" },
    { dishDeleted: true },
  ])("rejects cross-context candidate %j", (change) =>
    expect(() =>
      resolveOfferQuote({ ...input, candidates: [{ ...candidate, ...change }] }),
    ).toThrow("OFFER_NOT_FOUND"),
  );
  it("rounds total once rather than rounding every line", () =>
    expect(
      resolveOfferQuote({
        ...input,
        lines: [{ ...input.lines[0]!, qty: 3 }],
        candidates: [{ ...candidate, slotPrice: "0.3333" }],
      }).total,
    ).toBe("1.00"));
  it("allows highest finite four-decimal value", () =>
    expect(offerPriceUnits("99999999.9999")).toBe(999999999999n));
});
