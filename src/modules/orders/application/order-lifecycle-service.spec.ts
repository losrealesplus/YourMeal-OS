import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { OrderLifecycleService } from "./order-lifecycle-service";
import { AuditService } from "@/services/audit-service";
import type { ServiceContext } from "@/services/types";
import { DomainError } from "@/domain/errors";
import { setOperationalRollbackEnabledForTests } from "@/modules/operations";

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn(async () => undefined),
  },
}));

function createMockSupabase(orderData: { id: string; status: string; tenant_id: string }) {
  let currentStatus = orderData.status;
  const updates: Array<{ status: string }> = [];
  const client = {
    getStatus: () => currentStatus,
    getUpdates: () => updates,
    from: vi.fn(() => ({
      update: vi.fn((payload: { status: string }) => {
        currentStatus = payload.status;
        updates.push(payload);
        return {
          eq: function eq() {
            return {
              eq: function eq2() {
                return {
                  eq: function eq3() {
                    return {
                      is: function is() {
                        return {
                          then: (resolve: any) => resolve({ data: null, error: null }),
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
                      then: (resolve: any) => resolve({ data: null, error: null }),
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
      }),
    })),
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
    it("strictly blocks rollback at the application layer by default while atomic RPC is pending", async () => {
      const order = { id: "o1", status: "prepared", tenant_id: "tenant-eatclean" };
      const repo = {
        findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
      } as any;
      const supa = createMockSupabase(order);
      const ctx = mockCtx({}, supa);

      await expect(
        OrderLifecycleService.rollbackStatus(ctx, repo, "o1", "Motivo de prueba"),
      ).rejects.toThrow(
        "El retroceso de estados operacionales está desactivado hasta disponer de una operación transaccional atómica en PostgreSQL.",
      );

      expect(repo.findByIdWithItems).not.toHaveBeenCalled();
      expect(supa.from).not.toHaveBeenCalled();
      expect(AuditService.write).not.toHaveBeenCalled();
    });

    describe("when rollback is enabled for unit tests", () => {
      beforeEach(() => {
        setOperationalRollbackEnabledForTests(true);
      });

      afterEach(() => {
        setOperationalRollbackEnabledForTests(false);
      });

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

      it("rolls back from prepared to in_production via atomic RPC", async () => {
        const order = { id: "o1", status: "prepared", tenant_id: "tenant-eatclean" };
        const repo = {
          findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
          rollbackStatusV1: vi.fn(async () => ({ ...order, status: "in_production" })),
        } as any;
        const ctx = mockCtx();

        const res = await OrderLifecycleService.rollbackStatus(
          ctx,
          repo,
          "o1",
          "Aún no está empaquetado",
        );

        expect(res.status).toBe("in_production");
        expect(repo.rollbackStatusV1).toHaveBeenCalledWith(
          "o1",
          "prepared",
          "in_production",
          "Aún no está empaquetado",
          {},
        );
      });

      it("rolls back from in_production to confirmed via atomic RPC", async () => {
        const order = { id: "o1", status: "in_production", tenant_id: "tenant-eatclean" };
        const repo = {
          findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
          rollbackStatusV1: vi.fn(async () => ({ ...order, status: "confirmed" })),
        } as any;
        const ctx = mockCtx();

        const res = await OrderLifecycleService.rollbackStatus(
          ctx,
          repo,
          "o1",
          "Error al iniciar en cocina",
        );

        expect(res.status).toBe("confirmed");
        expect(repo.rollbackStatusV1).toHaveBeenCalledWith(
          "o1",
          "in_production",
          "confirmed",
          "Error al iniciar en cocina",
          {},
        );
      });

      it("rolls back from ready_for_delivery to prepared via atomic RPC", async () => {
        const order = { id: "o1", status: "ready_for_delivery", tenant_id: "tenant-eatclean" };
        const repo = {
          findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
          rollbackStatusV1: vi.fn(async () => ({ ...order, status: "prepared" })),
        } as any;
        const ctx = mockCtx();

        const res = await OrderLifecycleService.rollbackStatus(
          ctx,
          repo,
          "o1",
          "Reabrir empaque para revisión",
        );

        expect(res.status).toBe("prepared");
        expect(repo.rollbackStatusV1).toHaveBeenCalledWith(
          "o1",
          "ready_for_delivery",
          "prepared",
          "Reabrir empaque para revisión",
          {},
        );
      });

      it.each(["draft", "confirmed", "out_for_delivery", "delivered", "cancelled"])(
        "prohibits rollback from irreversible/invalid status %s",
        async (status) => {
          const order = { id: "o1", status, tenant_id: "tenant-eatclean" };
          const repo = {
            findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
            rollbackStatusV1: vi.fn(),
          } as any;
          const ctx = mockCtx();

          await expect(
            OrderLifecycleService.rollbackStatus(ctx, repo, "o1", "Razón cualquiera"),
          ).rejects.toBeInstanceOf(DomainError);
          expect(repo.rollbackStatusV1).not.toHaveBeenCalled();
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
          rollbackStatusV1: vi.fn(),
        } as any;
        const ctx = mockCtx();

        await expect(
          OrderLifecycleService.rollbackStatus(ctx, repo, "o1", "Intento en v2"),
        ).rejects.toBeInstanceOf(DomainError);
        expect(repo.rollbackStatusV1).not.toHaveBeenCalled();
      });

      it("propagates atomic RPC errors as DomainError without partial side effects", async () => {
        const order = { id: "o1", status: "prepared", tenant_id: "tenant-eatclean" };
        const repo = {
          findByIdWithItems: vi.fn(async () => ({ order: order as any, items: [] })),
          rollbackStatusV1: vi.fn(async () => {
            throw new Error("Concurrency conflict: order is in status ready_for_delivery, expected prepared");
          }),
        } as any;
        const ctx = mockCtx();

        await expect(
          OrderLifecycleService.rollbackStatus(ctx, repo, "o1", "Motivo"),
        ).rejects.toThrow("Fallo al ejecutar retroceso atómico: Concurrency conflict");
      });
    });
  });
});

describe("Rollback operator snapshot", () => {
  beforeEach(() => setOperationalRollbackEnabledForTests(true));
  afterEach(() => setOperationalRollbackEnabledForTests(false));
  it.each(["kitchen", "production", "operations_manager"])("allows operational role %s", async (role) => {
    const repo = { findByIdWithItems: vi.fn(async () => ({ order: { status: "prepared", revision: 4 }, items: [] })),
      rollbackStatusV1: vi.fn(async () => ({ status: "in_production" })) } as any;
    await OrderLifecycleService.rollbackStatus(mockCtx({ roles: [role as any] }), repo, "o1", "fix",
      { expectedStatus: "prepared", expectedRevision: 4 });
    expect(repo.rollbackStatusV1).toHaveBeenCalled();
  });
  it.each(["accounting", "customer", "support", "driver"])("rejects role %s", async (role) => {
    const repo = { findByIdWithItems: vi.fn() } as any;
    await expect(OrderLifecycleService.rollbackStatus(mockCtx({ roles: [role as any] }), repo, "o1", "fix")).rejects.toThrow();
    expect(repo.findByIdWithItems).not.toHaveBeenCalled();
  });
  it("rejects a stale operator-confirmed state before invoking RPC", async () => {
    const repo = { findByIdWithItems: vi.fn(async () => ({ order: { status: "in_production" }, items: [] })), rollbackStatusV1: vi.fn() } as any;
    await expect(OrderLifecycleService.rollbackStatus(mockCtx(), repo, "o1", "fix", { expectedStatus: "prepared" })).rejects.toThrow("estado ha cambiado");
    expect(repo.rollbackStatusV1).not.toHaveBeenCalled();
  });
});
