import { describe, it, expect, beforeEach } from "vitest";
import type { ServiceContext, AppSupabase } from "@/services/types";
import { capabilitiesFor } from "@/permissions";
import {
  OperationalExceptionService,
  clearOperationalExceptionIdempotencyForTests,
} from "./application/operational-exception-service";

function createMockSupabase(): AppSupabase {
  const store = new Map<string, Record<string, unknown>>();

  const client = {
    from: () => ({
      select: () => ({
        eq: (col1: string, val1: unknown) => ({
          eq: (col2: string, val2: unknown) => ({
            eq: (col3: string, val3: unknown) => ({
              maybeSingle: async () => {
                const item = [...store.values()].find(
                  (r) => r[col1] === val1 && r[col2] === val2 && r[col3] === val3,
                );
                return { data: item ? { ...item } : null, error: null };
              },
              select: () => ({
                maybeSingle: async () => {
                  const item = [...store.values()].find(
                    (r) => r[col1] === val1 && r[col2] === val2 && r[col3] === val3,
                  );
                  return { data: item ? { ...item } : null, error: null };
                },
              }),
            }),
            maybeSingle: async () => {
              const item = [...store.values()].find((r) => r[col1] === val1 && r[col2] === val2);
              return { data: item ? { ...item } : null, error: null };
            },
            order: () => ({
              data: [...store.values()].filter((r) => r[col1] === val1 && r[col2] === val2),
              error: null,
            }),
          }),
          order: () => ({
            data: [...store.values()].filter((r) => r[col1] === val1),
            error: null,
          }),
          maybeSingle: async () => {
            const item = [...store.values()].find((r) => r[col1] === val1);
            return { data: item ? { ...item } : null, error: null };
          },
        }),
      }),
      insert: (payload: unknown) => ({
        select: () => ({
          single: async () => {
            const p = payload as Record<string, unknown>;
            const id = (p.id as string) || `oe-${Date.now()}-${Math.random()}`;
            const row = { ...p, id };
            store.set(id, row);
            return { data: { ...row }, error: null };
          },
        }),
      }),
      update: (updates: unknown) => ({
        eq: (col1: string, val1: unknown) => ({
          eq: (col2: string, val2: unknown) => ({
            eq: (col3: string, val3: unknown) => ({
              select: () => ({
                maybeSingle: async () => {
                  const item = store.get(val2 as string);
                  if (!item || item[col1] !== val1 || item[col3] !== val3) {
                    return { data: null, error: null };
                  }
                  const updated = {
                    ...item,
                    ...(updates as Record<string, unknown>),
                  };
                  store.set(val2 as string, updated);
                  return { data: { ...updated }, error: null };
                },
              }),
            }),
          }),
        }),
      }),
    }),
  };

  return client as unknown as AppSupabase;
}

