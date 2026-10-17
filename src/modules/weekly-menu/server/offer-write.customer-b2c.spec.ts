import { describe, expect, it, vi, beforeEach } from "vitest";
import { parseOfferWriteRequest } from "../application/offer-write-input";
import {
  offerCommercialContext,
  runVerifiedOfferWrite,
  verifiedOrderActorContext,
} from "./offer-write.server";
import { EATCLEAN_TENANT_ID } from "@/config/eatclean-partial-launch";
import type { AppSupabase } from "@/services/types";
import {
  clearTenantOffersRegistry,
  registerTenantOffers,
} from "@/modules/commercial/application/commercial-offer-registry";

vi.mock("@/tenant/resources/commercial.json", () => ({ default: [] }));

const PROD_EATCLEAN_ENV = {
  TENANT_SLUG: "eatclean",
  SUPABASE_URL: "https://nhirlpkuvonggctdzzad.supabase.co",
};

const B2C_USER_ID = "00000000-0000-4000-8000-0000000000aa";
const CUSTOMER_ID = "00000000-0000-4000-8000-0000000000c1";
const MENU_ID = "30000000-0000-4000-8000-000000000001";

const DISH_MON = "40000000-0000-4000-8000-000000000001";
const DISH_WED = "40000000-0000-4000-8000-000000000002";
const DISH_FRI = "40000000-0000-4000-8000-000000000003";

const multiDayCaptureRequest = parseOfferWriteRequest({
  tenantId: EATCLEAN_TENANT_ID,
  requestId: "70000000-0000-4000-8000-000000000010",
  command: {
    operation: "capture",
    weekStart: "2026-10-19",
    customer: { kind: "existing", id: CUSTOMER_ID },
    demandChannel: "individual",
    lines: [
      {
        kind: "dish",
        dishId: DISH_MON,
        dayDate: "2026-10-19",
        qty: 2,
      },
      {
        kind: "dish",
        dishId: DISH_WED,
        dayDate: "2026-10-21",
        qty: 1,
      },
      {
        kind: "dish",
        dishId: DISH_FRI,
        dayDate: "2026-10-23",
        qty: 3,
      },
    ],
  },
});

/**
 * Isolated test fixture simulating real production customer account (Cuenta A):
 * - tenant_members: status = 'approved', membership_type = 'customer'
 * - user_roles: [] (0 rows, NO explicit staff roles)
 * - saas_admin: null
 */
function createB2CCustomerActor(options: {
  status?: "approved" | "pending" | "rejected";
  membershipType?: "customer" | "employee";
  userRoles?: { role: string }[];
  saasAdmin?: boolean;
} = {}) {
  const status = options.status ?? "approved";
  const membershipType = options.membershipType ?? "customer";
  const userRoles = options.userRoles ?? [];
  const saasAdmin = options.saasAdmin ?? false;

  return {
    userId: B2C_USER_ID,
    supabase: {
      from(table: string) {
        const query: any = {
          select: () => query,
          eq: vi.fn((col: string, val: string) => {
            query._filters = query._filters || {};
            query._filters[col] = val;
            return query;
          }),
          is: vi.fn((col: string, val: unknown) => {
            query._filters = query._filters || {};
            query._filters[col] = val;
            return query;
          }),
          maybeSingle: async () => {
            if (table === "tenants") {
              return { data: { id: EATCLEAN_TENANT_ID, slug: "eatclean" }, error: null };
            }
            if (table === "tenant_members") {
              if (status !== "approved") return { data: null, error: null };
              return {
                data: {
                  status,
                  membership_type: membershipType,
                },
                error: null,
              };
            }
            if (table === "user_roles") {
              if (query._filters?.role === "saas_admin") {
                return { data: saasAdmin ? { role: "saas_admin" } : null, error: null };
              }
              return { data: userRoles[0] ?? null, error: null };
            }
            return { data: null, error: null };
          },
          then: (resolve: (v: unknown) => unknown) => {
            if (table === "user_roles") {
              return Promise.resolve({ data: userRoles, error: null }).then(resolve);
            }
            return Promise.resolve({ data: [], error: null }).then(resolve);
          },
        };
        return query;
      },
    } as unknown as AppSupabase,
  };
}

