import { describe, expect, it, vi } from "vitest";
import { createOrderRepository } from "./order-repository";

describe("OrderRepository — rollbackStatusV1", () => {
  it("calls rollback_order_status_v1 RPC with exact arguments and returns order", async () => {
    const mockRpc = vi.fn(async (_name: string, _args: Record<string, unknown>) => ({
      data: { id: "order-1", status: "in_production", tenant_id: "tenant-eatclean" },
      error: null,
    }));

    const mockSupabase = {
      rpc: mockRpc,
    } as any;

    const repo = createOrderRepository(mockSupabase, "tenant-eatclean");
    const result = await repo.rollbackStatusV1(
      "order-1",
      "prepared",
      "in_production",
      "Error en empaque",
    );

    expect(mockRpc).toHaveBeenCalledWith("rollback_order_status_v1", {
      p_tenant_id: "tenant-eatclean",
      p_order_id: "order-1",
      p_expected_current_status: "prepared",
      p_target_status: "in_production",
      p_reason: "Error en empaque",
    });

    expect(result).toEqual({
      id: "order-1",
      status: "in_production",
      tenant_id: "tenant-eatclean",
    });
  });

  it("throws database error if RPC fails", async () => {
    const mockRpc = vi.fn(async () => ({
      data: null,
      error: new Error("Concurrency conflict: order is in status ready_for_delivery"),
    }));

    const mockSupabase = {
      rpc: mockRpc,
    } as any;

    const repo = createOrderRepository(mockSupabase, "tenant-eatclean");

    await expect(
      repo.rollbackStatusV1(
        "order-1",
        "prepared",
        "in_production",
        "Error en empaque",
      ),
    ).rejects.toThrow("Concurrency conflict");
  });
});
