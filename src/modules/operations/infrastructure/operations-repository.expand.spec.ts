import { describe, expect, it } from "vitest";
import { mapOperationalOrderRow } from "./operations-repository";
import { normalizeOperationalOrders } from "../domain/operational-date-resolver";

const row = {
  id: "order-1",
  tenant_id: "tenant-1",
  status: "confirmed",
  week_start: "2026-10-05",
  customer_id: "customer-1",
  total: 25,
  created_at: "2026-10-05",
  order_items: [
    {
      id: "item-1",
      dish_id: "dish-1",
      day_date: "2026-10-05",
      qty: 2,
      unit_price: 12.5,
      dishes: { name: "Catalogue today" },
    },
  ],
};

describe("CR-ORDER operational foundation", () => {
  it("legacy dish keeps name, portions, delivery day and financial snapshot", () => {
    const order = mapOperationalOrderRow(row);
    const result = normalizeOperationalOrders({
      orders: [order],
      targetDate: "2026-10-05",
      temporalMode: "present",
    });
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]).toMatchObject({
      dishName: "Catalogue today",
      unitPrice: 12.5,
      allergenSnapshotState: "HISTORICAL_UNAVAILABLE",
      metadataSource: "current_catalogue",
      identity: { orderItemId: "item-1", itemIdentity: "dish:dish-1", portionIndex: 0 },
    });
    expect(result.lines[1].identity.portionIndex).toBe(1);
    expect(order.deliveryDates).toEqual(["2026-10-05"]);
  });
  it("new snapshot name and UNKNOWN beat current catalogue metadata", () => {
    const order = mapOperationalOrderRow({
      ...row,
      order_items: [
        {
          ...row.order_items[0],
          item_kind: "dish",
          name_snapshot: "Name at capture",
          allergen_state: "UNKNOWN",
          allergens_snapshot: [],
          snapshot_captured_at: "2026-10-05T11:00:00Z",
        },
      ],
    });
    const result = normalizeOperationalOrders({
      orders: [order],
      targetDate: "2026-10-05",
      temporalMode: "present",
      dishMetaMap: new Map([["dish-1", { allergens: ["gluten"] }]]),
    });
    expect(result.lines[0]).toMatchObject({
      dishName: "Name at capture",
      dishAllergens: [],
      allergenSnapshotState: "UNKNOWN",
      metadataSource: "snapshot",
    });
  });
  it("excludes archived lines from both delivery dates and portions", () => {
    const order = mapOperationalOrderRow({
      ...row,
      order_items: [{ ...row.order_items[0], deleted_at: "2026-10-05T11:00:00Z" }],
    });
    expect(order.items).toEqual([]);
    expect(order.deliveryDates).toEqual([]);
  });
  it("null dish is rejected rather than stringified or silently dropped", () => {
    expect(() =>
      mapOperationalOrderRow({ ...row, order_items: [{ ...row.order_items[0], dish_id: null }] }),
    ).toThrow("Invalid order item read shape");
  });
});
