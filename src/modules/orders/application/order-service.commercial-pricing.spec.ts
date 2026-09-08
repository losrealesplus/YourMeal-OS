import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { OrderService } from "./order-service";
import { AuditService } from "@/services/audit-service";
import type { OrderWithItems } from "../infrastructure/order-repository";

vi.mock("@/services/feature-flag-service", () => ({
  FeatureFlagService: {
    isEnabled: vi.fn(async () => true),
  },
}));

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn(async () => undefined),
  },
}));

const mockInsertDraft = vi.fn();
const mockFindByIdWithItems = vi.fn();
const mockConfirmDraft = vi.fn();
const mockFindCustomerIdForUser = vi.fn();

vi.mock("@/modules/orders/infrastructure/order-repository", () => ({
  createOrderRepository: vi.fn(() => ({
    findCustomerIdForUser: mockFindCustomerIdForUser,
    insertDraft: mockInsertDraft,
    findByIdWithItems: mockFindByIdWithItems,
    confirmDraft: mockConfirmDraft,
  })),
}));

vi.mock("@/modules/weekly-menu/infrastructure/weekly-menu-repository", () => ({
  createWeeklyMenuRepository: vi.fn(() => ({
    findPublishedByWeekStart: vi.fn(async () => ({
      id: "menu-2026-07-20",
      status: "published",
      week_start: "2026-07-20",
    })),
    listSlotsWithDishes: vi.fn(async () => [
      { day_date: "2026-07-20", dish_id: "dish-01", dishes: { id: "dish-01", price: 0 } },
      { day_date: "2026-07-21", dish_id: "dish-02", dishes: { id: "dish-02", price: 0 } },
      { day_date: "2026-07-22", dish_id: "dish-03", dishes: { id: "dish-03", price: 0 } },
      { day_date: "2026-07-23", dish_id: "dish-04", dishes: { id: "dish-04", price: 0 } },
      { day_date: "2026-07-24", dish_id: "dish-05", dishes: { id: "dish-05", price: 0 } },
    ]),
  })),
}));

vi.mock("@/modules/dishes/infrastructure/dish-repository", () => ({
  createDishRepository: vi.fn(() => ({
    listCatalogByIds: vi.fn(async (ids: string[]) =>
      ids.map((id) => ({ id, name: `Dish ${id}`, price: 0 })),
    ),
  })),
}));

vi.mock("@/modules/company-account/application/company-account-service", () => ({
  CompanyAccountService: {
    resolveOrderDemandContext: vi.fn(async () => ({
      demandChannel: "individual" as const,
      companyId: null,
      siteId: null,
      organizationalUnitId: null,
      deliveryGroupId: null,
    })),
    ensureIndividualCustomer: vi.fn(async () => "customer-123"),
  },
}));

function makeContext(overrides: Partial<ServiceContext> = {}): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "user-123",
    tenantId: "8bba00ba-331b-42c8-9283-4e3836ffb870",
    tenantSlug: "eatclean",
    roles: ["customer"],
    capabilities: new Set(["orders.write", "orders.read"]),
    localization: null,
    ip: "127.0.0.1",
    ...overrides,
  };
}

