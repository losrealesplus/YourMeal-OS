import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
  },
}));

describe("ensureCustomerForActiveTenant", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("T1: calls ensure_individual_customer with ActiveTenant + auth user", async () => {
    rpc.mockResolvedValue({ data: "cust-new", error: null });
    const { ensureCustomerForActiveTenant } = await import(
      "./CustomerMaterializationService"
    );

    const result = await ensureCustomerForActiveTenant({
      userId: "user-1",
      tenantId: "tenant-a",
      displayName: "Ada",
      email: "ada@example.com",
    });

    expect(result.customerId).toBe("cust-new");
    expect(rpc).toHaveBeenCalledWith("ensure_individual_customer", {
      p_tenant_id: "tenant-a",
      p_user_id: "user-1",
      p_display_name: "Ada",
      p_email: "ada@example.com",
    });
  });

  it("T3/T4: idempotent — same RPC path when customer already exists", async () => {
    rpc.mockResolvedValue({ data: "cust-existing", error: null });
    const { ensureCustomerForActiveTenant } = await import(
      "./CustomerMaterializationService"
    );

    const first = await ensureCustomerForActiveTenant({
      userId: "user-1",
      tenantId: "tenant-a",
    });
    const second = await ensureCustomerForActiveTenant({
      userId: "user-1",
      tenantId: "tenant-a",
    });

    expect(first.customerId).toBe("cust-existing");
    expect(second.customerId).toBe("cust-existing");
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it("T5: tenant_id argument is ActiveTenant only (not invented)", async () => {
    rpc.mockResolvedValue({ data: "cust-a", error: null });
    const { ensureCustomerForActiveTenant } = await import(
      "./CustomerMaterializationService"
    );

    await ensureCustomerForActiveTenant({
      userId: "user-1",
      tenantId: "7823e85a-986f-401f-9bbe-e4e431ff3be1",
    });

    expect(rpc.mock.calls[0][1].p_tenant_id).toBe(
      "7823e85a-986f-401f-9bbe-e4e431ff3be1",
    );
  });

  it("rejects missing ActiveTenant / userId (T6 gate at service boundary)", async () => {
    const { ensureCustomerForActiveTenant } = await import(
      "./CustomerMaterializationService"
    );
    await expect(
      ensureCustomerForActiveTenant({ userId: "u1", tenantId: "" }),
    ).rejects.toThrow(/requires userId and tenantId/);
    expect(rpc).not.toHaveBeenCalled();
  });
});
