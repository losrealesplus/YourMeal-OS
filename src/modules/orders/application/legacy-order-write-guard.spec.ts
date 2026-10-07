import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceContext } from "@/services/types";
import { OrderService } from "./order-service";
import { OrderModificationService } from "./order-modification-service";

const mocks = vi.hoisted(() => ({
  current: { order: {} as Record<string, unknown>, items: [] as Array<Record<string, unknown>> },
  confirm: vi.fn(),
  rpc: vi.fn(),
  audit: vi.fn(),
  catalogue: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/permissions", () => ({ requireCapability: vi.fn(), hasStaffAccess: () => true }));
vi.mock("@/services/feature-flag-service", () => ({
  FeatureFlagService: { isEnabled: async () => true },
}));
vi.mock("@/services/audit-service", () => ({ AuditService: { write: mocks.audit } }));
vi.mock("../infrastructure/order-repository", () => ({
  createOrderRepository: () => ({
    findByIdWithItems: async () => mocks.current,
    confirmDraft: mocks.confirm,
  }),
}));
vi.mock("@/modules/dish-library/infrastructure/dish-repository", () => ({
  createDishRepository: () => ({ listCatalogByIds: mocks.catalogue }),
}));

function context(): ServiceContext {
  return {
    tenantId: "tenant",
    userId: "staff",
    roles: ["operations_manager"],
    supabase: { from: mocks.from, rpc: mocks.rpc },
  } as unknown as ServiceContext;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.current.order = { id: "order", status: "draft", customer_id: "customer", total: 5 };
  mocks.current.items = [{ id: "item", dish_id: "dish" }];
  mocks.from.mockImplementation((table: string) => {
    const q = {
      select: () => q,
      eq: () => q,
      is: () => q,
      maybeSingle: async () => ({ data: mocks.current.order, error: null }),
      then: (resolve: (value: unknown) => void) =>
        resolve({ data: table === "order_items" ? mocks.current.items : [], error: null }),
    };
    return q;
  });
});

describe("legacy paths cannot write future orders", () => {
  it.each(["custom", "v2"])(
    "blocks malformed %s before legacy confirm mutation or commercial reads",
    async (shape) => {
      if (shape === "custom")
        mocks.current.items = [{ id: "custom-item", dish_id: null, item_kind: "custom" }];
      else mocks.current.order.write_contract_version = 2;
      await expect(OrderService.confirm(context(), "order")).rejects.toMatchObject({
        code: shape === "custom" ? "UNIMPLEMENTED" : "INVALID_STATE",
      });
      expect(mocks.confirm).not.toHaveBeenCalled();
      expect(mocks.audit).not.toHaveBeenCalled();
      expect(mocks.from).not.toHaveBeenCalled();
    },
  );

  it("valid v2 confirmation goes exclusively through the canonical RPC", async () => {
    const id = "50000000-0000-4000-8000-000000000001";
    const ctx = context();
    ctx.tenantId = "10000000-0000-4000-8000-000000000001";
    mocks.current.order = { ...mocks.current.order, id, write_contract_version: 2, revision: 1 };
    mocks.rpc.mockImplementation(async (_name: string, args: { _request_id: string }) => ({
      data: {
        tenantId: ctx.tenantId,
        orderId: id,
        requestId: args._request_id,
        actorId: "20000000-0000-4000-8000-000000000001",
        schemaVersion: 1,
        fromState: "draft",
        toState: "confirmed",
        committedRevision: 2,
        outcome: "COMMITTED",
      },
      error: null,
    }));
    expect((await OrderService.confirm(ctx, id)).status).toBe("confirmed");
    expect(mocks.rpc).toHaveBeenCalledWith("cr_order_lifecycle_v2", expect.anything());
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it.each(["custom", "v2"])(
    "blocks %s before modification can replace order lines",
    async (shape) => {
      if (shape === "custom")
        mocks.current.items = [{ id: "custom-item", dish_id: null, item_kind: "custom" }];
      else mocks.current.order.write_contract_version = 2;
      await expect(
        OrderModificationService.modifyOrder(context(), {
          orderId: "order",
          lines: [{ dishId: "dish", dayDate: "2026-10-05", qty: 1 }],
        }),
      ).rejects.toMatchObject({ code: "UNIMPLEMENTED" });
      expect(mocks.catalogue).not.toHaveBeenCalled();
      expect(mocks.audit).not.toHaveBeenCalled();
    },
  );
});