describe("OrderService Commercial Pricing Integration (ADR 0065 & FASE 3N)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindCustomerIdForUser.mockResolvedValue("customer-123");
    mockInsertDraft.mockImplementation(async (input: { total: number }) => ({
      order: {
        id: "order-test-1",
        customer_id: "customer-123",
        status: "draft",
        total: input.total,
        currency: "EUR",
        created_at: new Date().toISOString(),
      },
      items: [],
    }));
  });

  describe("Draft Pricing Resolution", () => {
    it("prices 1 individual menu at 11.90 € despite catalog dish having price = 0", async () => {
      const ctx = makeContext();
      const result = await OrderService.programDraftItems(ctx, {
        weekStart: "2026-07-20",
        items: [
          {
            dishId: "dish-01",
            dayDate: "2026-07-20",
            qty: 1,
          },
        ],
      });

      expect(mockInsertDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 11.9,
          customerId: "customer-123",
        }),
      );
      expect(result.order.total).toBe(11.9);
    });

    it("prices 5 weekly menus at 53.55 € (59.50 € with 10% promo)", async () => {
      const ctx = makeContext();
      const result = await OrderService.programDraftItems(ctx, {
        weekStart: "2026-07-20",
        items: [
          { dishId: "dish-01", dayDate: "2026-07-20", qty: 1 },
          { dishId: "dish-02", dayDate: "2026-07-21", qty: 1 },
          { dishId: "dish-03", dayDate: "2026-07-22", qty: 1 },
          { dishId: "dish-04", dayDate: "2026-07-23", qty: 1 },
          { dishId: "dish-05", dayDate: "2026-07-24", qty: 1 },
        ],
      });

      expect(mockInsertDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 53.55,
        }),
      );
      expect(result.order.total).toBe(53.55);
    });

    it("applies fixed price 9.97 € for subscriber_monthly customer tier", async () => {
      const ctx = makeContext();
      const result = await OrderService.programDraftItems(ctx, {
        weekStart: "2026-07-20",
        customerTier: "subscriber_monthly",
        items: [
          { dishId: "dish-01", dayDate: "2026-07-20", qty: 1 },
        ],
      });

      expect(mockInsertDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 9.97,
        }),
      );
      expect(result.order.total).toBe(9.97);
    });

    it("accurately computes extras in commercial total", async () => {
      const ctx = makeContext();
      const result = await OrderService.programDraftItems(ctx, {
        weekStart: "2026-07-20",
        items: [
          { dishId: "dish-01", dayDate: "2026-07-20", qty: 1 },
        ],
        extras: [
          {
            dishId: "extra-soup-01",
            dishName: "Crema de verduras",
            basePriceCents: 450,
            qty: 1,
          },
        ],
      });

      // Individual menu: 11.90 € (1190 cents) + Extra: 4.50 € (450 cents) = 16.40 €
      expect(mockInsertDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 16.4,
        }),
      );
      expect(result.order.total).toBe(16.4);
    });
  });

  describe("Confirmation, Anti-Drift & Price Snapshot", () => {
    it("confirms draft and writes immutable PriceSnapshot to AuditService", async () => {
      const ctx = makeContext();
      const mockOrderWithItems: OrderWithItems = {
        order: {
          id: "order-test-1",
          tenant_id: ctx.tenantId,
          customer_id: "customer-123",
          status: "draft",
          total: 11.9,
          week_start: "2026-07-20",
          notes: null,
          demand_channel: "individual",
          company_id: null,
          site_id: null,
          organizational_unit_id: null,
          delivery_group_id: null,
          delivery_address_id: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        items: [
          {
            id: "item-1",
            order_id: "order-test-1",
            tenant_id: ctx.tenantId,
            dish_id: "dish-01",
            day_date: "2026-07-20",
            qty: 1,
            comment: null,
            deleted_at: null,
          },
        ],
      };

      mockFindByIdWithItems.mockResolvedValue(mockOrderWithItems);
      mockConfirmDraft.mockResolvedValue({
        old: mockOrderWithItems.order,
        order: { ...mockOrderWithItems.order, status: "confirmed" },
      });

      const confirmed = await OrderService.confirm(ctx, "order-test-1", {
        expectedTotal: 11.9,
      });

      expect(confirmed.status).toBe("confirmed");
      expect(AuditService.write).toHaveBeenCalledWith(
        ctx,
        expect.objectContaining({
          entityType: "order",
          entityId: "order-test-1",
          action: "status_change",
          newData: expect.objectContaining({
            status: "confirmed",
            priceSnapshot: expect.objectContaining({
              orderId: "order-test-1",
              offerCode: "individual_menu",
              finalAmountCents: 1190,
            }),
          }),
        }),
      );
    });

    it("rejects confirmation with PRICE_MISMATCH if expectedTotal does not match authoritative evaluation", async () => {
      const ctx = makeContext();
      const mockOrderWithItems: OrderWithItems = {
        order: {
          id: "order-test-1",
          tenant_id: ctx.tenantId,
          customer_id: "customer-123",
          status: "draft",
          total: 0.0, // Stale total from client or old draft
          week_start: "2026-07-20",
          notes: null,
          demand_channel: "individual",
          company_id: null,
          site_id: null,
          organizational_unit_id: null,
          delivery_group_id: null,
          delivery_address_id: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        items: [
          {
            id: "item-1",
            order_id: "order-test-1",
            tenant_id: ctx.tenantId,
            dish_id: "dish-01",
            day_date: "2026-07-20",
            qty: 1,
            comment: null,
            deleted_at: null,
          },
        ],
      };

      mockFindByIdWithItems.mockResolvedValue(mockOrderWithItems);

      await expect(
        OrderService.confirm(ctx, "order-test-1", {
          expectedTotal: 0.0,
        }),
      ).rejects.toThrowError(DomainError);

      await expect(
        OrderService.confirm(ctx, "order-test-1", {
          expectedTotal: 0.0,
        }),
      ).rejects.toMatchObject({
        code: "PRICE_MISMATCH",
      });

      expect(mockConfirmDraft).not.toHaveBeenCalled();
    });

    it("rejects confirmation if customer attempts to confirm an order they do not own", async () => {
      const ctx = makeContext();
      mockFindCustomerIdForUser.mockResolvedValue("customer-other");

      const mockOrderWithItems: OrderWithItems = {
        order: {
          id: "order-test-1",
          tenant_id: ctx.tenantId,
          customer_id: "customer-123",
          status: "draft",
          total: 11.9,
          week_start: "2026-07-20",
          notes: null,
          demand_channel: "individual",
          company_id: null,
          site_id: null,
          organizational_unit_id: null,
          delivery_group_id: null,
          delivery_address_id: null,
          created_at: new Date().toISOString(),
          deleted_at: null,
        },
        items: [],
      };

      mockFindByIdWithItems.mockResolvedValue(mockOrderWithItems);

      await expect(
        OrderService.confirm(ctx, "order-test-1", { expectedTotal: 11.9 }),
      ).rejects.toMatchObject({
        code: "PERMISSION_DENIED",
      });
      expect(mockConfirmDraft).not.toHaveBeenCalled();
    });
  });
});
