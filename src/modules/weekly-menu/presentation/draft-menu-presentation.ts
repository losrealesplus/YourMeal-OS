import type { WeeklyMenuDayView } from "../application/weekly-menu-mapper";
import type { WeeklyMenuOfferView } from "../application/offer-pricing";
import type { CatalogDish } from "@/modules/dish-library/application/dish-catalog-mapper";

/** Ephemeral presentation overlay for an isolated draft preview, never a persistence/writer DTO. */
export type MenuPresentationConfig = {
  tenantId: string;
  primaryPositions: readonly { id: string; label: string; categoryLabel: string }[];
  extraCategories: readonly { id: string; label: string }[];
};
export type SlotPresentation = { slotId: string } & (
  | { section: "primary"; positionId: string }
  | { section: "extras"; categoryId: string; sortOrder: number }
);
export type PresentedSlot = {
  offer: WeeklyMenuOfferView;
  dish: CatalogDish;
  label: string;
  categoryLabel: string;
  order: number;
};
export type DraftMenuPresentation = {
  kind: "legacy" | "configured";
  primary: PresentedSlot[];
  extras: PresentedSlot[];
  unassigned: PresentedSlot[];
  issues: string[];
};

export function previewDraftMenu(input: {
  tenantId: string;
  menuId: string;
  day: WeeklyMenuDayView;
  config?: MenuPresentationConfig;
  assignments?: readonly SlotPresentation[];
}): DraftMenuPresentation {
  const { tenantId, menuId, day, config } = input;
  if (config && config.tenantId !== tenantId) throw new Error("PRESENTATION_TENANT_MISMATCH");
  const offers = day.offers ?? [];
  if (new Set(offers.map((o) => o.slotId)).size !== offers.length)
    throw new Error("PRESENTATION_SLOT_AMBIGUOUS");
  const slots = offers.map((offer, order) => {
    if (offer.tenantId !== tenantId || offer.menuId !== menuId || offer.dayDate !== day.dayDate)
      throw new Error("PRESENTATION_REFERENCE_INVALID");
    const dish = day.dishes.find((d) => d.id === offer.dishId);
    if (!dish) throw new Error("PRESENTATION_DISH_MISSING");
    return { offer, dish, order, label: "", categoryLabel: "" };
  });
  if (!config) return { kind: "legacy", primary: slots, extras: [], unassigned: [], issues: [] };
  if (
    new Set(config.primaryPositions.map((p) => p.id)).size !== config.primaryPositions.length ||
    new Set(config.extraCategories.map((p) => p.id)).size !== config.extraCategories.length
  )
    throw new Error("PRESENTATION_CONFIG_AMBIGUOUS");
  const issues: string[] = [];
  const assignments = input.assignments ?? [];
  const known = new Set(slots.map((s) => s.offer.slotId));
  for (const a of assignments) if (!known.has(a.slotId)) issues.push(`UNKNOWN_SLOT:${a.slotId}`);
  const primary: PresentedSlot[] = [],
    extras: PresentedSlot[] = [],
    unassigned: PresentedSlot[] = [];
  for (const slot of slots) {
    const matches = assignments.filter((a) => a.slotId === slot.offer.slotId);
    if (matches.length !== 1) {
      issues.push(
        `${matches.length ? "AMBIGUOUS_ASSIGNMENT" : "UNASSIGNED_SLOT"}:${slot.offer.slotId}`,
      );
      unassigned.push(slot);
      continue;
    }
    const a = matches[0];
    if (a.section === "primary") {
      const order = config.primaryPositions.findIndex((p) => p.id === a.positionId);
      if (order < 0) {
        issues.push(`UNKNOWN_POSITION:${a.positionId}`);
        unassigned.push(slot);
        continue;
      }
      const position = config.primaryPositions[order];
      primary.push({
        ...slot,
        order,
        label: position.label,
        categoryLabel: position.categoryLabel,
      });
    } else {
      const categoryOrder = config.extraCategories.findIndex((c) => c.id === a.categoryId);
      if (categoryOrder < 0 || !Number.isSafeInteger(a.sortOrder) || a.sortOrder < 0) {
        issues.push(`INVALID_EXTRA:${slot.offer.slotId}`);
        unassigned.push(slot);
        continue;
      }
      extras.push({
        ...slot,
        order: a.sortOrder,
        label: "",
        categoryLabel: config.extraCategories[categoryOrder].label,
      });
    }
  }
  for (const [order, p] of config.primaryPositions.entries()) {
    const count = primary.filter((s) => s.order === order).length;
    if (count !== 1)
      issues.push(`${count === 0 ? "MISSING_POSITION" : "DUPLICATE_POSITION"}:${p.id}`);
  }
  primary.sort((a, b) => a.order - b.order || a.offer.slotId.localeCompare(b.offer.slotId));
  extras.sort((a, b) => {
    const ai = assignments.find(
      (x) => x.slotId === a.offer.slotId && x.section === "extras",
    )! as Extract<SlotPresentation, { section: "extras" }>;
    const bi = assignments.find(
      (x) => x.slotId === b.offer.slotId && x.section === "extras",
    )! as Extract<SlotPresentation, { section: "extras" }>;
    return (
      config.extraCategories.findIndex((c) => c.id === ai.categoryId) -
        config.extraCategories.findIndex((c) => c.id === bi.categoryId) ||
      a.order - b.order ||
      a.offer.slotId.localeCompare(b.offer.slotId)
    );
  });
  return { kind: "configured", primary, extras, unassigned, issues };
}
