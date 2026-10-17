import { describe, expect, it, vi, beforeEach } from "vitest";
import { OrderService } from "./order-service";
import { OrderIntakeService } from "@/modules/order-intake";
import type { ServiceContext } from "@/services/types";
import type { CaptureTransport } from "./custom-order-capture-service";
import type { OrderRow, OrderItemRow } from "../infrastructure/order-repository";

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn(async () => undefined),
  },
}));

vi.mock("@/services/feature-flag-service", () => ({
  FeatureFlagService: {
    isEnabled: vi.fn(async () => true),
  },
}));

const EATCLEAN_TENANT_ID = "8bba00ba-331b-42c8-9283-4e3836ffb870";
const DISH_1_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DISH_2_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ADDR_1_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const CUST_1_ID = "11111111-1111-4111-8111-111111111111";

const mockMenuSlotsWithExplicitPrice = [
  {
    id: "slot-1",
    tenant_id: EATCLEAN_TENANT_ID,
    weekly_menu_id: "menu-1",
    day_date: "2026-10-19",
    dish_id: DISH_1_ID,
    unit_price: 11.9, // EXPLICIT OFFER PRICE
    dishes: {
      id: DISH_1_ID,
      tenant_id: EATCLEAN_TENANT_ID,
      status: "active",
      deleted_at: null,
      price: 12.5,
    },
  },
  {
    id: "slot-2",
    tenant_id: EATCLEAN_TENANT_ID,
    weekly_menu_id: "menu-1",
    day_date: "2026-10-21",
    dish_id: DISH_2_ID,
    unit_price: 13.5, // EXPLICIT OFFER PRICE
    dishes: {
      id: DISH_2_ID,
      tenant_id: EATCLEAN_TENANT_ID,
      status: "active",
      deleted_at: null,
      price: 14.0,
    },
  },
];

vi.mock("@/modules/weekly-menu/infrastructure/weekly-menu-repository", () => ({
  createWeeklyMenuRepository: () => ({
    findPublishedByWeekStart: async (weekStart: string) => ({
      id: "menu-1",
      tenant_id: EATCLEAN_TENANT_ID,
      week_start: weekStart,
      status: "published",
      deleted_at: null,
    }),
    listSlotsWithDishes: async () => mockMenuSlotsWithExplicitPrice,
  }),
}));

vi.mock("@/modules/orders/infrastructure/order-repository", () => {
  const original = vi.importActual("@/modules/orders/infrastructure/order-repository");
  return {
    ...original,
    createOrderRepository: () => ({
      findCustomerIdForUser: vi.fn(async () => CUST_1_ID),
      findByIdWithItems: vi.fn(async (orderId: string) => ({
        order: {
          id: orderId,
          tenant_id: EATCLEAN_TENANT_ID,
          customer_id: CUST_1_ID,
          status: "draft",
          total: 25.4,
          write_contract_version: 2,
          revision: 1,
          deleted_at: null,
        } as OrderRow,
        items: [] as OrderItemRow[],
      })),
      insertDraft: vi.fn(async () => {
        throw new Error("insertDraft must NOT be called for explicit offer prices");
      }),
    }),
  };
});

vi.mock("@/modules/company-account/application/company-account-service", () => ({
  CompanyAccountService: {
    ensureIndividualCustomer: vi.fn(async () => CUST_1_ID),
    resolveOrderDemandContext: vi.fn(async () => ({ demandChannel: "individual" as const })),
  },
}));

vi.mock("./order-lifecycle-service", () => ({
  OrderLifecycleService: {
    confirmOrder: vi.fn(async (_ctx, _repo, orderId) => ({
      id: orderId,
      status: "confirmed",
      write_contract_version: 2,
      revision: 2,
    })),
  },
}));

