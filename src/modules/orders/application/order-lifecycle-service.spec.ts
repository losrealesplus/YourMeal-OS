import { describe, expect, it, vi, beforeEach } from "vitest";
import { OrderLifecycleService } from "./order-lifecycle-service";
import { AuditService } from "@/services/audit-service";
import type { ServiceContext } from "@/services/types";
import { DomainError } from "@/domain/errors";

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn(async () => undefined),
  },
}));

function createMockSupabase(orderData: { id: string; status: string; tenant_id: string }) {
  let currentStatus = orderData.status;
  const client = {
    from: () => ({
      update: (payload: { status: string }) => {
        currentStatus = payload.status;
        return {
          eq: function eq() {
            return {
              eq: function eq2() {
                return {
                  eq: function eq3() {
                    return {
                      is: function is() {
                        return {
                          select: () => ({
                            single: async () => ({
                              data: { ...orderData, status: currentStatus },
                              error: null,
                            }),
                          }),
                        };
                      },
                    };
                  },
                  is: function is() {
                    return {
                      select: () => ({
                        single: async () => ({
                          data: { ...orderData, status: currentStatus },
                          error: null,
                        }),
                      }),
                    };
                  },
                };
              },
            };
          },
        };
      },
    }),
  };
  return client;
}

function mockCtx(overrides: Partial<ServiceContext> = {}, supaClient?: any): ServiceContext {
  return {
    supabase: supaClient ?? ({} as any),
    userId: "staff-1",
    tenantId: "tenant-eatclean",
    roles: ["operations_manager"],
    capabilities: new Set(["orders.write"]),
    localization: null,
    ip: "127.0.0.1",
    ...overrides,
  };
}

