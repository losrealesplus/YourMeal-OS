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
      p_expected_revision: null, p_expected_dates: null,
      p_allow_multi_day: false, p_operating_date: null,
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

it("forwards the operator-confirmed revision and full temporal scope", async () => {
  const rpc = vi.fn(async () => ({ data: { status: "confirmed" }, error: null }));
  const repo = createOrderRepository({ rpc } as any, "tenant-1");
  await repo.rollbackStatusV1("order-1", "in_production", "confirmed", "correction", {
    expectedRevision: 8, expectedDeliveryDates: ["2026-10-19", "2026-10-20"],
    allowMultiDay: true, operatingDate: "2026-10-19",
  });
  expect(rpc).toHaveBeenCalledWith("rollback_order_status_v1", expect.objectContaining({
    p_expected_revision: 8, p_expected_dates: ["2026-10-19", "2026-10-20"],
    p_allow_multi_day: true, p_operating_date: "2026-10-19",
  }));
});
