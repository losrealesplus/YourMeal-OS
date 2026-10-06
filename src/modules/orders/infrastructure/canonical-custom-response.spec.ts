import { describe, expect, it } from "vitest";
import fixture from "../../../../supabase/tests/cr-order-a4a/written-fixture.json";
import { parseCanonicalOrderWriteResult } from "./canonical-order-write-repository";
import { parseCanonicalOrderWrite } from "../domain/canonical-order-write";
const command = parseCanonicalOrderWrite("70000000-0000-4000-8000-000000000001", {
  operation: "capture",
  weekStart: fixture.order.week_start,
  customer: { kind: "existing", id: fixture.order.customer_id },
  lines: [
    { kind: "custom", name: "Sopa", qty: 1, dayDate: fixture.order.week_start, unitPrice: "3.25" },
  ],
}).command;
const result = () => ({
  order: fixture.order,
  items: fixture.items,
  committedRevision: fixture.order.revision,
  replayed: false,
  inputHash: "a".repeat(64),
});
describe("A4a canonical custom response boundary", () => {
  it("accepts rows actually committed by PostgreSQL", () =>
    expect(
      parseCanonicalOrderWriteResult(result(), fixture.order.tenant_id, command).items,
    ).toHaveLength(3));
  it.each([
    { unit_price: "" },
    { unit_price: "NaN" },
    { unit_price: Infinity },
    { unit_price: "1e2" },
    { unit_price: "1.00001" },
    { unit_price: -1 },
    { qty: 0 },
    { qty: 1.5 },
    { day_date: "2026-02-30" },
    { day_date: "2026-10-12" },
    { dish_id: fixture.items[0].id },
    { name_snapshot: " " },
    { allergens_snapshot: ["milk"] },
    { allergen_state: "DECLARED" },
    { snapshot_captured_at: "bad" },
    { price_snapshot_status: "historical_unavailable" },
    { unit_price: 0, price_snapshot_status: "captured" },
  ])("rejects malformed custom provider snapshot %j", (patch) => {
    const data = structuredClone(result());
    Object.assign(
      data.items.find((item) => item.item_kind === "custom")!,
      patch,
    );
    expect(() => parseCanonicalOrderWriteResult(data, fixture.order.tenant_id, command)).toThrow();
  });
  it("fails closed when parent week identity is missing", () => {
    const data = structuredClone(result());
    Object.assign(data.order, { week_start: undefined });
    expect(() => parseCanonicalOrderWriteResult(data, fixture.order.tenant_id, command)).toThrow();
  });
});