describe("B2C Customer (Cuenta A) Order Authorization & Multiday Persistence Suite", () => {
  beforeEach(() => {
    clearTenantOffersRegistry();
    registerTenantOffers("eatclean", [
      {
        id: "individual_menu",
        title: "Individual Menu",
        subtitle: "",
        description: "",
        unitLabel: "plato",
        slotsIncluded: 1,
        code: "individual_menu",
        pricingModel: "per_unit",
        basePrice: { cents: 450, currency: "EUR", formatted: "4,50 €" },
        promotions: [],
      } as any,
    ]);
  });

  it("CUSTOMER_QUOTE_AUTH: verifiedOrderActorContext resolves effective role ['customer'] from approved membership when user_roles is empty", async () => {
    const actor = createB2CCustomerActor(); // status: approved, membership_type: customer, user_roles: []
    const context = await verifiedOrderActorContext(actor, EATCLEAN_TENANT_ID, PROD_EATCLEAN_ENV);

    expect(context.tenant.slug).toBe("eatclean");
    expect(context.roles).toEqual(["customer"]);
  });

  it("CUSTOMER_QUOTE_AUTH: B2C customer without user_roles successfully issues a server canonical quote", async () => {
    const actor = createB2CCustomerActor();
    const commercialCtx = await offerCommercialContext(actor, EATCLEAN_TENANT_ID, PROD_EATCLEAN_ENV);

    const rpcMock = vi.fn().mockResolvedValue({
      data: {
        quoteId: "60000000-0000-4000-8000-000000000001",
        expiresAt: new Date(Date.now() + 900000).toISOString(),
        policyHash: commercialCtx.policyHash,
        total: "27.00",
        lines: [
          {
            slotId: null,
            menuId: MENU_ID,
            dishId: DISH_MON,
            dayDate: "2026-10-19",
            qty: 2,
            basePrice: "4.5000",
            unitPrice: "4.5000",
            slotPrice: "4.5000",
            priceSource: "slot",
            priceSnapshotStatus: "captured",
            isOffMenu: false,
          },
          {
            slotId: null,
            menuId: MENU_ID,
            dishId: DISH_WED,
            dayDate: "2026-10-21",
            qty: 1,
            basePrice: "4.5000",
            unitPrice: "4.5000",
            slotPrice: "4.5000",
            priceSource: "slot",
            priceSnapshotStatus: "captured",
            isOffMenu: false,
          },
          {
            slotId: null,
            menuId: MENU_ID,
            dishId: DISH_FRI,
            dayDate: "2026-10-23",
            qty: 3,
            basePrice: "4.5000",
            unitPrice: "4.5000",
            slotPrice: "4.5000",
            priceSource: "slot",
            priceSnapshotStatus: "captured",
            isOffMenu: false,
          },
        ],
      },
      error: null,
    });

    const quoteResult = await runVerifiedOfferWrite(
      actor,
      multiDayCaptureRequest,
      undefined,
      { rpc: rpcMock },
      false,
      PROD_EATCLEAN_ENV,
    );

    expect(quoteResult).toBeDefined();
    expect((quoteResult as any).quoteId).toBe("60000000-0000-4000-8000-000000000001");
    expect((quoteResult as any).total).toBe("27.00");
    expect((quoteResult as any).lines).toHaveLength(3);
    expect(rpcMock).toHaveBeenCalledWith(
      "cr_order_offer_quote_issue",
      expect.objectContaining({
        _tenant_id: EATCLEAN_TENANT_ID,
        _actor_id: B2C_USER_ID,
      }),
    );
  });

  it("CUSTOMER_COMMIT_AUTH & ORDER_PERSISTENCE: B2C customer commits order to draft preserving writeContractVersion 2", async () => {
    const actor = createB2CCustomerActor();
    const quoteId = "60000000-0000-4000-8000-000000000001";
    const committedOrderId = "50000000-0000-4000-8000-000000000099";

    const rpcMock = vi.fn().mockResolvedValue({
      data: {
        order: {
          id: committedOrderId,
          tenant_id: EATCLEAN_TENANT_ID,
          customer_id: CUSTOMER_ID,
          status: "draft",
          total: 27.0,
          currency: "EUR",
          week_start: "2026-10-19",
          write_contract_version: 2,
          revision: 1,
        },
        items: [
          {
            id: "10000000-0000-4000-8000-000000000001",
            tenant_id: EATCLEAN_TENANT_ID,
            order_id: committedOrderId,
            dish_id: DISH_MON,
            day_date: "2026-10-19",
            qty: 2,
            unit_price: 4.5,
            item_kind: "dish",
          },
          {
            id: "10000000-0000-4000-8000-000000000002",
            tenant_id: EATCLEAN_TENANT_ID,
            order_id: committedOrderId,
            dish_id: DISH_WED,
            day_date: "2026-10-21",
            qty: 1,
            unit_price: 4.5,
            item_kind: "dish",
          },
          {
            id: "10000000-0000-4000-8000-000000000003",
            tenant_id: EATCLEAN_TENANT_ID,
            order_id: committedOrderId,
            dish_id: DISH_FRI,
            day_date: "2026-10-23",
            qty: 3,
            unit_price: 4.5,
            item_kind: "dish",
          },
        ],
        committedRevision: 1,
        replayed: false,
        inputHash: "a".repeat(64),
      },
      error: null,
    });

    const commitResult = await runVerifiedOfferWrite(
      actor,
      multiDayCaptureRequest,
      quoteId,
      { rpc: rpcMock },
      false,
      PROD_EATCLEAN_ENV,
    );

    expect(commitResult).toBeDefined();
    if (!("order" in commitResult)) throw new Error("Expected commitResult to have order");
    expect(commitResult.order.id).toBe(committedOrderId);
    expect(commitResult.order.status).toBe("draft");
    expect(commitResult.order.write_contract_version).toBe(2);
    expect(commitResult.order.total).toBe(27.0);
    expect(commitResult.items).toHaveLength(3);
    expect(rpcMock).toHaveBeenCalledWith(
      "cr_order_offer_quote_commit",
      expect.objectContaining({
        _tenant_id: EATCLEAN_TENANT_ID,
        _actor_id: B2C_USER_ID,
        _quote_id: quoteId,
      }),
    );
  });

  it("MULTIDAY_PERSISTENCE: Verifies multi-day order payload preserves distinct dates, quantities, and prices", async () => {
    const actor = createB2CCustomerActor();
    const quoteId = "60000000-0000-4000-8000-000000000001";
    const committedOrderId = "50000000-0000-4000-8000-000000000099";

    let capturedCommand: any = null;
    const rpcMock = vi.fn().mockImplementation((rpcName, params) => {
      capturedCommand = params._command;
      return Promise.resolve({
        data: {
          order: {
            id: committedOrderId,
            tenant_id: EATCLEAN_TENANT_ID,
            customer_id: CUSTOMER_ID,
            status: "draft",
            total: 27.0,
            currency: "EUR",
            week_start: "2026-10-19",
            write_contract_version: 2,
            revision: 1,
          },
          items: [
            {
              id: "10000000-0000-4000-8000-000000000001",
              tenant_id: EATCLEAN_TENANT_ID,
              order_id: committedOrderId,
              dish_id: DISH_MON,
              day_date: "2026-10-19",
              qty: 2,
              unit_price: 4.5,
              item_kind: "dish",
            },
            {
              id: "10000000-0000-4000-8000-000000000002",
              tenant_id: EATCLEAN_TENANT_ID,
              order_id: committedOrderId,
              dish_id: DISH_WED,
              day_date: "2026-10-21",
              qty: 1,
              unit_price: 4.5,
              item_kind: "dish",
            },
            {
              id: "10000000-0000-4000-8000-000000000003",
              tenant_id: EATCLEAN_TENANT_ID,
              order_id: committedOrderId,
              dish_id: DISH_FRI,
              day_date: "2026-10-23",
              qty: 3,
              unit_price: 4.5,
              item_kind: "dish",
            },
          ],
          committedRevision: 1,
          replayed: false,
          inputHash: "a".repeat(64),
        },
        error: null,
      });
    });

    const result = await runVerifiedOfferWrite(
      actor,
      multiDayCaptureRequest,
      quoteId,
      { rpc: rpcMock },
      false,
      PROD_EATCLEAN_ENV,
    );

    expect(capturedCommand).toBeDefined();
    expect(capturedCommand.lines).toHaveLength(3);

    // Monday line
    const monLine = capturedCommand.lines.find((l: any) => l.dayDate === "2026-10-19");
    expect(monLine).toBeDefined();
    expect(monLine.dishId).toBe(DISH_MON);
    expect(monLine.qty).toBe(2);

    // Wednesday line
    const wedLine = capturedCommand.lines.find((l: any) => l.dayDate === "2026-10-21");
    expect(wedLine).toBeDefined();
    expect(wedLine.dishId).toBe(DISH_WED);
    expect(wedLine.qty).toBe(1);

    // Friday line
    const friLine = capturedCommand.lines.find((l: any) => l.dayDate === "2026-10-23");
    expect(friLine).toBeDefined();
    expect(friLine.dishId).toBe(DISH_FRI);
    expect(friLine.qty).toBe(3);

    // Order items persisted
    if (!("items" in result)) throw new Error("Expected result to have items");
    expect(result.items).toHaveLength(3);
    expect(result.items.map((i: any) => i.day_date)).toEqual([
      "2026-10-19",
      "2026-10-21",
      "2026-10-23",
    ]);
  });

  it("DEFENSE-IN-DEPTH: Pending membership is strictly rejected with PERMISSION_DENIED", async () => {
    const pendingActor = createB2CCustomerActor({ status: "pending" });
    await expect(
      verifiedOrderActorContext(pendingActor, EATCLEAN_TENANT_ID, PROD_EATCLEAN_ENV),
    ).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
      message: "Active tenant membership required",
    });
  });

  it("DEFENSE-IN-DEPTH: B2C customer attempting custom order lines is strictly rejected with PERMISSION_DENIED", async () => {
    const actor = createB2CCustomerActor();
    const customWithDishRequest = parseOfferWriteRequest({
      tenantId: EATCLEAN_TENANT_ID,
      requestId: "70000000-0000-4000-8000-000000000099",
      command: {
        operation: "capture",
        weekStart: "2026-10-19",
        customer: { kind: "existing", id: CUSTOMER_ID },
        lines: [
          {
            kind: "dish",
            dishId: DISH_MON,
            dayDate: "2026-10-19",
            qty: 1,
          },
          {
            kind: "custom",
            name: "Custom Chef Meal",
            dayDate: "2026-10-19",
            qty: 1,
            unitPrice: "15.00",
          },
        ],
      },
    });

    await expect(
      runVerifiedOfferWrite(actor, customWithDishRequest, undefined, { rpc: vi.fn() }, false, PROD_EATCLEAN_ENV),
    ).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
      message: "Staff capability required for custom writes",
    });
  });
});
