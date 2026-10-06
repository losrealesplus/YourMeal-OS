import { canonicalCustomLineSchema, type CanonicalCustomLine } from "./canonical-order-write";
import { confirmedCustomRepeatLine } from "./confirmed-custom-repeat";
import type { RepeatCustomProposal } from "./repeat-order";

export type CustomItemDraft = {
  key: `draft-custom:${string}` | `custom:${string}`;
  lineId?: string;
  name: string;
  description: string;
  qty: number;
  dayDate: string;
  price: string;
  comment?: string | null;
  explicitZeroConfirmed: boolean;
  repeatProposal?: RepeatCustomProposal;
  availabilityConfirmed?: boolean;
  preparationConfirmed?: boolean;
  priceConfirmed?: boolean;
};

export function newCustomItemDraft(dayDate: string, uuid = crypto.randomUUID()): CustomItemDraft {
  return {
    key: `draft-custom:${uuid}`,
    name: "",
    description: "",
    qty: 1,
    dayDate,
    price: "",
    explicitZeroConfirmed: false,
  };
}

/** Comma is decimal punctuation only; no exponent, partial parsing or empty-to-zero. */
export function customDraftLine(draft: CustomItemDraft): CanonicalCustomLine {
  const unitPrice = draft.price.trim().replace(",", ".");
  const line = canonicalCustomLineSchema.parse({
    kind: "custom",
    ...(draft.lineId ? { lineId: draft.lineId } : {}),
    name: draft.name,
    description: draft.description.trim() || null,
    qty: draft.qty,
    dayDate: draft.dayDate,
    unitPrice,
    explicitZeroConfirmed: draft.explicitZeroConfirmed,
    comment: draft.comment ?? null,
    ...(draft.repeatProposal
      ? {
          repeatConfirmation: {
            sourceOrderItemId: draft.repeatProposal.sourceOrderItemId,
            confirmedName: draft.name.trim(),
            confirmedDescription: draft.description.trim() || null,
            confirmedQuantity: draft.qty,
            confirmedDayDate: draft.dayDate,
            confirmedUnitPrice: unitPrice,
            availabilityConfirmed: draft.availabilityConfirmed,
            preparationConfirmed: draft.preparationConfirmed,
            priceConfirmed: draft.priceConfirmed,
          },
        }
      : {}),
  });
  if (/^0(?:\.0{1,4})?$/.test(unitPrice) && !draft.explicitZeroConfirmed)
    throw new Error("Confirma explícitamente el precio cero.");
  if (draft.lineId && draft.key !== `custom:${draft.lineId}`)
    throw new Error("Identidad persistida inválida.");
  return draft.repeatProposal ? confirmedCustomRepeatLine(draft.repeatProposal, line) : line;
}

/** Any edited intent invalidates commercial/availability confirmations. */
export function updateCustomDraft(
  draft: CustomItemDraft,
  patch: Partial<CustomItemDraft>,
): CustomItemDraft {
  return {
    ...draft,
    ...patch,
    explicitZeroConfirmed: false,
    availabilityConfirmed: false,
    preparationConfirmed: false,
    priceConfirmed: false,
  };
}
