import { describe, expect, it } from "vitest";
import { mapOperationalOrderRow } from "./operations-repository";
describe("canonical edit routing after archiving the last custom", () => {
  it("retains v2 routing even when no custom remains in the read result", () => {
    const row = mapOperationalOrderRow({
      id: "order",
      tenant_id: "tenant",
      write_contract_version: 2,
      order_items: [],
    });
    expect(row.writeContractVersion).toBe(2);
    expect(row.items).toEqual([]);
  });
  it("does not redirect historical orders into the canonical editor", () => {
    expect(
      mapOperationalOrderRow({ id: "old", tenant_id: "tenant", order_items: [] })
        .writeContractVersion,
    ).toBeUndefined();
  });
});
