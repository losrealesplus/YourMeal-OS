import { describe, expect, it, vi } from "vitest";
import type { ServiceContext } from "@/services/types";
import { CanonicalOrderWriteService } from "./canonical-order-write-service";
import type { CanonicalCaptureInput, CanonicalModifyInput } from "../domain/canonical-order-write";

const tenant = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";
const orderId = "33333333-3333-4333-8333-333333333333";
const dishId = "44444444-4444-4444-8444-444444444444";
const customerId = "55555555-5555-4555-8555-555555555555";
const itemId = "66666666-6666-4666-8666-666666666666";
const capture = (): CanonicalCaptureInput => ({
  requestId,
  weekStart: "2026-10-05",
  customer: { kind: "existing", id: customerId },
  lines: [{ kind: "dish", dishId, dayDate: "2026-10-05", qty: 2 }],
});
const modify = (): CanonicalModifyInput => ({
  requestId,
  orderId,
  expectedRevision: 0,
  weekStart: "2026-10-05",
  lines: [{ kind: "dish", lineId: itemId, dishId, dayDate: "2026-10-05", qty: 2 }],
});
function committed() {
  return {
    order: {
      id: orderId,
      customer_id: customerId,
      tenant_id: tenant,
      write_contract_version: 2,
      revision: 1,
      total: 5,
    },
    items: [
      {
        id: itemId,
        tenant_id: tenant,
        order_id: orderId,
        dish_id: dishId,
        item_kind: "dish",
        name_snapshot: "Nombre congelado",
        unit_price: 2.5,
        qty: 2,
        day_date: "2026-10-05",
        allergen_state: "UNKNOWN",
        allergens_snapshot: [],
      },
    ],
    committedRevision: 1,
    replayed: false,
    inputHash: "b".repeat(64),
  };
}
function context(result: unknown = committed()) {
  const rpc = vi.fn().mockResolvedValue({ data: result, error: null });
  const from = vi.fn(() => {
    throw new Error("Unexpected separate customer/order/audit write or catalogue read");
  });
  const ctx: ServiceContext = {
    supabase: { rpc, from } as unknown as ServiceContext["supabase"],
    userId: "77777777-7777-4777-8777-777777777777",
    tenantId: tenant,
    roles: ["company_admin"],
    capabilities: new Set(["orders.write"]),
  };
  return { ctx, rpc, from };
}

