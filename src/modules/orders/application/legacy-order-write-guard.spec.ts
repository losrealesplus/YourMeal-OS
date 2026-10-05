import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceContext } from "@/services/types";
import { OrderService } from "./order-service";
import { OrderModificationService } from "./order-modification-service";

const mocks = vi.hoisted(() => ({
  current: { order: {} as Record<string, unknown>, items: [] as Array<Record<string, unknown>> },
  confirm: vi.fn(),
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
    supabase: { from: mocks.from },
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
    "blocks %s before confirm mutation or commercial reads",
    async (shape) => {
      if (shape === "custom")
        mocks.current.items = [{ id: "custom-item", dish_id: null, item_kind: "custom" }];
      else mocks.current.order.write_contract_version = 2;
      await expect(OrderService.confirm(context(), "order")).rejects.toMatchObject({
        code: "UNIMPLEMENTED",
      });
      expect(mocks.confirm).not.toHaveBeenCalled();
      expect(mocks.audit).not.toHaveBeenCalled();
      expect(mocks.from).not.toHaveBeenCalled();
    },
  );

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
