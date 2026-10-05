import { describe, expect, it } from "vitest";
import {
  offerPrices,
  selectWeeklyMenuOffer,
  validateOfferPrice,
  type WeeklyMenuOfferView,
} from "./offer-pricing";

describe("Offer Pricing M1 decimal boundary", () => {
  it.each([null, undefined])("preserves catalogue fallback %s", (slot) => {
    expect(offerPrices(11.9, slot)).toEqual({
      basePrice: 11.9,
      slotPrice: null,
      effectivePrice: 11.9,
      priceSource: "catalogue",
    });
  });
  it.each([0, 2.5, "2.5000"])("preserves explicit offer %s", (slot) => {
    expect(offerPrices(11.9, slot)).toEqual({
      basePrice: 11.9,
      slotPrice: Number(slot),
      effectivePrice: Number(slot),
      priceSource: "slot",
    });
  });
  it.each([
    -1,
    NaN,
    Infinity,
    -Infinity,
    "NaN",
    "Infinity",
    "1.00001",
    1.00001,
    100000000,
    "",
    null,
    undefined,
    true,
  ])("rejects invalid price before cast %s", (value) => {
    expect(() => validateOfferPrice(value)).toThrow("PRICE_UNAVAILABLE");
    expect(() => offerPrices(value, 2.5)).toThrow("PRICE_UNAVAILABLE");
  });
  it("allows maximum numeric(12,4) exactly", () => {
    expect(validateOfferPrice("99999999.9999")).toBe(99999999.9999);
  });
});

const offer: WeeklyMenuOfferView = {
  slotId: "s1",
  menuId: "m1",
  tenantId: "t1",
  dishId: "d1",
  dayDate: "2026-10-05",
  ...offerPrices(11.9, null),
};
const reference = { tenantId: "t1", menuId: "m1", dishId: "d1", dayDate: "2026-10-05" };
describe("Offer Pricing M1 reference selection", () => {
  it("allows legacy DTO exactly one candidate", () =>
    expect(selectWeeklyMenuOffer([offer], reference)).toBe(offer));
  it("rejects missing and ambiguous legacy candidates", () => {
    expect(() => selectWeeklyMenuOffer([], reference)).toThrow("OFFER_NOT_FOUND");
    expect(() => selectWeeklyMenuOffer([offer, { ...offer, slotId: "s2" }], reference)).toThrow(
      "OFFER_AMBIGUOUS",
    );
  });
  it("uses slot identity to distinguish same Dish/date", () => {
    const second = { ...offer, slotId: "s2", ...offerPrices(11.9, 0) };
    expect(selectWeeklyMenuOffer([offer, second], { ...reference, slotId: "s2" })).toBe(second);
  });
  it.each(["tenantId", "menuId", "dishId", "dayDate", "slotId"])("rejects mismatched %s", (key) => {
    expect(() => selectWeeklyMenuOffer([offer], { ...reference, [key]: "other" })).toThrow(
      "OFFER_NOT_FOUND",
    );
  });
});
