import { describe, expect, it, vi } from "vitest";
import type { AppSupabase } from "@/services/types";
import { parseCanonicalOrderWrite } from "../domain/canonical-order-write";
import {
  canonicalWriteError,
  createCanonicalOrderWriteRepository,
} from "./canonical-order-write-repository";

const tenant = "11111111-1111-4111-8111-111111111111";
const request = "22222222-2222-4222-8222-222222222222";
const order = "33333333-3333-4333-8333-333333333333";
const dish = "44444444-4444-4444-8444-444444444444";
const customer = "55555555-5555-4555-8555-555555555555";
const item = "66666666-6666-4666-8666-666666666666";
function command() {
  return parseCanonicalOrderWrite(request, {
    operation: "modify",
    orderId: order,
    expectedRevision: 2,
    weekStart: "2026-10-05",
    lines: [{ kind: "dish", lineId: item, dishId: dish, dayDate: "2026-10-05", qty: 2 }],
  }).command;
}
function result() {
  return {
    order: {
      id: order,
      tenant_id: tenant,
      customer_id: customer,
      write_contract_version: 2,
      revision: 3,
      total: 5,
    },
    items: [
      {
        id: item,
        tenant_id: tenant,
        order_id: order,
        dish_id: dish,
        item_kind: "dish",
        qty: 2,
        unit_price: 2.5,
        name_snapshot: "Snapshot congelado",
        allergen_state: "UNKNOWN",
        allergens_snapshot: [],
      },
    ],
    committedRevision: 3,
    replayed: false,
    inputHash: "a".repeat(64),
  };
}
function repository(data: unknown, error: { message: string } | null = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  const from = vi.fn(() => {
    throw new Error("Separate writes forbidden");
  });
  return {
    rpc,
    from,
    repo: createCanonicalOrderWriteRepository({ rpc, from } as unknown as AppSupabase, tenant),
  };
}

describe("canonical atomic writer repository", () => {
  it("uses exactly one authenticated RPC and preserves server replay identity without catalogue recomputation", async () => {
    const committed = { ...result(), replayed: true };
    const { repo, rpc, from } = repository(committed);
    const input = command();
    const before = structuredClone(input);
    expect(await repo.write(request, input)).toBe(committed);
    expect(rpc).toHaveBeenCalledExactlyOnceWith("cr_order_write_v2", {
      _tenant_id: tenant,
      _request_id: request,
      _command: input,
    });
    expect(from).not.toHaveBeenCalled();
    expect(input).toEqual(before);
    expect(committed.items[0]?.name_snapshot).toBe("Snapshot congelado");
    expect(committed.items[0]?.unit_price).toBe(2.5);
  });
  it.each([
    "IDEMPOTENCY_CONFLICT",
    "STALE_REVISION",
    "TENANT_MISMATCH",
    "CUSTOM_NOT_ENABLED",
    "PRICE_UNAVAILABLE",
    "PRICE_CHANGED",
    "PERMISSION_DENIED",
    "ORDER_CLOSED",
    "COMMERCIAL_QUOTE_REQUIRED",
  ])("sanitizes typed provider error %s", async (code) => {
    const { repo } = repository(null, { message: `${code}: PRIVATE_NOTE bearer SECRET` });
    await expect(repo.write(request, command())).rejects.toMatchObject({ code, message: code });
  });
  it("never exposes unexpected provider response or input payload text", () => {
    expect(canonicalWriteError("Unexpected JSON PRIVATE_NOTE SECRET")).toMatchObject({
      code: "INVALID_STATE",
      message: "Canonical order write rejected",
    });
    expect(canonicalWriteError("prefix STALE_REVISION: SECRET").code).toBe("INVALID_STATE");
  });
  it("sanitizes unexpected client/network promise rejections before returning an application error", async () => {
    const { repo, rpc } = repository(null);
    rpc.mockRejectedValueOnce(new Error("PRIVATE_NOTE bearer SECRET network exception"));
    const error = await repo.write(request, command()).catch((error: unknown) => error);
    expect(error).toMatchObject({
      code: "INVALID_STATE",
      message: "Canonical order write unavailable; retry with the same requestId",
    });
    expect(String(error)).not.toMatch(/PRIVATE_NOTE|bearer|SECRET/);
  });
  it("retains the original committed identity/revision on replay while exposing a newer authenticated order read", async () => {
    const replay = { ...result(), replayed: true, order: { ...result().order, revision: 7 } };
    const { repo, rpc, from } = repository(replay);
    expect(await repo.write(request, command())).toBe(replay);
    expect(replay.committedRevision).toBe(3);
    expect(replay.order.revision).toBe(7);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(from).not.toHaveBeenCalled();
    await expect(
      repository({ ...replay, order: { ...replay.order, revision: 2 } }).repo.write(
        request,
        command(),
      ),
    ).rejects.toMatchObject({ code: "INVALID_STATE" });
  });
  it("rejects duplicate committed item identities instead of certifying a malformed ledger", async () => {
    const good = result();
    await expect(
      repository({ ...good, items: [good.items[0], good.items[0]] }).repo.write(request, command()),
    ).rejects.toMatchObject({ code: "INVALID_STATE" });
  });
  it("rejects invalid/missing UUID response identities, sentinel Dish IDs and zero committed revisions", async () => {
    const good = result();
    for (const payload of [
      {
        ...good,
        order: { ...good.order, id: undefined },
        items: [{ ...good.items[0], order_id: undefined }],
      },
      {
        ...good,
        order: { ...good.order, id: "bad" },
        items: [{ ...good.items[0], order_id: "bad" }],
      },
      { ...good, order: { ...good.order, customer_id: "null" } },
      { ...good, items: [{ ...good.items[0], id: "bad" }] },
      { ...good, items: [{ ...good.items[0], dish_id: "null" }] },
      { ...good, items: [{ ...good.items[0], dish_id: "undefined" }] },
      { ...good, committedRevision: 0, order: { ...good.order, revision: 0 } },
    ])
      await expect(repository(payload).repo.write(request, command())).rejects.toMatchObject({
        code: "INVALID_STATE",
      });
  });
  it("rejects empty/ambiguous responses and cross-tenant or foreign-order rows", async () => {
    const good = result();
    const invalid = [
      null,
      [],
      [good, good],
      {},
      { ...good, order: { ...good.order, tenant_id: "other" } },
      { ...good, items: [{ ...good.items[0], tenant_id: "other" }] },
      { ...good, items: [{ ...good.items[0], order_id: "other" }] },
      { ...good, items: [] },
      { ...good, inputHash: "bad" },
      { ...good, committedRevision: 1.5 },
      { ...good, order: { ...good.order, write_contract_version: 1 } },
      { ...good, items: [{ ...good.items[0], dish_id: null, item_kind: "custom" }] },
    ];
    for (const payload of invalid)
      await expect(repository(payload).repo.write(request, command())).rejects.toMatchObject({
        code: "INVALID_STATE",
      });
  });
  it("rejects a response whose committed order identity/revision differs from the validated modification", async () => {
    const good = result();
    for (const payload of [
      { ...good, order: { ...good.order, revision: 2 } },
      {
        ...good,
        order: { ...good.order, id: "77777777-7777-4777-8777-777777777777" },
        items: [{ ...good.items[0], order_id: "77777777-7777-4777-8777-777777777777" }],
      },
    ]) {
      await expect(repository(payload).repo.write(request, command())).rejects.toMatchObject({
        code: "INVALID_STATE",
      });
    }
  });
});
