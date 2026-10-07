import { describe, expect, it, vi } from "vitest";
import type { AppSupabase } from "@/services/types";
import {
  createLifecycleAttempt,
  executeLifecycleAttempt,
  lifecycleAttemptSchema,
} from "./canonical-lifecycle";

const tenant = "10000000-0000-4000-8000-000000000001";
const order = {
  id: "50000000-0000-4000-8000-000000000001",
  status: "confirmed" as const,
  revision: 3,
};
const actor = "20000000-0000-4000-8000-000000000001";
function committed(attempt: ReturnType<typeof createLifecycleAttempt>) {
  return {
    tenantId: tenant,
    orderId: order.id,
    requestId: attempt.requestId,
    actorId: actor,
    schemaVersion: 1,
    fromState: order.status,
    toState: "cancelled",
    committedRevision: 4,
    outcome: "COMMITTED",
  };
}
describe("A5 structured canonical lifecycle adapter", () => {
  it("retries the same exact attempt; only the canonical RPC is used", async () => {
    const attempt = createLifecycleAttempt(order, "cancel", { reason: "Customer request" });
    const rpc = vi.fn().mockResolvedValue({ data: committed(attempt), error: null });
    const from = vi.fn(() => {
      throw new Error("Direct mutation forbidden");
    });
    const client = { rpc, from } as unknown as AppSupabase;
    expect(await executeLifecycleAttempt(client, tenant, attempt)).toEqual(
      await executeLifecycleAttempt(client, tenant, attempt),
    );
    expect(rpc.mock.calls[0]).toEqual(rpc.mock.calls[1]);
    expect(rpc.mock.calls[0][0]).toBe("cr_order_lifecycle_v2");
    expect(from).not.toHaveBeenCalled();
  });
  it.each(["actorId", "tenantId", "total", "inputHash", "toState"])(
    "rejects untrusted authority field %s",
    (field) => {
      const attempt = createLifecycleAttempt(order, "cancel", { reason: "x" });
      expect(() =>
        lifecycleAttemptSchema.parse({
          ...attempt,
          command: { ...attempt.command, [field]: "untrusted" },
        }),
      ).toThrow();
    },
  );
  it.each([
    "PERMISSION_DENIED",
    "REVISION_CONFLICT",
    "OPERATIONAL_WORK_STARTED",
    "DELIVERY_RESOLUTION_REQUIRED",
  ])("preserves typed boundary error %s without fallback", async (code) => {
    const attempt = createLifecycleAttempt(order, "cancel", { reason: "x" });
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: code } });
    await expect(
      executeLifecycleAttempt({ rpc } as unknown as AppSupabase, tenant, attempt),
    ).rejects.toMatchObject({ code });
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it("unknown network result is uncertain, not a successful cancellation", async () => {
    const attempt = createLifecycleAttempt(order, "cancel", { reason: "x" });
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "upstream failed" } });
    await expect(
      executeLifecycleAttempt({ rpc } as unknown as AppSupabase, tenant, attempt),
    ).rejects.toMatchObject({ code: "LIFECYCLE_RESULT_UNCERTAIN" });
  });
  it.each(["requestId", "actorId", "schemaVersion", "fromState", "committedRevision"])(
    "fails closed when committed identity %s is absent",
    async (field) => {
      const attempt = createLifecycleAttempt(order, "cancel", { reason: "x" });
      const value = committed(attempt) as Record<string, unknown>;
      delete value[field];
      const rpc = vi.fn().mockResolvedValue({ data: value, error: null });
      await expect(
        executeLifecycleAttempt({ rpc } as unknown as AppSupabase, tenant, attempt),
      ).rejects.toThrow();
    },
  );
  it("already-cancelled is an explicit no-op", async () => {
    const attempt = createLifecycleAttempt(order, "cancel", { reason: "x" });
    const rpc = vi.fn().mockResolvedValue({
      data: {
        tenantId: tenant,
        orderId: order.id,
        toState: "cancelled",
        committedRevision: 4,
        outcome: "ALREADY_CANCELLED",
      },
      error: null,
    });
    expect(
      (await executeLifecycleAttempt({ rpc } as unknown as AppSupabase, tenant, attempt)).outcome,
    ).toBe("ALREADY_CANCELLED");
  });
});
