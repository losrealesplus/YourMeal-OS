import { expect, it, vi } from "vitest";
import type { ServiceContext } from "@/services/types";
import { readOrderItem } from "@/modules/orders/domain/order-item-read-model";
const fixture = vi.hoisted(() => ({ orders: [] as unknown[] }));
vi.mock("../infrastructure/operations-repository", () => ({
  createOperationsRepository: () => ({ listOrders: async () => fixture.orders }),
}));
vi.mock("@/permissions", () => ({ requireCapability: vi.fn() }));
import { ProductionReportService } from "./production-report-service";

it("does not query catalogue or recipes for a custom-only report", async () => {
  fixture.orders = [
    {
      id: "order",
      status: "confirmed",
      customerId: "customer",
      customerName: "Ana",
      weekStart: "2026-10-05",
      deliveryDate: "2026-10-05",
      items: [
        {
          id: "custom-a",
          dishId: null,
          dishName: "Captured",
          qty: 2,
          unitPrice: 2.5,
          dayDate: "2026-10-05",
          notes: null,
          line: readOrderItem({
            id: "custom-a",
            dish_id: null,
            item_kind: "custom",
            name_snapshot: "Captured",
            allergen_state: "UNKNOWN",
            allergens_snapshot: [],
            snapshot_captured_at: "2026-10-05T10:00:00Z",
          }),
        },
      ],
    },
  ];
  const from = vi.fn((table: string) => {
    expect(table).toBe("kitchen_production_batches");
    const q = {
      select: vi.fn(() => q),
      eq: vi.fn(() => q),
      then: (resolve: (v: unknown) => void) =>
        resolve({
          data: [
            {
              item_kind: "custom",
              custom_order_item_id: "custom-a",
              dish_id: null,
              status: "preparing",
              updated_at: "2026-10-05T10:00:00Z",
            },
          ],
          error: null,
        }),
    };
    return q;
  });
  const ctx = {
    tenantId: "tenant-a",
    roles: ["kitchen"],
    supabase: { from },
  } as unknown as ServiceContext;
  const report = await ProductionReportService.buildForDay(ctx, { deliveryDate: "2026-10-05" });
  expect(from).toHaveBeenCalledTimes(1);
  expect(report.totals.portionCount).toBe(2);
  expect(report.standardDishes[0]).toMatchObject({
    itemIdentity: "custom:custom-a",
    batchStatus: "preparing",
  });
});