describe("OrderService & OrderIntakeService with Canonical Quoted Writer", () => {
  const mockCtx: ServiceContext = {
    userId: "user-1",
    tenantId: EATCLEAN_TENANT_ID,
    tenantSlug: "eatclean",
    roles: ["customer"],
    capabilities: new Set(),
    supabase: {
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(function (this: any) {
            return this;
          }),
          is: vi.fn(function (this: any) {
            return this;
          }),
          maybeSingle: vi.fn(async () => ({ data: { id: ADDR_1_ID }, error: null })),
        })),
      })),
    } as any,
  };

  it("routes draft order capture to canonical quoted writer when weekly menu slots have explicit unit_price", async () => {
    let quoteCalledWith: any = null;
    let commitCalledWith: any = null;

    const mockTransport: CaptureTransport = {
      quote: vi.fn(async (request) => {
        quoteCalledWith = request;
        return {
          quoteId: "33333333-3333-4333-8333-333333333333",
          total: "25.40",
          lines: [
            { dishId: DISH_1_ID, dayDate: "2026-10-19", qty: 1, unitPrice: "11.90" },
            { dishId: DISH_2_ID, dayDate: "2026-10-21", qty: 1, unitPrice: "13.50" },
          ],
        };
      }),
      mixed: vi.fn(async (request) => {
        commitCalledWith = request;
        return {
          order: {
            id: "11111111-1111-4111-8111-111111111111",
            tenant_id: EATCLEAN_TENANT_ID,
            customer_id: CUST_1_ID,
            status: "draft",
            total: 25.4,
            write_contract_version: 2,
            revision: 1,
            created_at: new Date().toISOString(),
          } as OrderRow,
          items: [],
          committedRevision: 1,
          replayed: false,
          inputHash: "hash-test",
        };
      }),
      custom: vi.fn(async () => {
        throw new Error("Should not use custom");
      }),
    };

    const result = await OrderService.programDraftItems(
      mockCtx,
      {
        weekStart: "2026-10-19",
        items: [
          { dishId: DISH_1_ID, dayDate: "2026-10-19", qty: 1 },
          { dishId: DISH_2_ID, dayDate: "2026-10-21", qty: 1 },
        ],
        notes: "Por favor entregar antes de las 13:00",
      },
      { transport: mockTransport },
    );

    // Verifies canonical session execution
    expect(mockTransport.quote).toHaveBeenCalledTimes(1);
    expect(mockTransport.mixed).toHaveBeenCalledTimes(1);
    expect(quoteCalledWith.command.operation).toBe("capture");
    expect(quoteCalledWith.command.autoConfirm).toBe(false);
    expect(quoteCalledWith.command.demandChannel).toBe("individual");
    expect(quoteCalledWith.command.lines).toHaveLength(2);
    expect(quoteCalledWith.command.deliveryAddressId).toBe(ADDR_1_ID);

    expect(commitCalledWith.quoteId).toBe("33333333-3333-4333-8333-333333333333");
    expect(result.order.write_contract_version).toBe(2);
    expect(result.order.status).toBe("draft");
  });

  it("allows confirming V2 draft order via OrderService.confirm", async () => {
    const confirmed = await OrderService.confirm(mockCtx, "11111111-1111-4111-8111-111111111111", {
      expectedTotal: 25.4,
    });

    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.write_contract_version).toBe(2);
  });

  it("OrderIntakeService.intakeDraft delegates to canonical quoted writer via options", async () => {
    const mockTransport: CaptureTransport = {
      quote: vi.fn(async () => ({
        quoteId: "44444444-4444-4444-8444-444444444444",
        total: "11.90",
        lines: [{ dishId: DISH_1_ID, dayDate: "2026-10-19", qty: 1, unitPrice: "11.90" }],
      })),
      mixed: vi.fn(async () => ({
        order: {
          id: "22222222-2222-4222-8222-222222222222",
          tenant_id: EATCLEAN_TENANT_ID,
          customer_id: CUST_1_ID,
          status: "draft",
          total: 11.9,
          write_contract_version: 2,
          revision: 1,
        } as OrderRow,
        items: [],
        committedRevision: 1,
        replayed: false,
        inputHash: "hash-intake",
      })),
      custom: vi.fn(async () => {
        throw new Error("Should not use custom");
      }),
    };

    const res = await OrderIntakeService.intakeDraft(
      mockCtx,
      {
        channel: "app",
        weekStart: "2026-10-19",
        items: [{ dishId: DISH_1_ID, dayDate: "2026-10-19", qty: 1 }],
      },
      { transport: mockTransport },
    );

    expect(mockTransport.quote).toHaveBeenCalledTimes(1);
    expect(mockTransport.mixed).toHaveBeenCalledTimes(1);
    expect(res.order.id).toBe("22222222-2222-4222-8222-222222222222");
    expect(res.order.write_contract_version).toBe(2);
  });
});
