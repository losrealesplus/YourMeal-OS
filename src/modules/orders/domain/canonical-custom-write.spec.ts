import { describe, expect, it } from "vitest";
import { parseCanonicalOrderWrite } from "./canonical-order-write";
import { parseOfferWriteRequest } from "@/modules/weekly-menu/application/offer-write-input";
const tenant = "10000000-0000-4000-8000-000000000001";
const request = "70000000-0000-4000-8000-000000000001";
const source = "80000000-0000-4000-8000-000000000001";
const line = () => ({
  kind: "custom",
  name: "  Sopa a medida  ",
  qty: 2,
  dayDate: "2026-10-11",
  unitPrice: "2.5000",
});
const command = (custom: Record<string, unknown> = line()) => ({
  operation: "capture",
  weekStart: "2026-10-05",
  customer: { kind: "existing", id: tenant },
  lines: [custom],
});
describe("A4a custom intent without catalogue authority", () => {
  it("accepts Sunday custom-only without menu/slot/Dish and normalizes name without changing input", () => {
    const input = command();
    const before = structuredClone(input);
    expect(parseCanonicalOrderWrite(request, input).command.lines[0]).toMatchObject({
      kind: "custom",
      name: "Sopa a medida",
      unitPrice: "2.5000",
    });
    expect(input).toEqual(before);
    expect(
      parseOfferWriteRequest({ tenantId: tenant, requestId: request, command: input }).command
        .lines,
    ).toHaveLength(1);
  });
  it.each([undefined, null, "", "NaN", "Infinity", "-0.01", "1e2", "2.50001", 0, 2.5])(
    "rejects missing/invalid explicit price %s",
    (unitPrice) => {
      expect(() =>
        parseCanonicalOrderWrite(request, command({ ...line(), unitPrice } as never)),
      ).toThrow();
    },
  );
  it.each(["", " ", "x".repeat(201)])("rejects invalid name", (name) =>
    expect(() => parseCanonicalOrderWrite(request, command({ ...line(), name }))).toThrow(),
  );
  it.each([0, -1, 0.5, Infinity, NaN])("rejects quantity %s", (qty) =>
    expect(() => parseCanonicalOrderWrite(request, command({ ...line(), qty }))).toThrow(),
  );
  it.each([
    "dishId",
    "allergenState",
    "allergensSnapshot",
    "recipeId",
    "snapshotAuthorId",
    "unitPriceOverride",
    "actorId",
    "cost",
  ])("rejects invented %s", (field) => {
    expect(() =>
      parseCanonicalOrderWrite(request, command({ ...line(), [field]: tenant })),
    ).toThrow();
  });
  it("rejects offer slot on custom and requires confirmed zero", () => {
    expect(() =>
      parseOfferWriteRequest({
        tenantId: tenant,
        requestId: request,
        command: command({ ...line(), slotId: tenant } as never),
      }),
    ).toThrow();
    expect(() =>
      parseCanonicalOrderWrite(request, command({ ...line(), unitPrice: "0" })),
    ).toThrow();
    expect(
      parseCanonicalOrderWrite(
        request,
        command({ ...line(), unitPrice: "0", explicitZeroConfirmed: true } as never),
      ).command.lines[0],
    ).toMatchObject({ unitPrice: "0", explicitZeroConfirmed: true });
  });
  it("binds repeat acknowledgement to current name, description, quantity, date and price", () => {
    const custom = {
      ...line(),
      name: "Sopa a medida",
      repeatConfirmation: {
        sourceOrderItemId: source,
        availabilityConfirmed: true,
        preparationConfirmed: true,
        priceConfirmed: true,
        confirmedName: "Sopa a medida",
        confirmedDescription: null,
        confirmedQuantity: 2,
        confirmedDayDate: "2026-10-11",
        confirmedUnitPrice: "2.5000",
      },
    };
    expect(parseCanonicalOrderWrite(request, command(custom)).command.lines[0]).toMatchObject({
      repeatConfirmation: custom.repeatConfirmation,
    });
    for (const patch of [
      { name: "Otra" },
      { description: "Nueva" },
      { qty: 3 },
      { dayDate: "2026-10-10" },
      { unitPrice: "3.00" },
    ])
      expect(() => parseCanonicalOrderWrite(request, command({ ...custom, ...patch }))).toThrow();
    for (const key of ["availabilityConfirmed", "preparationConfirmed", "priceConfirmed"])
      expect(() =>
        parseCanonicalOrderWrite(
          request,
          command({
            ...custom,
            repeatConfirmation: { ...custom.repeatConfirmation, [key]: false },
          }),
        ),
      ).toThrow();
  });
});