describe("canonical order authenticated application boundary", () => {
  it("rejects missing/blank/malformed override reasons before RPC for capture and modify", async () => {
    for (const [operation, base] of [
      ["capture", capture()],
      ["modify", modify()],
    ] as const) {
      for (const unitPriceOverrideReason of [undefined, "", "   ", 1, null, "x".repeat(2001)]) {
        const input = {
          ...base,
          lines: [
            {
              ...base.lines[0],
              unitPriceOverride: "0.00",
              explicitZeroConfirmed: true,
              unitPriceOverrideReason,
            },
          ],
        };
        const { ctx, rpc, from } = context();
        const promise =
          operation === "capture"
            ? CanonicalOrderWriteService.capture(ctx, input as CanonicalCaptureInput)
            : CanonicalOrderWriteService.modify(ctx, input as CanonicalModifyInput);
        await expect(promise).rejects.toMatchObject({ code: "INVALID_STATE" });
        expect(rpc).not.toHaveBeenCalled();
        expect(from).not.toHaveBeenCalled();
      }
    }
  });
  it("sends the validated override reason to the same sole transactional RPC", async () => {
    const { ctx, rpc, from } = context();
    const input: CanonicalCaptureInput = {
      ...capture(),
      lines: [
        {
          ...capture().lines[0]!,
          unitPriceOverride: "2.50",
          unitPriceOverrideReason: "  Acuerdo comercial  ",
        },
      ],
    };
    await CanonicalOrderWriteService.capture(ctx, input);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0]?.[1]._command.lines[0]).toMatchObject({
      unitPriceOverride: "2.50",
      unitPriceOverrideReason: "Acuerdo comercial",
    });
    expect(from).not.toHaveBeenCalled();
    expect(input.lines[0]?.unitPriceOverrideReason).toBe("  Acuerdo comercial  ");
  });
  it("rejects every canonical B2B capture/modify context before RPC or separate writes", async () => {
    for (const [operation, base] of [
      ["capture", capture()],
      ["modify", modify()],
    ] as const) {
      for (const contextFields of [
        { demandChannel: "company" },
        ...["companyId", "siteId", "organizationalUnitId", "deliveryGroupId"].map((key) => ({
          [key]: customerId,
        })),
      ]) {
        const { ctx, rpc, from } = context();
        const action =
          operation === "capture"
            ? CanonicalOrderWriteService.capture(ctx, {
                ...base,
                ...contextFields,
              } as CanonicalCaptureInput)
            : CanonicalOrderWriteService.modify(ctx, {
                ...base,
                ...contextFields,
              } as CanonicalModifyInput);
        await expect(action).rejects.toMatchObject({ code: "INVALID_STATE" });
        expect(rpc).not.toHaveBeenCalled();
        expect(from).not.toHaveBeenCalled();
      }
    }
  });
  it("captures existing/new customers with one RPC only and preserves caller input", async () => {
    for (const input of [
      capture(),
      {
        ...capture(),
        customer: {
          kind: "new" as const,
          displayName: "Cliente",
          phone: "600123456",
          dietaryProfile: { allergens: ["gluten"] },
        },
      },
    ]) {
      const { ctx, rpc, from } = context();
      const before = structuredClone(input);
      const result = await CanonicalOrderWriteService.capture(ctx, input);
      expect(result.order.id).toBe(orderId);
      expect(rpc).toHaveBeenCalledTimes(1);
      expect(rpc.mock.calls[0]?.[1]).toEqual({
        _tenant_id: tenant,
        _request_id: requestId,
        _command: { ...input, requestId: undefined, operation: "capture" },
      });
      expect(from).not.toHaveBeenCalled();
      expect(input).toEqual(before);
    }
  });
  it("modifies with expected revision in the same sole RPC", async () => {
    const { ctx, rpc, from } = context();
    const input = modify();
    const before = structuredClone(input);
    expect((await CanonicalOrderWriteService.modify(ctx, input)).committedRevision).toBe(1);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0]?.[1]._command).toMatchObject({
      operation: "modify",
      orderId,
      expectedRevision: 0,
    });
    expect(from).not.toHaveBeenCalled();
    expect(input).toEqual(before);
  });
  it("replay returns the exact committed record without reading current catalogue", async () => {
    const row = { ...committed(), replayed: true };
    const { ctx, rpc, from } = context(row);
    const input = capture();
    expect(await CanonicalOrderWriteService.capture(ctx, input)).toBe(row);
    expect(await CanonicalOrderWriteService.capture(ctx, input)).toBe(row);
    expect(row.items[0]?.name_snapshot).toBe("Nombre congelado");
    expect(row.items[0]?.unit_price).toBe(2.5);
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(from).not.toHaveBeenCalled();
  });
  it("rejects denied callers before making an RPC", async () => {
    const { ctx, rpc } = context();
    await expect(
      CanonicalOrderWriteService.capture({ ...ctx, roles: [], capabilities: new Set() }, capture()),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects forged modification operation, revision and custom payload before the RPC", async () => {
    const base = modify();
    for (const input of [
      { ...base, operation: "capture" },
      { ...base, expectedRevision: -1 },
      { ...base, lines: [base.lines[0], base.lines[0]] },
      { ...base, lines: [{ ...base.lines[0], kind: "custom", dishId: null }] },
      { ...base, lines: [{ ...base.lines[0], unit_price: 2.5 }] },
    ]) {
      const { ctx, rpc, from } = context();
      await expect(
        CanonicalOrderWriteService.modify(ctx, input as CanonicalModifyInput),
      ).rejects.toMatchObject({ code: "INVALID_STATE" });
      expect(rpc).not.toHaveBeenCalled();
      expect(from).not.toHaveBeenCalled();
    }
  });
  it("rejects custom, forged authority, operation and zero-without-confirmation before any write", async () => {
    const base = capture();
    const invalid = [
      null,
      [],
      { ...base, operation: "modify" },
      { ...base, total: 100 },
      { ...base, authorId: "PRIVATE" },
      { ...base, tenantId: "other" },
      { ...base, requestId: "bad" },
      { ...base, lines: [{ ...base.lines[0], kind: "custom", dishId: null, name: "Sopa" }] },
      { ...base, lines: [{ ...base.lines[0], name_snapshot: "PRIVATE" }] },
      ...["0", "0.0", "0.00", "0.0000"].map((unitPriceOverride) => ({
        ...base,
        lines: [
          {
            ...base.lines[0],
            unitPriceOverride,
            unitPriceOverrideReason: "Ajuste comercial autorizado",
          },
        ],
      })),
    ];
    for (const input of invalid) {
      const { ctx, rpc, from } = context();
      await expect(
        CanonicalOrderWriteService.capture(ctx, input as CanonicalCaptureInput),
      ).rejects.toMatchObject({ code: "INVALID_STATE" });
      expect(rpc).not.toHaveBeenCalled();
      expect(from).not.toHaveBeenCalled();
    }
  });
  it("sanitizes typed request/revision failures and rejects cross-tenant success", async () => {
    for (const code of ["IDEMPOTENCY_CONFLICT", "STALE_REVISION"]) {
      const { ctx, rpc } = context();
      rpc.mockResolvedValueOnce({ data: null, error: { message: `${code}: PRIVATE INPUT` } });
      await expect(CanonicalOrderWriteService.modify(ctx, modify())).rejects.toMatchObject({
        code,
        message: code,
      });
    }
    const row = committed();
    await expect(
      CanonicalOrderWriteService.capture(
        context({ ...row, order: { ...row.order, tenant_id: "foreign" } }).ctx,
        capture(),
      ),
    ).rejects.toMatchObject({ code: "INVALID_STATE" });
  });
});
