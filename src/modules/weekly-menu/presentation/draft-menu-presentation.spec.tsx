import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { previewDraftMenu, type SlotPresentation } from "./draft-menu-presentation";
import { eatcleanPreviewConfig } from "../../../../instances/yourmeal-eatclean/config/menu-presentation.preview";
import { offerPrices } from "../application/offer-pricing";
import type { WeeklyMenuDayView } from "../application/weekly-menu-mapper";
import { DraftMenuPreview } from "@/components/consumer/lab/draft-menu-preview";
const config = eatcleanPreviewConfig("LAB_TENANT");
// Structurally verified, explicitly synthetic IDs. Never bindings to production Dish UUIDs.
const day: WeeklyMenuDayView = {
  dayDate: "2026-10-12",
  dishes: Array.from({ length: 7 }, (_, i) => ({
    id: `LAB_DISH_${i}`,
    name: `Plato de prueba ${i}`,
    tagline: "",
    emoji: "",
    kcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    price: 11.9,
    tags: [],
    allergens: [],
    ingredients: [],
  })),
  offers: Array.from({ length: 7 }, (_, i) => ({
    slotId: `LAB_SLOT_${i}`,
    dishId: `LAB_DISH_${i}`,
    tenantId: "LAB_TENANT",
    menuId: "LAB_MENU",
    dayDate: "2026-10-12",
    ...offerPrices(11.9, i < 4 ? null : 2.5),
  })),
};
const assignments: SlotPresentation[] = [
  ...Array.from({ length: 4 }, (_, i) => ({
    slotId: `LAB_SLOT_${i}`,
    section: "primary" as const,
    positionId: `main-${i + 1}`,
  })),
  ...["soups", "yogurt", "juice"].map((categoryId, i) => ({
    slotId: `LAB_SLOT_${i + 4}`,
    section: "extras" as const,
    categoryId,
    sortOrder: 0,
  })),
];
const input = { tenantId: "LAB_TENANT", menuId: "LAB_MENU", day, config, assignments };
describe("isolated slot presentation", () => {
  it("projects four stable positions and separate extras without changing offer identity or price", () => {
    const copy = JSON.stringify(input);
    const p = previewDraftMenu(input);
    expect(p.issues).toEqual([]);
    expect(p.primary.map((s) => s.label)).toEqual([
      "Platillo 1",
      "Platillo 2",
      "Platillo 3",
      "Platillo 4",
    ]);
    expect(p.extras.map((s) => s.categoryLabel)).toEqual(["Sopas/Cremas", "Yogurt", "Zumo"]);
    expect(p.extras[0].offer).toBe(day.offers![4]);
    expect(p.extras[0].offer.effectivePrice).toBe(2.5);
    expect(JSON.stringify(input)).toBe(copy);
  });
  it("keeps positions when input order changes", () => {
    const p = previewDraftMenu({ ...input, day: { ...day, offers: [...day.offers!].reverse() } });
    expect(p.primary.map((s) => s.offer.slotId)).toEqual([
      "LAB_SLOT_0",
      "LAB_SLOT_1",
      "LAB_SLOT_2",
      "LAB_SLOT_3",
    ]);
  });
  it("shows incomplete draft explicitly rather than renumbering", () => {
    const p = previewDraftMenu({
      ...input,
      day: { ...day, offers: day.offers!.filter((o) => o.slotId !== "LAB_SLOT_1") },
      assignments: assignments.filter((a) => a.slotId !== "LAB_SLOT_1"),
    });
    expect(p.issues).toContain("MISSING_POSITION:main-2");
    expect(p.primary.map((s) => s.label)).toEqual(["Platillo 1", "Platillo 3", "Platillo 4"]);
  });
  it("preserves legacy order with no configuration", () => {
    const p = previewDraftMenu({ ...input, config: undefined, assignments: undefined });
    expect(p.kind).toBe("legacy");
    expect(p.primary.map((s) => s.offer.slotId)).toEqual(day.offers!.map((o) => o.slotId));
    expect(p.extras).toEqual([]);
  });
  it("allows another tenant's different layout without EatClean rules in projection", () => {
    const p = previewDraftMenu({
      ...input,
      config: {
        ...config,
        primaryPositions: config.primaryPositions.map((p) => ({ ...p, label: p.id })),
      },
    });
    expect(p.primary[0].label).toBe("main-1");
  });
  it.each(["tenantId", "menuId", "dayDate"] as const)("rejects foreign offer %s", (field) => {
    expect(() =>
      previewDraftMenu({
        ...input,
        day: { ...day, offers: [{ ...day.offers![0], [field]: "foreign" }] },
      }),
    ).toThrow("PRESENTATION_REFERENCE_INVALID");
  });
  it("rejects foreign config and duplicate slot identity", () => {
    expect(() =>
      previewDraftMenu({ ...input, config: { ...config, tenantId: "foreign" } }),
    ).toThrow("PRESENTATION_TENANT_MISMATCH");
    expect(() =>
      previewDraftMenu({ ...input, day: { ...day, offers: [day.offers![0], day.offers![0]] } }),
    ).toThrow("PRESENTATION_SLOT_AMBIGUOUS");
  });
  it("reports duplicate positions, ambiguous assignment and unknown slots", () => {
    expect(
      previewDraftMenu({
        ...input,
        assignments: [
          ...assignments,
          { slotId: "LAB_SLOT_0", section: "primary", positionId: "main-1" },
        ],
      }).issues,
    ).toContain("AMBIGUOUS_ASSIGNMENT:LAB_SLOT_0");
    expect(
      previewDraftMenu({
        ...input,
        assignments: assignments.map((a) =>
          a.slotId === "LAB_SLOT_1"
            ? { slotId: a.slotId, section: "primary", positionId: "main-1" }
            : a,
        ),
      }).issues,
    ).toContain("DUPLICATE_POSITION:main-1");
    expect(
      previewDraftMenu({
        ...input,
        assignments: [
          ...assignments,
          { slotId: "foreign", section: "primary", positionId: "main-1" },
        ],
      }).issues,
    ).toContain("UNKNOWN_SLOT:foreign");
  });
  it("retains unassigned slots and reports unknown position/category", () => {
    const p = previewDraftMenu({ ...input, assignments: [] });
    expect(p.unassigned).toHaveLength(7);
    expect(
      previewDraftMenu({
        ...input,
        assignments: [{ slotId: "LAB_SLOT_0", section: "primary", positionId: "unknown" }],
      }).issues,
    ).toContain("UNKNOWN_POSITION:unknown");
    expect(
      previewDraftMenu({
        ...input,
        assignments: [
          { slotId: "LAB_SLOT_4", section: "extras", categoryId: "unknown", sortOrder: 0 },
        ],
      }).issues,
    ).toContain("INVALID_EXTRA:LAB_SLOT_4");
  });
  it("preserves explicit zero projected price", () => {
    expect(
      previewDraftMenu({
        ...input,
        day: { ...day, offers: day.offers!.map((o) => ({ ...o, ...offerPrices(11.9, 0) })) },
      }).primary[0].offer.effectivePrice,
    ).toBe(0);
  });
  it("renders read-only preview with slot and Dish identity; no publication/order controls", () => {
    const html = renderToStaticMarkup(
      <DraftMenuPreview preview={previewDraftMenu(input)} formatPrice={(n) => `${n} EUR (LAB)`} />,
    );
    expect(html).toContain("Platillo 4");
    expect(html).toContain("Extras");
    expect(html).toContain('data-slot-id="LAB_SLOT_4"');
    expect(html).toContain('data-dish-id="LAB_DISH_4"');
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<form");
  });
});