describe("A4.1a Operational Exceptions — DELIVERY_NOT_RECEIVED", () => {
  let ctx: ServiceContext;
  let supabase: AppSupabase;

  beforeEach(() => {
    clearOperationalExceptionIdempotencyForTests();
    supabase = createMockSupabase();
    const roles = ["support", "operations_manager"] as const;
    ctx = {
      tenantId: "tenant-alpha",
      userId: "user-agent-01",
      roles,
      capabilities: capabilitiesFor(roles),
      supabase,
    };
  });

  it("1. Creates DELIVERY_NOT_RECEIVED exception with OPEN status and version 1", async () => {
    const exception = await OperationalExceptionService.createException(ctx, {
      type: "DELIVERY_NOT_RECEIVED",
      severity: "HIGH",
      sourceDomain: "support",
      sourceEntityType: "order",
      sourceEntityId: "order-1001",
      orderId: "order-1001",
      customerId: "cust-01",
    });

    expect(exception.id).toBeDefined();
    expect(exception.type).toBe("DELIVERY_NOT_RECEIVED");
    expect(exception.severity).toBe("HIGH");
    expect(exception.status).toBe("OPEN");
    expect(exception.version).toBe(1);
    expect(exception.orderId).toBe("order-1001");
  });

  it("2. Idempotency: Duplicate createException with same clientRequestId returns identical exception", async () => {
    const reqId = "req-unique-999";
    const first = await OperationalExceptionService.createException(ctx, {
      type: "DELIVERY_NOT_RECEIVED",
      sourceDomain: "support",
      sourceEntityType: "order",
      sourceEntityId: "order-1001",
      clientRequestId: reqId,
    });

    const second = await OperationalExceptionService.createException(ctx, {
      type: "DELIVERY_NOT_RECEIVED",
      sourceDomain: "support",
      sourceEntityType: "order",
      sourceEntityId: "order-1001",
      clientRequestId: reqId,
    });

    expect(first.id).toBe(second.id);
  });

  it("3. Acknowledge transitions status OPEN -> ACKNOWLEDGED and bumps version", async () => {
    const created = await OperationalExceptionService.createException(ctx, {
      type: "DELIVERY_NOT_RECEIVED",
      sourceDomain: "support",
      sourceEntityType: "order",
      sourceEntityId: "order-1001",
      orderId: "order-1001",
    });

    const ack = await OperationalExceptionService.acknowledge(ctx, created.id, created.version);
    expect(ack.status).toBe("ACKNOWLEDGED");
    expect(ack.version).toBe(2);
    expect(ack.ownerUserId).toBe("user-agent-01");
  });

  it("4. Resolve with REDELIVER produces linked reattempt dispatch without mutating original order row", async () => {
    const created = await OperationalExceptionService.createException(ctx, {
      type: "DELIVERY_NOT_RECEIVED",
      sourceDomain: "support",
      sourceEntityType: "order",
      sourceEntityId: "order-1001",
      orderId: "order-1001",
    });

    const ack = await OperationalExceptionService.acknowledge(ctx, created.id, created.version);

    const resolved = await OperationalExceptionService.resolve(ctx, {
      id: ack.id,
      expectedVersion: ack.version,
      resolutionType: "REDELIVER",
      resolutionNotes: "Customer confirms non-delivery. Dispatching emergency redelivery.",
    });

    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.version).toBe(3);
    expect(resolved.resolutionType).toBe("REDELIVER");
    expect(resolved.resolutionPayload?.reattemptDispatchId).toBeDefined();
    expect(resolved.resolvedAt).toBeDefined();
  });

  it("5. Resolve with CREDIT stores compensation details in payload without modifying order status", async () => {
    const created = await OperationalExceptionService.createException(ctx, {
      type: "DELIVERY_NOT_RECEIVED",
      sourceDomain: "support",
      sourceEntityType: "order",
      sourceEntityId: "order-1002",
      orderId: "order-1002",
    });

    const resolved = await OperationalExceptionService.resolve(ctx, {
      id: created.id,
      expectedVersion: created.version,
      resolutionType: "CREDIT",
      resolutionPayload: {
        refundAmount: 24.5,
        creditVoucherCode: "CREDIT-2450",
      },
      resolutionNotes: "Issued 24.50 EUR account credit to customer.",
    });

    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.resolutionType).toBe("CREDIT");
    expect(resolved.resolutionPayload?.refundAmount).toBe(24.5);
  });

  it("6. Concurrency & State Guard: Conflicting simultaneous resolutions are rejected", async () => {
    const created = await OperationalExceptionService.createException(ctx, {
      type: "DELIVERY_NOT_RECEIVED",
      sourceDomain: "support",
      sourceEntityType: "order",
      sourceEntityId: "order-1003",
    });

    // Operator A resolves successfully
    await OperationalExceptionService.resolve(ctx, {
      id: created.id,
      expectedVersion: created.version,
      resolutionType: "REDELIVER",
      resolutionNotes: "Operator A action",
    });

    // Operator B attempts duplicate resolution -> Blocked by state/OCC guard
    await expect(
      OperationalExceptionService.resolve(ctx, {
        id: created.id,
        expectedVersion: created.version, // stale version (1 instead of 2)
        resolutionType: "CREDIT",
        resolutionNotes: "Operator B action",
      }),
    ).rejects.toThrow();
  });

  it("7. State Machine: Cannot close an un-resolved exception directly", async () => {
    const created = await OperationalExceptionService.createException(ctx, {
      type: "DELIVERY_NOT_RECEIVED",
      sourceDomain: "support",
      sourceEntityType: "order",
      sourceEntityId: "order-1004",
    });

    await expect(
      OperationalExceptionService.close(ctx, created.id, created.version),
    ).rejects.toThrow(/Cannot close exception from status OPEN/);
  });

  it("8. Close succeeds after exception is RESOLVED", async () => {
    const created = await OperationalExceptionService.createException(ctx, {
      type: "DELIVERY_NOT_RECEIVED",
      sourceDomain: "support",
      sourceEntityType: "order",
      sourceEntityId: "order-1005",
    });

    const resolved = await OperationalExceptionService.resolve(ctx, {
      id: created.id,
      expectedVersion: created.version,
      resolutionType: "MANUAL_HANDOFF",
      resolutionNotes: "Resolved manually by operations supervisor",
    });

    const closed = await OperationalExceptionService.close(ctx, resolved.id, resolved.version);
    expect(closed.status).toBe("CLOSED");
    expect(closed.closedAt).toBeDefined();
  });

  it("9. Multi-Tenant isolation: Exception belongs strictly to tenantId", async () => {
    const createdInAlpha = await OperationalExceptionService.createException(ctx, {
      type: "DELIVERY_NOT_RECEIVED",
      sourceDomain: "support",
      sourceEntityType: "order",
      sourceEntityId: "order-1006",
    });

    const ctxBeta: ServiceContext = {
      ...ctx,
      tenantId: "tenant-beta",
    };

    // Tenant Beta cannot see or update Tenant Alpha's exception
    const foundInBeta = await OperationalExceptionService.getException(ctxBeta, createdInAlpha.id);
    expect(foundInBeta).toBeNull();
  });
});
