import { expect, it } from "vitest";
import { assertLegacyOfferSlots } from "./legacy-offer-write-guard";
import type { WeeklyMenuSlotWithDish } from "../infrastructure/weekly-menu-repository";
const line = { dishId: "dish", dayDate: "2026-10-05" };
const slot = {
  id: "slot",
  tenant_id: "tenant",
  weekly_menu_id: "menu",
  dish_id: "dish",
  day_date: line.dayDate,
  unit_price: null,
  dishes: { id: "dish", tenant_id: "tenant", status: "active", deleted_at: null },
} as unknown as WeeklyMenuSlotWithDish;
it("legacy NULL is allowed with exactly one eligible reference", () =>
  expect(() => assertLegacyOfferSlots("tenant", "menu", [line], [slot], true)).not.toThrow());
it("legacy missing reference fails", () =>
  expect(() => assertLegacyOfferSlots("tenant", "menu", [line], [], false)).toThrow("No eligible"));
it("legacy ambiguous reference fails", () =>
  expect(() =>
    assertLegacyOfferSlots("tenant", "menu", [line], [slot, { ...slot, id: "other" }], false),
  ).toThrow("exactly one"));
it.each([0, 2.5])("legacy non-NULL %s cannot become catalogue capture", (unit_price) => {
  try {
    assertLegacyOfferSlots("tenant", "menu", [line], [{ ...slot, unit_price }], false);
    throw Error("not rejected");
  } catch (error) {
    expect(error).toMatchObject({ code: "OFFER_PRICING_QUOTE_REQUIRED" });
  }
});
it("commercial non-NULL is typed unsupported", () => {
  try {
    assertLegacyOfferSlots("tenant", "menu", [line], [{ ...slot, unit_price: 0 }], true);
  } catch (error) {
    expect(error).toMatchObject({ code: "OFFER_PRICING_COMMERCIAL_UNSUPPORTED" });
  }
});
it("cross-tenant linked dish cannot qualify", () =>
  expect(() =>
    assertLegacyOfferSlots(
      "tenant",
      "menu",
      [line],
      [{ ...slot, dishes: { ...slot.dishes!, tenant_id: "other" } }],
      false,
    ),
  ).toThrow("No eligible"));
