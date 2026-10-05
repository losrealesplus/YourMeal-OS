import { mapListItemToContext } from "@/order/mapOrder";
import { readOrderItem } from "../domain/order-item-read-model";
import type { OperationalOrderListItem } from "@/modules/operations";
import { describe, expect, it, vi } from "vitest";
import type { CatalogDish } from "@/modules/dish-library/application/dish-catalog-mapper";
import { mapOrderToSummaryView } from "./order-summary-mapper";
import type { OrderItemReadProjection, OrderRow } from "../infrastructure/order-repository";
const mocks = vi.hoisted(() => ({ rows: [] as unknown[], catalogue: vi.fn(), from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
vi.mock("@/modules/dish-library/application/dish-catalog-queries", () => ({
  fetchCatalogDishesByIds: mocks.catalogue,
}));
vi.mock("../infrastructure/order-repository", () => ({
  createOrderRepository: () => ({ findCustomerIdForUser: async () => "customer" }),
}));
import { fetchCustomerOrders } from "./order-queries";

const customRow = (id: string) => ({
  id,
  dish_id: null,
  item_kind: "custom",
  name_snapshot: "Same name",
  allergen_state: "UNKNOWN",
  allergens_snapshot: [],
  snapshot_captured_at: "2026-10-05T10:00:00Z",
  day_date: "2026-10-05",
  qty: 2,
  tenant_id: "tenant",
  order_id: "order",
  comment: null,
  deleted_at: null,
  unit_price: 2.5,
  price_snapshot_status: "captured" as const,
});

describe("summary/history native custom reads", () => {
  it("summary retains two custom homonyms and all quantities with no fake catalogue dish", () => {
    const order = {
      id: "order",
      week_start: "2026-10-05",
      status: "confirmed",
      total: 10,
    } as OrderRow;
    const items = [customRow("one"), customRow("two")] as OrderItemReadProjection[];
    const view = mapOrderToSummaryView(order, items, new Map());
    expect(view.items.map((item) => item.line.identity)).toEqual(["custom:one", "custom:two"]);
    expect(view.items.every((item) => item.dishId === null && item.dish === null)).toBe(true);
    expect(view.items.map((item) => item.line.name)).toEqual(["Same name", "Same name"]);
    expect(view.items.every((item) => item.line.allergenState === "UNKNOWN")).toBe(true);
  });

  it("order capability details preserve native custom identity and snapshot semantics", () => {
    const item = customRow("custom-one");
    const row = {
      id: "order",
      customerId: "customer",
      status: "confirmed",
      weekStart: "2026-10-05",
      total: 5,
      demandChannel: "individual",
      deliveryDates: ["2026-10-05"],
      items: [
        {
          id: item.id,
          dishId: null,
          dishName: "Wrong fallback",
          qty: item.qty,
          dayDate: item.day_date,
          notes: null,
          line: readOrderItem(item),
        },
      ],
    } as OperationalOrderListItem;
    const view = mapListItemToContext(row, {
      canRead: true,
      canWrite: false,
      canConfirm: false,
      canKitchen: false,
      canLogistics: false,
    });
    expect(view.details.lines[0]).toMatchObject({
      id: "custom-one",
      itemIdentity: "custom:custom-one",
      itemKind: "custom",
      dishId: null,
      dishName: "Same name",
      allergenState: "UNKNOWN",
      metadataSource: "snapshot",
      quantity: 2,
    });
  });

  it("history filters archived rows and reads snapshots without querying custom IDs", async () => {
    mocks.rows = [
      {
        id: "order",
        week_start: "2026-10-05",
        created_at: "2026-10-05",
        status: "confirmed",
        total: 10,
        order_items: [
          customRow("one"),
          customRow("two"),
          { ...customRow("archived"), deleted_at: "2026-10-05" },
          {
            ...customRow("dish-item"),
            dish_id: "dish",
            item_kind: "dish",
            name_snapshot: "Captured dish",
          },
        ],
      },
    ];
    mocks.catalogue.mockResolvedValue(
      new Map<string, CatalogDish>([
        ["dish", { id: "dish", name: "Changed catalogue" } as CatalogDish],
      ]),
    );
    mocks.from.mockImplementation((table: string) => {
      const q = {
        select: () => q,
        eq: () => q,
        is: () => q,
        order: () => q,
        limit: () => q,
        then: (resolve: (value: unknown) => void) =>
          resolve({ data: table === "orders" ? mocks.rows : [], error: null }),
      };
      return q;
    });
    const [view] = await fetchCustomerOrders("tenant", "user");
    expect(mocks.catalogue).toHaveBeenCalledWith("tenant", ["dish"]);
    expect(view?.itemCount).toBe(6);
    expect(view?.lines.map((line) => line.identity)).toEqual([
      "custom:one",
      "custom:two",
      "dish:dish",
    ]);
    expect(view?.dishNames).toEqual(["Same name", "Same name", "Captured dish"]);
    expect(view?.deliveryDate).toBe("2026-10-05");
  });
});
