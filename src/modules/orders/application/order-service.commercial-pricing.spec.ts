import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { OrderService } from "./order-service";
import { AuditService } from "@/services/audit-service";
import type { OrderWithItems } from "../infrastructure/order-repository";
import {
  clearTenantOffersRegistry,
  registerTenantOffers,
  getTenantOffers,
} from "@/modules/commercial";
import type { CommercialOffer } from "@/modules/commercial";

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
      { day_date: "2026-07-20", dish_id: "dish-01", dishes: { id: "dish-01", price: 12.5 } },
      { day_date: "2026-07-21", dish_id: "dish-02", dishes: { id: "dish-02", price: 12.5 } },
      { day_date: "2026-07-22", dish_id: "dish-03", dishes: { id: "dish-03", price: 12.5 } },
      { day_date: "2026-07-23", dish_id: "dish-04", dishes: { id: "dish-04", price: 12.5 } },
      { day_date: "2026-07-24", dish_id: "dish-05", dishes: { id: "dish-05", price: 12.5 } },
      { day_date: "2026-07-24", dish_id: "dish-side", dishes: { id: "dish-side", price: 4.0 } },
    ]),
  })),
}));

vi.mock("@/modules/dish-library/infrastructure/dish-repository", () => ({
  createDishRepository: vi.fn(() => ({
    listCatalogByIds: vi.fn(async (ids: string[]) =>
      ids.map((id) => ({ id, name: `Dish ${id}`, price: 12.5 })),
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
    tenantId: "tenant-test-id",
    tenantSlug: "test-tenant",
    roles: ["customer"],
    capabilities: new Set(["orders.write", "orders.read"]),
    localization: null,
    ip: "127.0.0.1",
    ...overrides,
  };
}

describe("OrderService Commercial Pricing Universal Core Integration (FASE 3N-R2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTenantOffersRegistry();

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

  afterEach(() => {
    clearTenantOffersRegistry();
  });

  describe("1. Architectural Separation & Multi-Tenant Agnostic Invariants", () => {
    it("verifies Core registry has zero default hardcoded tenant offers", () => {
      expect(getTenantOffers("eatclean")).toEqual([]);
      expect(getTenantOffers("any-tenant")).toEqual([]);
      expect(getTenantOffers(null)).toEqual([]);
    });

    it("falls back to standard catalog dish pricing when no commercial offers are registered for tenant", async () => {
      const ctx = makeContext({ tenantSlug: "unconfigured-tenant" });

      const result = await OrderService.programDraftItems(ctx, {
        weekStart: "2026-07-20",
        items: [
          { dishId: "dish-01", dayDate: "2026-07-20", qty: 2 },
        ],
      });

      // Catalog dish price = 12.50 € * 2 = 25.00 €
      expect(mockInsertDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 25.0,
        }),
      );
      expect(result.order.total).toBe(25.0);
    });

    it("ensures two distinct tenants with custom offers resolve independent commercial pricing", async () => {
      // Tenant A: Acme Catering
      const acmeOffers: CommercialOffer[] = [
        {
          id: "acme-offer-single",
          code: "individual_menu",
          title: "Menú Ejecutivo Acme",
          subtitle: "Menú gourmet diario",
          description: "Alta gastronomía corporativa",
          basePrice: { cents: 1500, currency: "EUR", formatted: "15,00 €" },
          unitLabel: "menú",
          slotsIncluded: 1,
          promotions: [],
        },
      ];
      registerTenantOffers("acme-meals", acmeOffers);

      // Tenant B: Fit Food
      const fitFoodOffers: CommercialOffer[] = [
        {
          id: "fit-offer-single",
          code: "individual_menu",
          title: "Menú Fit Diario",
          subtitle: "Comida saludable económica",
          description: "Nutrición deportiva",
          basePrice: { cents: 850, currency: "EUR", formatted: "8,50 €" },
          unitLabel: "menú",
          slotsIncluded: 1,
          promotions: [],
        },
      ];
      registerTenantOffers("fit-food", fitFoodOffers);

      // Order for Tenant A
      const ctxA = makeContext({ tenantSlug: "acme-meals" });
      const resultA = await OrderService.programDraftItems(ctxA, {
        weekStart: "2026-07-20",
        items: [{ dishId: "dish-01", dayDate: "2026-07-20", qty: 1 }],
      });
      expect(resultA.order.total).toBe(15.0);

      // Order for Tenant B
      const ctxB = makeContext({ tenantSlug: "fit-food" });
      const resultB = await OrderService.programDraftItems(ctxB, {
        weekStart: "2026-07-20",
        items: [{ dishId: "dish-01", dayDate: "2026-07-20", qty: 1 }],
      });
      expect(resultB.order.total).toBe(8.5);
    });

    it("verifies missing tenantSlug context does not default to any tenant or pricing", async () => {
      const ctx = makeContext({ tenantSlug: null });

      const result = await OrderService.programDraftItems(ctx, {
        weekStart: "2026-07-20",
        items: [{ dishId: "dish-01", dayDate: "2026-07-20", qty: 1 }],
      });

      // Fallback to catalog dish price: 12.50 €
      expect(result.order.total).toBe(12.5);
    });

    it("verifies explicit commercial quantity: 1 individual menu (10,00 €) vs 2 individual menus (20,00 €)", async () => {
      const tenantOffers: CommercialOffer[] = [
        {
          id: "offer-ind",
          code: "individual_menu",
          title: "Menú Suelto",
          subtitle: "Por día",
          description: "Menú puntual",
          basePrice: { cents: 1000, currency: "EUR", formatted: "10,00 €" },
          unitLabel: "menú",
          slotsIncluded: 1,
          promotions: [],
        },
      ];
      registerTenantOffers("test-tenant", tenantOffers);

      const ctx = makeContext({ tenantSlug: "test-tenant" });

      // 1 menu unit
      const result1 = await OrderService.programDraftItems(ctx, {
        weekStart: "2026-07-20",
        offerCode: "individual_menu",
        items: [{ dishId: "dish-01", dayDate: "2026-07-20", qty: 1 }],
      });
      expect(result1.order.total).toBe(10.0);

      // 2 menu units across 2 distinct days
      const result2 = await OrderService.programDraftItems(ctx, {
        weekStart: "2026-07-20",
        offerCode: "individual_menu",
        items: [
          { dishId: "dish-01", dayDate: "2026-07-20", qty: 1 },
          { dishId: "dish-02", dayDate: "2026-07-21", qty: 1 },
        ],
      });
      expect(result2.order.total).toBe(20.0);
    });

    it("verifies 1 menu with 2 dish lines on same day does NOT become 2 billable menus", async () => {
      const tenantOffers: CommercialOffer[] = [
        {
          id: "offer-ind",
          code: "individual_menu",
          title: "Menú Suelto",
          subtitle: "Por día",
          description: "Menú puntual",
          basePrice: { cents: 1000, currency: "EUR", formatted: "10,00 €" },
          unitLabel: "menú",
          slotsIncluded: 1,
          promotions: [],
        },
      ];
      registerTenantOffers("test-tenant", tenantOffers);

      const ctx = makeContext({ tenantSlug: "test-tenant" });

      // 2 dish lines on the same delivery day (e.g. main dish + side)
      const result = await OrderService.programDraftItems(ctx, {
        weekStart: "2026-07-20",
        offerCode: "individual_menu",
        items: [
          { dishId: "dish-05", dayDate: "2026-07-24", qty: 1 },
          { dishId: "dish-side", dayDate: "2026-07-24", qty: 1 },
        ],
      });

      // Still exactly 1 billable daily menu unit = 10,00 € (NOT 20,00 €)
      expect(result.order.total).toBe(10.0);
    });

    it("verifies 5 menus with weekly_plan (45,00 €) vs 5 menus with individual_menu (50,00 €)", async () => {
      const tenantOffers: CommercialOffer[] = [
        {
          id: "offer-ind",
          code: "individual_menu",
          title: "Menú Suelto",
          subtitle: "Por día",
          description: "Menú puntual",
          basePrice: { cents: 1000, currency: "EUR", formatted: "10,00 €" },
          unitLabel: "menú",
          slotsIncluded: 1,
          promotions: [],
        },
        {
          id: "offer-weekly",
          code: "weekly_plan",
          title: "Pack Semanal",
          subtitle: "5 menús",
          description: "Pack 5 días con descuento",
          basePrice: { cents: 4500, currency: "EUR", formatted: "45,00 €" },
          unitLabel: "semana",
          slotsIncluded: 5,
          promotions: [],
        },
      ];
      registerTenantOffers("test-tenant", tenantOffers);

      const ctx = makeContext({ tenantSlug: "test-tenant" });

      // Case A: 5 dishes selected with explicit offerCode: "weekly_plan" -> evaluates 45.00 €
      const resultWeekly = await OrderService.programDraftItems(ctx, {
        weekStart: "2026-07-20",
        offerCode: "weekly_plan",
        items: [
          { dishId: "dish-01", dayDate: "2026-07-20", qty: 1 },
          { dishId: "dish-02", dayDate: "2026-07-21", qty: 1 },
          { dishId: "dish-03", dayDate: "2026-07-22", qty: 1 },
          { dishId: "dish-04", dayDate: "2026-07-23", qty: 1 },
          { dishId: "dish-05", dayDate: "2026-07-24", qty: 1 },
        ],
      });
      expect(resultWeekly.order.total).toBe(45.0);

      // Case B: 5 dishes selected with explicit offerCode: "individual_menu" -> evaluates 5 * 10.00 € = 50.00 €
      const resultIndividual = await OrderService.programDraftItems(ctx, {
        weekStart: "2026-07-20",
        offerCode: "individual_menu",
        items: [
          { dishId: "dish-01", dayDate: "2026-07-20", qty: 1 },
          { dishId: "dish-02", dayDate: "2026-07-21", qty: 1 },
          { dishId: "dish-03", dayDate: "2026-07-22", qty: 1 },
          { dishId: "dish-04", dayDate: "2026-07-23", qty: 1 },
          { dishId: "dish-05", dayDate: "2026-07-24", qty: 1 },
        ],
      });
      expect(resultIndividual.order.total).toBe(50.0);
    });

    it("evaluates extras and customer tier discounts according to registered tenant rules", async () => {
      const tenantOffers: CommercialOffer[] = [
        {
          id: "offer-ind",
          code: "individual_menu",
          title: "Menú Individual",
          subtitle: "Por día",
          description: "Menú",
          basePrice: { cents: 1000, currency: "EUR", formatted: "10,00 €" },
          unitLabel: "menú",
          slotsIncluded: 1,
          promotions: [
            {
              id: "promo-vip-extras",
              code: "VIP_EXTRAS_20",
              name: "20% dto en extras para VIP",
              type: "percentage",
              value: 20.0,
              appliesTo: "extras",
              eligibility: "subscriber_monthly",
            },
          ],
        },
      ];
      registerTenantOffers("test-tenant", tenantOffers);

      const ctx = makeContext({ tenantSlug: "test-tenant" });
      const result = await OrderService.programDraftItems(ctx, {
        weekStart: "2026-07-20",
        customerTier: "subscriber_monthly",
        items: [{ dishId: "dish-01", dayDate: "2026-07-20", qty: 1 }],
        extras: [
          {
            dishId: "extra-soup",
            dishName: "Sopa casera",
            basePriceCents: 500, // 5,00 € base -> 20% off -> 4,00 €
            qty: 1,
          },
        ],
      });

      // Base: 10,00 € + Extra con 20%: 4,00 € = 14,00 €
      expect(result.order.total).toBe(14.0);
    });
  });

  describe("2. Confirmation, Anti-Drift Guard & Immutable Price Snapshot", () => {
    it("confirms draft and writes immutable PriceSnapshot to AuditService", async () => {
      const tenantOffers: CommercialOffer[] = [
        {
          id: "offer-ind",
          code: "individual_menu",
          title: "Menú Individual",
          subtitle: "Por día",
          description: "Menú puntual",
          basePrice: { cents: 1200, currency: "EUR", formatted: "12,00 €" },
          unitLabel: "menú",
          slotsIncluded: 1,
          promotions: [],
        },
      ];
      registerTenantOffers("test-tenant", tenantOffers);

      const ctx = makeContext({ tenantSlug: "test-tenant" });
      const mockOrderWithItems: OrderWithItems = {
        order: {
          id: "order-test-1",
          tenant_id: ctx.tenantId,
          customer_id: "customer-123",
          status: "draft",
          total: 12.0,
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
        expectedTotal: 12.0,
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
              finalAmountCents: 1200,
            }),
          }),
        }),
      );
    });

    it("rejects confirmation with PRICE_MISMATCH if expectedTotal does not match authoritative evaluation", async () => {
      const tenantOffers: CommercialOffer[] = [
        {
          id: "offer-ind",
          code: "individual_menu",
          title: "Menú Individual",
          subtitle: "Por día",
          description: "Menú puntual",
          basePrice: { cents: 1400, currency: "EUR", formatted: "14,00 €" },
          unitLabel: "menú",
          slotsIncluded: 1,
          promotions: [],
        },
      ];
      registerTenantOffers("test-tenant", tenantOffers);

      const ctx = makeContext({ tenantSlug: "test-tenant" });
      const mockOrderWithItems: OrderWithItems = {
        order: {
          id: "order-test-1",
          tenant_id: ctx.tenantId,
          customer_id: "customer-123",
          status: "draft",
          total: 10.0, // Stale price from old draft
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
          expectedTotal: 10.0,
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
          total: 12.0,
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
        OrderService.confirm(ctx, "order-test-1", { expectedTotal: 12.0 }),
      ).rejects.toMatchObject({
        code: "PERMISSION_DENIED",
      });
      expect(mockConfirmDraft).not.toHaveBeenCalled();
    });
  });
});
