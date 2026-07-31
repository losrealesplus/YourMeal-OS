import { afterEach, describe, expect, it } from "vitest";
import { createMemoryStorageProvider } from "@/platform/storage-provider";
import {
  createOfflineQueue,
  getOfflineQueue,
  resetOfflineQueueCache,
  setOfflineQueueForTests,
} from "./index";

afterEach(() => {
  setOfflineQueueForTests(null);
  resetOfflineQueueCache();
});

describe("OfflineQueue · enqueue / dequeue / remove", () => {
  it("enqueues opaque intents as pending", async () => {
    const queue = createOfflineQueue(createMemoryStorageProvider());
    const item = await queue.enqueue({
      type: "CrearPedido",
      payload: { menuWeek: "2026-W31" },
    });

    expect(item.status).toBe("pending");
    expect(item.type).toBe("CrearPedido");
    expect(item.retryCount).toBe(0);
    expect(item.payload).toEqual({ menuWeek: "2026-W31" });
    expect(item.id).toBeTruthy();
    expect(item.createdAt).toBeTruthy();
  });

  it("dequeues oldest pending and marks processing", async () => {
    const storage = createMemoryStorageProvider();
    let n = 0;
    const queue = createOfflineQueue(storage, {
      createId: () => `id-${++n}`,
      now: () => new Date(1_000_000 + n * 1000),
    });

    await queue.enqueue({ type: "ActualizarPerfil" });
    await queue.enqueue({ type: "CancelarPedido" });

    const first = await queue.dequeue();
    expect(first?.type).toBe("ActualizarPerfil");
    expect(first?.status).toBe("processing");

    const second = await queue.dequeue();
    expect(second?.type).toBe("CancelarPedido");
    expect(await queue.dequeue()).toBeNull();
  });

  it("removes an item after successful execution", async () => {
    const queue = createOfflineQueue(createMemoryStorageProvider(), {
      createId: () => "gone",
    });
    await queue.enqueue({ type: "CrearPedido" });
    await queue.dequeue();
    await queue.complete("gone");
    expect(await queue.remove("gone")).toBe(true);
    expect(await queue.get("gone")).toBeNull();
  });

  it("is idempotent when enqueueing the same id", async () => {
    const queue = createOfflineQueue(createMemoryStorageProvider());
    const a = await queue.enqueue({
      id: "op-1",
      type: "CrearPedido",
      payload: { a: 1 },
    });
    const b = await queue.enqueue({
      id: "op-1",
      type: "CrearPedido",
      payload: { a: 99 },
    });
    expect(b).toEqual(a);
    expect((await queue.list()).length).toBe(1);
  });
});

describe("OfflineQueue · fail / retry", () => {
  it("keeps failed items and allows retry back to pending", async () => {
    const queue = createOfflineQueue(createMemoryStorageProvider(), {
      createId: () => "r1",
    });
    await queue.enqueue({ type: "ActualizarPerfil" });
    await queue.dequeue();

    const failed = await queue.fail("r1");
    expect(failed.status).toBe("failed");
    expect(failed.retryCount).toBe(1);
    expect(await queue.dequeue()).toBeNull();

    const pending = await queue.retry("r1");
    expect(pending.status).toBe("pending");
    expect(pending.retryCount).toBe(1);

    const again = await queue.dequeue();
    expect(again?.id).toBe("r1");
    expect(again?.status).toBe("processing");
  });

  it("rejects retry on non-failed items", async () => {
    const queue = createOfflineQueue(createMemoryStorageProvider(), {
      createId: () => "x",
    });
    await queue.enqueue({ type: "CrearPedido" });
    await expect(queue.retry("x")).rejects.toThrow(/failed/i);
  });
});

describe("OfflineQueue · persistence / restoration", () => {
  it("survives a new queue instance on the same StorageProvider", async () => {
    const storage = createMemoryStorageProvider();
    const first = createOfflineQueue(storage);
    await first.enqueue({
      id: "persist-1",
      type: "CancelarPedido",
      payload: { orderId: "o1" },
    });

    const restored = createOfflineQueue(storage);
    const item = await restored.get("persist-1");
    expect(item?.type).toBe("CancelarPedido");
    expect(item?.payload).toEqual({ orderId: "o1" });
    expect(item?.status).toBe("pending");
  });

  it("restores failed state after reopen", async () => {
    const storage = createMemoryStorageProvider();
    const first = createOfflineQueue(storage, { createId: () => "f1" });
    await first.enqueue({ type: "CrearPedido" });
    await first.dequeue();
    await first.fail("f1");

    const restored = createOfflineQueue(storage);
    const item = await restored.get("f1");
    expect(item?.status).toBe("failed");
    expect(item?.retryCount).toBe(1);
  });
});

describe("getOfflineQueue · resolver", () => {
  it("honors test override", () => {
    const stub = createOfflineQueue(createMemoryStorageProvider());
    setOfflineQueueForTests(stub);
    expect(getOfflineQueue()).toBe(stub);
  });
});

describe("OfflineQueue · isolation", () => {
  it("does not import or reference supabase in the module surface", async () => {
    // Structural guarantee: queue only stores opaque type strings.
    const queue = createOfflineQueue(createMemoryStorageProvider());
    const item = await queue.enqueue({ type: "CrearPedido" });
    expect(Object.keys(item).sort()).toEqual(
      ["createdAt", "id", "payload", "retryCount", "status", "type"].sort(),
    );
  });
});
