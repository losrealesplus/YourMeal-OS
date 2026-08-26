import { describe, expect, it } from "vitest";
import { mapOrderToSummaryView } from "./order-summary-mapper";
import type { OrderItemRow, OrderRow } from "../infrastructure/order-repository";
import type { CatalogDish } from "@/modules/dish-library/application/dish-catalog-mapper";

describe("mapOrderToSummaryView", () => {
  it("projects draft order and items for the summary screen", () => {
    const order: OrderRow = {
      id: "o1",
      tenant_id: "t1",
      customer_id: "c1",
      week_start: "2026-07-20",
      status: "draft",
      total: 19.8,
      notes: null,
      created_at: "2026-07-23T00:00:00Z",
      deleted_at: null,
      company_id: null,
      delivery_address_id: null,
      delivery_group_id: null,
      demand_channel: "individual",
      organizational_unit_id: null,
      site_id: null,
    };

    const items = [
      {
        id: "i1",
        order_id: "o1",
        tenant_id: "t1",
        dish_id: "d1",
        day_date: "2026-07-22",
        qty: 2,
        comment: null,
        deleted_at: null,
      },
    ] satisfies OrderItemRow[];

    const dish = {
      id: "d1",
      name: "Bowl",
      tagline: "",
      emoji: "🍽️",
      kcal: 400,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      price: 9.9,
      tags: [],
      allergens: [],
      ingredients: [],
    } satisfies CatalogDish;

    const view = mapOrderToSummaryView(order, items, new Map([["d1", dish]]));
    expect(view.status).toBe("draft");
    expect(view.total).toBe(19.8);
    expect(view.items[0]?.dish?.name).toBe("Bowl");
    expect(view.deliveryDateIso).toBe("2026-07-22T12:00:00.000Z");
    expect(view.address).toBeNull();
    expect(view.companyName).toBeNull();
  });
});
