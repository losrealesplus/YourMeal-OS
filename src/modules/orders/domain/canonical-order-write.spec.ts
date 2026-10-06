import { describe, expect, it } from "vitest";
import { parseCanonicalOrderWrite } from "./canonical-order-write";

const request = "11111111-1111-4111-8111-111111111111";
const customer = "22222222-2222-4222-8222-222222222222";
const dish = "33333333-3333-4333-8333-333333333333";
const lineId = "44444444-4444-4444-8444-444444444444";
const order = "55555555-5555-4555-8555-555555555555";
const line = () => ({ kind: "dish", dishId: dish, dayDate: "2026-10-05", qty: 2 });
const capture = () => ({
  operation: "capture",
  weekStart: "2026-10-05",
  customer: { kind: "existing", id: customer },
  lines: [line()],
});
function rejects(command: unknown, id: unknown = request) {
  expect(() => parseCanonicalOrderWrite(id, command)).toThrow("Invalid canonical order command");
}

describe("canonical authenticated Dish-only DTO", () => {
  it("requires a valid reason for every explicit price override, including confirmed zero", () => {
    for (const unitPriceOverride of ["2.50", "0.0000"]) {
      for (const unitPriceOverrideReason of [undefined, "", "   ", 1, null, "x".repeat(2001)]) {
        rejects({
          ...capture(),
          lines: [
            { ...line(), unitPriceOverride, unitPriceOverrideReason, explicitZeroConfirmed: true },
          ],
        });
      }
    }
    const input = {
      ...capture(),
      lines: [
        { ...line(), unitPriceOverride: "2.50", unitPriceOverrideReason: "  Acuerdo comercial  " },
      ],
    };
    expect(
      parseCanonicalOrderWrite(request, input).command.lines.filter(
        (line) => line.kind === "dish",
      )[0]?.unitPriceOverrideReason,
    ).toBe("Acuerdo comercial");
    expect(input.lines[0]?.unitPriceOverrideReason).toBe("  Acuerdo comercial  ");
  });
  it("keeps canonical B2B capture/modify closed while admitting individual null context", () => {
    const modify = {
      operation: "modify",
      orderId: order,
      expectedRevision: 0,
      weekStart: "2026-10-05",
      lines: [{ ...line(), lineId }],
    };
    for (const command of [capture(), modify]) {
      rejects({ ...command, demandChannel: "company" });
      for (const key of ["companyId", "siteId", "organizationalUnitId", "deliveryGroupId"]) {
        rejects({ ...command, [key]: customer });
      }
      expect(
        parseCanonicalOrderWrite(request, {
          ...command,
          demandChannel: "individual",
          companyId: null,
          siteId: null,
          organizationalUnitId: null,
          deliveryGroupId: null,
        }).command.operation,
      ).toBe(command.operation);
    }
  });
  it("accepts real Monday through Sunday dates and preserves caller objects", () => {
    const input = { ...capture(), lines: [line(), { ...line(), dayDate: "2026-10-11" }] };
    const before = structuredClone(input);
    const parsed = parseCanonicalOrderWrite(request, input);
    expect(parsed.command.lines).toHaveLength(2);
    expect(input).toEqual(before);
    expect(parsed.command).not.toBe(input);
  });
  it.each(["2026-10-04", "2026-10-12", "2026-02-30", "2026-13-01", "2026-10-05T00:00:00Z"])(
    "rejects invalid/outside date %s",
    (dayDate) => rejects({ ...capture(), lines: [{ ...line(), dayDate }] }),
  );
  it.each(["2026-10-06", "2026-02-30", "bad"])(
    "rejects non-Monday or impossible week %s",
    (weekStart) => rejects({ ...capture(), weekStart }),
  );
  it.each([0, -1, 1.1, NaN, Infinity, 2147483648, "2", null])(
    "rejects invalid quantity %s",
    (qty) => rejects({ ...capture(), lines: [{ ...line(), qty }] }),
  );
  it.each([
    "1.12345",
    "-1",
    "Infinity",
    "NaN",
    "1e2",
    "01",
    " 1",
    "1 ",
    "100000000",
    2,
    Infinity,
    NaN,
    null,
  ])("rejects noncanonical/nonfinite price %s", (unitPriceOverride) =>
    rejects({
      ...capture(),
      lines: [
        { ...line(), unitPriceOverride, unitPriceOverrideReason: "Ajuste comercial autorizado" },
      ],
    }),
  );
  it.each(["0", "0.0", "0.00", "0.000", "0.0000"])(
    "requires explicit zero confirmation for %s",
    (unitPriceOverride) => {
      rejects({
        ...capture(),
        lines: [
          { ...line(), unitPriceOverride, unitPriceOverrideReason: "Ajuste comercial autorizado" },
        ],
      });
      rejects({
        ...capture(),
        lines: [
          {
            ...line(),
            unitPriceOverride,
            unitPriceOverrideReason: "Ajuste comercial autorizado",
            explicitZeroConfirmed: false,
          },
        ],
      });
      expect(
        parseCanonicalOrderWrite(request, {
          ...capture(),
          lines: [
            {
              ...line(),
              unitPriceOverride,
              unitPriceOverrideReason: "Ajuste comercial autorizado",
              explicitZeroConfirmed: true,
            },
          ],
        }).command.lines.filter((line) => line.kind === "dish")[0]?.unitPriceOverride,
      ).toBe(unitPriceOverride);
    },
  );
  it.each(["0.0001", "2.5", "2.5000", "99999999.9999"])(
    "accepts bounded four-place price %s",
    (unitPriceOverride) => {
      expect(
        parseCanonicalOrderWrite(request, {
          ...capture(),
          lines: [
            {
              ...line(),
              unitPriceOverride,
              unitPriceOverrideReason: "Ajuste comercial autorizado",
            },
          ],
        }).command.lines.filter((line) => line.kind === "dish")[0]?.unitPriceOverride,
      ).toBe(unitPriceOverride);
    },
  );
  it.each([
    "unitPrice",
    "unit_price",
    "name_snapshot",
    "allergens_snapshot",
    "snapshot_author_id",
    "authorId",
    "tenantId",
    "recipeId",
    "total",
    "priceSnapshotStatus",
    "name",
  ])("rejects injected line authority %s", (key) =>
    rejects({ ...capture(), lines: [{ ...line(), [key]: "PRIVATE_PAYLOAD" }] }),
  );
  it.each([
    "tenantId",
    "tenant_id",
    "actorId",
    "authorId",
    "total",
    "inputHash",
    "requestId",
    "snapshots",
    "revision",
  ])("rejects injected root authority %s", (key) =>
    rejects({ ...capture(), [key]: "PRIVATE_PAYLOAD" }),
  );
  it("rejects custom, absent Dish, invalid UUID, claimed capture identity and duplicate modification identities", () => {
    rejects({ ...capture(), lines: [{ ...line(), kind: "custom", dishId: null, name: "Sopa" }] });
    rejects({ ...capture(), lines: [{ ...line(), dishId: null }] });
    rejects(capture(), "not-a-request-uuid");
    rejects({ ...capture(), lines: [{ ...line(), lineId }] });
    const modify = {
      operation: "modify",
      weekStart: "2026-10-05",
      orderId: order,
      expectedRevision: 0,
      lines: [{ ...line(), lineId }],
    };
    expect(parseCanonicalOrderWrite(request, modify).command.operation).toBe("modify");
    rejects({ ...modify, lines: [modify.lines[0], modify.lines[0]] });
    for (const expectedRevision of [-1, 0.5, Infinity, "0", null])
      rejects({ ...modify, expectedRevision });
  });
  it("strictly rejects forged new-customer authority and profile metadata", () => {
    const valid = {
      ...capture(),
      customer: {
        kind: "new",
        displayName: "Cliente",
        phone: "600123456",
        dietaryProfile: { allergens: ["gluten"] },
      },
    };
    expect(parseCanonicalOrderWrite(request, valid).command.operation).toBe("capture");
    rejects({ ...valid, customer: { ...valid.customer, tenantId: customer } });
    rejects({ ...valid, customer: { ...valid.customer, dietaryProfile: { authorId: customer } } });
  });
});
