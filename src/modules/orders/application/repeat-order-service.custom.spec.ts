import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceContext } from "@/services/types";

const mocks = vi.hoisted(() => ({
  findByIdWithItems: vi.fn(),
  findPublishedByWeekStart: vi.fn(),
  listSlotsWithDishes: vi.fn(),
  fetchCatalog: vi.fn(),
  intake: vi.fn(),
}));
vi.mock("../infrastructure/order-repository", () => ({
  createOrderRepository: () => ({ findByIdWithItems: mocks.findByIdWithItems }),
}));
vi.mock("@/modules/weekly-menu/infrastructure/weekly-menu-repository", () => ({
  createWeeklyMenuRepository: () => ({
    findPublishedByWeekStart: mocks.findPublishedByWeekStart,
    listSlotsWithDishes: mocks.listSlotsWithDishes,
  }),
}));
vi.mock("@/modules/dish-library/application/dish-catalog-queries", () => ({
  fetchCatalogDishesByIds: mocks.fetchCatalog,
}));
vi.mock("@/modules/order-intake", () => ({ OrderIntakeService: { intakeDraft: mocks.intake } }));
import { RepeatOrderService } from "./repeat-order-service";

const custom = {
  id: "source-1",
  dish_id: null,
  item_kind: "custom",
  name_snapshot: "Sopa",
  description_snapshot: "Nota",
  allergen_state: "UNKNOWN",
  allergens_snapshot: [],
  snapshot_captured_at: "2026-10-05T12:00:00Z",
  qty: 1,
  day_date: "2026-10-06",
  unit_price: 0,
};
const ctx = {
  supabase: {} as ServiceContext["supabase"],
  userId: "staff",
  tenantId: "tenant",
  roles: ["company_admin"],
  capabilities: new Set(["orders.read", "orders.write"]),
} as ServiceContext;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.findByIdWithItems.mockResolvedValue({
    order: { status: "confirmed", week_start: "2026-10-05", customer_id: "customer" },
    items: [custom],
  });
  mocks.findPublishedByWeekStart.mockResolvedValue({ id: "menu" });
  mocks.listSlotsWithDishes.mockResolvedValue([
    { dish_id: "dish", day_date: "2026-10-13", dishes: { deleted_at: null } },
  ]);
  mocks.fetchCatalog.mockResolvedValue(new Map([["dish", { name: "Plato" }]]));
});
describe("repeat native custom read boundary", () => {
  it("previews without a published menu/catalogue and never reuses a zero historical price", async () => {
    const preview = await RepeatOrderService.preview(ctx, "order", "2026-10-12");
    expect(preview.customProposals[0]).toMatchObject({
      sourceOrderItemId: "source-1",
      name: "Sopa",
      unitPrice: null,
      allergenState: "UNKNOWN",
      priceConfirmation: "PENDING",
    });
    expect(mocks.fetchCatalog).not.toHaveBeenCalled();
    expect(mocks.findPublishedByWeekStart).not.toHaveBeenCalled();
    await expect(RepeatOrderService.execute(ctx, "order", "2026-10-12")).rejects.toMatchObject({
      code: "UNIMPLEMENTED",
    });
    expect(mocks.intake).not.toHaveBeenCalled();
  });
  it("cannot silently repeat only the Dish part of a mixed order", async () => {
    mocks.findByIdWithItems.mockResolvedValue({
      order: { status: "confirmed", week_start: "2026-10-05", customer_id: "customer" },
      items: [custom, { id: "source-dish", dish_id: "dish", day_date: "2026-10-06", qty: 2 }],
    });
    const preview = await RepeatOrderService.preview(ctx, "order", "2026-10-12");
    expect(preview.available).toHaveLength(1);
    expect(preview.customProposals).toHaveLength(1);
    expect(preview.canRepeat).toBe(false);
    expect(mocks.fetchCatalog).toHaveBeenCalledWith("tenant", ["dish"]);
    await expect(RepeatOrderService.execute(ctx, "order", "2026-10-12")).rejects.toMatchObject({
      code: "UNIMPLEMENTED",
    });
    expect(mocks.intake).not.toHaveBeenCalled();
  });
  it("keeps mixed custom proposals visible without a published menu but retains Dish-only MENU_LOCKED", async () => {
    const dish = { id: "source-dish", dish_id: "dish", day_date: "2026-10-06", qty: 2 };
    const order = { status: "confirmed", week_start: "2026-10-05", customer_id: "customer" };
    mocks.findByIdWithItems.mockResolvedValue({ order, items: [custom, dish] });
    mocks.findPublishedByWeekStart.mockResolvedValue(null);
    const preview = await RepeatOrderService.preview(ctx, "order", "2026-10-12");
    expect(preview.customProposals).toHaveLength(1);
    expect(preview.unavailable).toHaveLength(1);
    expect(preview.canRepeat).toBe(false);
    mocks.findByIdWithItems.mockResolvedValue({ order, items: [dish] });
    await expect(RepeatOrderService.preview(ctx, "order", "2026-10-12")).rejects.toMatchObject({
      code: "MENU_LOCKED",
    });
    expect(mocks.intake).not.toHaveBeenCalled();
  });
});