describe("OrderLifecycleService (CR-OPS-09B)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires orders.write capability", async () => {
    const ctx = mockCtx({ roles: ["customer"], capabilities: new Set() });
    const repo = {
      findByIdWithItems: vi.fn(async () => null),
    } as any;

    await expect(OrderLifecycleService.confirmOrder(ctx, repo, "o1")).rejects.toThrow();
    await expect(OrderLifecycleService.cancelOrder(ctx, repo, "o1", "reason")).rejects.toThrow();
  });

  describe("confirmOrder", () => {
    it("confirms draft order and writes audit log", async () => {
      const order = { id: "o1", status: "draft", tenant_id: "tenant-eatclean" };
      const repo = {
        findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
      } as any;
      const supa = createMockSupabase(order);
      const ctx = mockCtx({}, supa);

      const res = await OrderLifecycleService.confirmOrder(ctx, repo, "o1");

      expect(res.status).toBe("confirmed");
      expect(AuditService.write).toHaveBeenCalledWith(
        ctx,
        expect.objectContaining({
          action: "status_change",
          oldData: { status: "draft" },
          newData: { status: "confirmed" },
        }),
      );
    });

    it("rejects confirming order when not in draft status", async () => {
      const order = { id: "o1", status: "confirmed", tenant_id: "tenant-eatclean" };
      const repo = {
        findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
      } as any;
      const ctx = mockCtx();

      await expect(OrderLifecycleService.confirmOrder(ctx, repo, "o1")).rejects.toBeInstanceOf(
        DomainError,
      );
    });
  });

  describe("advanceKitchen and advanceDelivery", () => {
    it("advances kitchen status from confirmed to in_production", async () => {
      const order = { id: "o1", status: "confirmed", tenant_id: "tenant-eatclean" };
      const repo = {
        findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
      } as any;
      const supa = createMockSupabase(order);
      const ctx = mockCtx({}, supa);

      const res = await OrderLifecycleService.advanceKitchen(ctx, repo, "o1");

      expect(res.status).toBe("in_production");
      expect(AuditService.write).toHaveBeenCalledWith(
        ctx,
        expect.objectContaining({
          action: "status_change",
          oldData: { status: "confirmed" },
          newData: { status: "in_production" },
        }),
      );
    });

    it("advances delivery status from ready_for_delivery to out_for_delivery", async () => {
      const order = { id: "o1", status: "ready_for_delivery", tenant_id: "tenant-eatclean" };
      const repo = {
        findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
      } as any;
      const supa = createMockSupabase(order);
      const ctx = mockCtx({}, supa);

      const res = await OrderLifecycleService.advanceDelivery(ctx, repo, "o1");

      expect(res.status).toBe("out_for_delivery");
    });
  });

  describe("cancelOrder", () => {
    it("rejects cancellation if reason is missing or whitespace only", async () => {
      const repo = {} as any;
      const ctx = mockCtx();

      await expect(OrderLifecycleService.cancelOrder(ctx, repo, "o1", "")).rejects.toBeInstanceOf(
        DomainError,
      );
      await expect(
        OrderLifecycleService.cancelOrder(ctx, repo, "o1", "   "),
      ).rejects.toBeInstanceOf(DomainError);
    });

    it("cancels order from confirmed status and records cancelReason in audit", async () => {
      const order = { id: "o1", status: "confirmed", tenant_id: "tenant-eatclean" };
      const repo = {
        findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
      } as any;
      const supa = createMockSupabase(order);
      const ctx = mockCtx({}, supa);

      const res = await OrderLifecycleService.cancelOrder(
        ctx,
        repo,
        "o1",
        "Solicitado por el cliente",
      );

      expect(res.status).toBe("cancelled");
      expect(AuditService.write).toHaveBeenCalledWith(
        ctx,
        expect.objectContaining({
          action: "status_change",
          oldData: { status: "confirmed" },
          newData: { status: "cancelled", cancelReason: "Solicitado por el cliente" },
        }),
      );
    });

    it.each([
      "draft",
      "confirmed",
      "in_production",
      "prepared",
      "ready_for_delivery",
    ])("allows cancellation from status %s", async (status) => {
      const order = { id: "o1", status, tenant_id: "tenant-eatclean" };
      const repo = {
        findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
      } as any;
      const supa = createMockSupabase(order);
      const ctx = mockCtx({}, supa);

      const res = await OrderLifecycleService.cancelOrder(ctx, repo, "o1", "Motivo operacional");
      expect(res.status).toBe("cancelled");
    });

    it.each(["out_for_delivery", "delivered", "cancelled"])(
      "prohibits cancellation from status %s",
      async (status) => {
        const order = { id: "o1", status, tenant_id: "tenant-eatclean" };
        const repo = {
          findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
        } as any;
        const ctx = mockCtx();

        await expect(
          OrderLifecycleService.cancelOrder(ctx, repo, "o1", "Motivo"),
        ).rejects.toBeInstanceOf(DomainError);
      },
    );
  });

  describe("rollbackStatus", () => {
    it("rejects rollback if reason is empty or whitespace", async () => {
      const order = { id: "o1", status: "prepared", tenant_id: "tenant-eatclean" };
      const repo = {
        findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
      } as any;
      const ctx = mockCtx();

      await expect(
        OrderLifecycleService.rollbackStatus(ctx, repo, "o1", ""),
      ).rejects.toBeInstanceOf(DomainError);

      await expect(
        OrderLifecycleService.rollbackStatus(ctx, repo, "o1", "   "),
      ).rejects.toBeInstanceOf(DomainError);
    });

    it("rolls back from prepared to in_production and writes audit log", async () => {
      const order = { id: "o1", status: "prepared", tenant_id: "tenant-eatclean" };
      const repo = {
        findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
      } as any;
      const supa = createMockSupabase(order);
      const ctx = mockCtx({}, supa);

      const res = await OrderLifecycleService.rollbackStatus(
        ctx,
        repo,
        "o1",
        "Aún no está empaquetado",
      );

      expect(res.status).toBe("in_production");
      expect(AuditService.write).toHaveBeenCalledWith(
        ctx,
        expect.objectContaining({
          entityType: "order",
          entityId: "o1",
          action: "status_change",
          oldData: { status: "prepared" },
          newData: { status: "in_production", reason: "Aún no está empaquetado", isRollback: true },
        }),
      );
    });

    it("rolls back from in_production to confirmed", async () => {
      const order = { id: "o1", status: "in_production", tenant_id: "tenant-eatclean" };
      const repo = {
        findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
      } as any;
      const supa = createMockSupabase(order);
      const ctx = mockCtx({}, supa);

      const res = await OrderLifecycleService.rollbackStatus(
        ctx,
        repo,
        "o1",
        "Error al iniciar en cocina",
      );

      expect(res.status).toBe("confirmed");
    });

    it("rolls back from ready_for_delivery to prepared", async () => {
      const order = { id: "o1", status: "ready_for_delivery", tenant_id: "tenant-eatclean" };
      const repo = {
        findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
      } as any;
      const supa = createMockSupabase(order);
      const ctx = mockCtx({}, supa);

      const res = await OrderLifecycleService.rollbackStatus(
        ctx,
        repo,
        "o1",
        "Reabrir empaque para revisión",
      );

      expect(res.status).toBe("prepared");
    });

    it.each(["draft", "confirmed", "out_for_delivery", "delivered", "cancelled"])(
      "prohibits rollback from irreversible/invalid status %s",
      async (status) => {
        const order = { id: "o1", status, tenant_id: "tenant-eatclean" };
        const repo = {
          findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
        } as any;
        const ctx = mockCtx();

        await expect(
          OrderLifecycleService.rollbackStatus(ctx, repo, "o1", "Razón cualquiera"),
        ).rejects.toBeInstanceOf(DomainError);
      },
    );

    it("rejects rollback on canonical v2 orders", async () => {
      const order = {
        id: "o1",
        status: "prepared",
        tenant_id: "tenant-eatclean",
        write_contract_version: 2,
      };
      const repo = {
        findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
      } as any;
      const ctx = mockCtx();

      await expect(
        OrderLifecycleService.rollbackStatus(ctx, repo, "o1", "Intento en v2"),
      ).rejects.toBeInstanceOf(DomainError);
    });
  });
});
