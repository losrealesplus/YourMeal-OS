import { expect, it } from "vitest";
import { confirmedCustomRepeatLine } from "./confirmed-custom-repeat";
import type { RepeatCustomProposal } from "./repeat-order";
const source = "80000000-0000-4000-8000-000000000001";
const proposal: RepeatCustomProposal = {
  kind: "custom",
  sourceOrderItemId: source,
  sourceItemIdentity: `custom:${source}`,
  dishId: null,
  name: "Sopa",
  description: null,
  allergenState: "UNKNOWN",
  allergensSnapshot: [],
  qty: 1,
  sourceDayDate: "2026-10-05",
  targetDayDate: "2026-10-12",
  availabilityConfirmation: "PENDING",
  priceConfirmation: "PENDING",
  unitPrice: null,
};
const confirmation = () => ({
  kind: "custom",
  name: "Sopa revisada",
  description: "Preparación actual",
  qty: 2,
  dayDate: "2026-10-12",
  unitPrice: "4.50",
  repeatConfirmation: {
    sourceOrderItemId: source,
    availabilityConfirmed: true,
    preparationConfirmed: true,
    priceConfirmed: true,
    confirmedName: "Sopa revisada",
    confirmedDescription: "Preparación actual",
    confirmedQuantity: 2,
    confirmedDayDate: "2026-10-12",
    confirmedUnitPrice: "4.50",
  },
});
it("repeat needs current explicit price and creates a new identity intent", () => {
  const line = confirmedCustomRepeatLine(proposal, confirmation());
  expect(line.lineId).toBeUndefined();
  expect(line.unitPrice).toBe("4.50");
  expect(proposal.unitPrice).toBeNull();
  expect(proposal.priceConfirmation).toBe("PENDING");
});
it.each([{}, { lineId: source }, { unitPrice: "9.00" }, { qty: 3 }, { unitPrice: "0" }])(
  "does not execute pending or drifted repeat %j",
  (patch) => {
    const input = Object.keys(patch).length ? { ...confirmation(), ...patch } : proposal;
    expect(() => confirmedCustomRepeatLine(proposal, input)).toThrow();
  },
);
it("zero needs independent explicit acknowledgement", () => {
  const input = confirmation();
  input.unitPrice = "0";
  input.repeatConfirmation.confirmedUnitPrice = "0";
  expect(() => confirmedCustomRepeatLine(proposal, input)).toThrow();
  expect(
    confirmedCustomRepeatLine(proposal, { ...input, explicitZeroConfirmed: true }).unitPrice,
  ).toBe("0");
});
