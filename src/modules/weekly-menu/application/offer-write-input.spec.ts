import { expect, it } from "vitest";
import { parseOfferCommitRequest, parseOfferWriteRequest } from "./offer-write-input";
const tenantId = "10000000-0000-4000-8000-000000000001",
  requestId = "70000000-0000-4000-8000-000000000001",
  slotId = "60000000-0000-4000-8000-000000000001";
const command = {
  operation: "capture",
  weekStart: "2026-10-05",
  customer: { kind: "existing", id: "30000000-0000-4000-8000-000000000001" },
  lines: [
    {
      kind: "dish",
      dishId: "40000000-0000-4000-8000-000000000001",
      dayDate: "2026-10-05",
      qty: 1,
      slotId,
    },
  ],
};
const input = { tenantId, requestId, command };
it("accepts slot identity without accepting monetary authority", () =>
  expect(parseOfferWriteRequest(input).command.lines[0]?.slotId).toBe(slotId));
it.each([
  "unitPrice",
  "price",
  "priceSource",
  "basePrice",
  "isExtra",
  "commercialInactive",
  "actorId",
])("rejects line authority %s", (field) =>
  expect(() =>
    parseOfferWriteRequest({
      ...input,
      command: { ...command, lines: [{ ...command.lines[0], [field]: 2.5 }] },
    }),
  ).toThrow(),
);
it.each(["actorId", "commercialInactive", "policyHash", "customerTier"])(
  "rejects envelope authority %s",
  (field) => expect(() => parseOfferWriteRequest({ ...input, [field]: "fake" })).toThrow(),
);
it("requires valid slot UUID", () =>
  expect(() =>
    parseOfferWriteRequest({
      ...input,
      command: { ...command, lines: [{ ...command.lines[0], slotId: "latest" }] },
    }),
  ).toThrow());
it("rejects manual override in quoted flow even with valid reason", () =>
  expect(() =>
    parseOfferWriteRequest({
      ...input,
      command: {
        ...command,
        lines: [
          {
            ...command.lines[0],
            unitPriceOverride: "2.5",
            unitPriceOverrideReason: "approved manual",
          },
        ],
      },
    }),
  ).toThrow("Quoted offer capture"));
it("commit requires opaque quote UUID", () => {
  expect(() => parseOfferCommitRequest({ ...input, quoteId: "latest" })).toThrow();
  expect(parseOfferCommitRequest({ ...input, quoteId: slotId }).quoteId).toBe(slotId);
});
