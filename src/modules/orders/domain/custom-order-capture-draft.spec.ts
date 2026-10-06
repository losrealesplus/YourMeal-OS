import { describe, expect, it } from "vitest";
import {
  customDraftLine,
  newCustomItemDraft,
  updateCustomDraft,
} from "./custom-order-capture-draft";
import type { RepeatCustomProposal } from "./repeat-order";

const id = "80000000-0000-4000-8000-000000000001";
const draft = () => ({ ...newCustomItemDraft("2026-10-06", id), name: "Tarta", price: "18,00" });
describe("A4b draft identity and current intent", () => {
  it("keeps local identity out of capture, with an optional description", () => {
    expect(draft().key).toBe(`draft-custom:${id}`);
    expect(customDraftLine(draft())).toMatchObject({
      kind: "custom",
      name: "Tarta",
      description: null,
      unitPrice: "18.00",
    });
    expect(customDraftLine(draft())).not.toHaveProperty("lineId");
    expect(customDraftLine(draft())).not.toHaveProperty("dishId");
  });
  it("keeps homonyms independent and preserves existing UUID and comment", () => {
    expect(newCustomItemDraft("2026-10-06").key).not.toBe(newCustomItemDraft("2026-10-06").key);
    const persisted = { ...draft(), key: `custom:${id}` as const, lineId: id, comment: "Nota" };
    expect(customDraftLine(updateCustomDraft(persisted, { name: "Otra tarta" }))).toMatchObject({
      lineId: id,
      comment: "Nota",
    });
    expect(() => customDraftLine({ ...persisted, key: `custom:other` })).toThrow();
  });
  it.each(["", " ", "NaN", "Infinity", "-1", "1e3", "12xyz", "1,2,3", "1.00001", "100000000"])(
    "rejects invalid price %s",
    (price) => expect(() => customDraftLine({ ...draft(), price })).toThrow(),
  );
  it.each([NaN, Infinity, 0, -1, 1.5])("rejects invalid quantity %s", (qty) =>
    expect(() => customDraftLine({ ...draft(), qty })).toThrow(),
  );
  it("requires explicit zero and invalidates confirmation when intent changes", () => {
    expect(() => customDraftLine({ ...draft(), price: "0" })).toThrow();
    const zero = { ...draft(), price: "0,00", explicitZeroConfirmed: true };
    expect(customDraftLine(zero).explicitZeroConfirmed).toBe(true);
    expect(updateCustomDraft(zero, { qty: 2 }).explicitZeroConfirmed).toBe(false);
  });
  it("requires repeat provenance and all current confirmations, without persisted identity", () => {
    const proposal = { sourceOrderItemId: id } as RepeatCustomProposal;
    const repeated = { ...draft(), repeatProposal: proposal };
    expect(() => customDraftLine(repeated)).toThrow();
    const confirmed = {
      ...repeated,
      availabilityConfirmed: true,
      preparationConfirmed: true,
      priceConfirmed: true,
    };
    expect(customDraftLine(confirmed)).toMatchObject({
      repeatConfirmation: { sourceOrderItemId: id, confirmedUnitPrice: "18.00" },
    });
    expect(customDraftLine(confirmed).lineId).toBeUndefined();
    expect(() => customDraftLine(updateCustomDraft(confirmed, { price: "19" }))).toThrow();
  });
});
