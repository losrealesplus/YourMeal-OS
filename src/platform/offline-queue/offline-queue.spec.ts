import { afterEach, describe, expect, it } from "vitest";
import { createMemoryStorageProvider } from "@/platform/storage-provider";
import {
  computeBackoffMs,
  createOfflineQueue,
  getOfflineQueue,
  OFFLINE_FEATURE_FLAGS,
  resetOfflineQueueCache,
  setOfflineQueueForTests,
} from "./index";

afterEach(() => {
  setOfflineQueueForTests(null);
  resetOfflineQueueCache();
});

function queueWithClock(nowMs: { value: number }) {
  const storage = createMemoryStorageProvider();
  return createOfflineQueue(storage, {
    now: () => new Date(nowMs.value),
    createId: () => `id_${nowMs.value}`,
    baseBackoffMs: 1_000,
    maxBackoffMs: 10_000,
    defaultMaxAttempts: 3,
  });
}

describe("computeBackoffMs", () => {
  it("grows exponentially and respects cap", () => {
    const fixed = () => 0.5; // no jitter offset
    expect(computeBackoffMs(1, 1000, 60_000, fixed)).toBe(1000);
    expect(computeBackoffMs(2, 1000, 60_000, fixed)).toBe(2000);
    expect(computeBackoffMs(3, 1000, 60_000, fixed)).toBe(4000);
    expect(computeBackoffMs(10, 1000, 5_000, fixed)).toBe(5000);
  });
});

describe("OfflineQueue · lifecycle", () => {
  it("enqueues, dequeues, completes", async () => {
    const nowMs = { value: Date.parse("2026-07-31T10:00:00.000Z") };
    const queue = queueWithClock(nowMs);

    const created = await queue.enqueue({
      type: "kitchen.mark_prepared",
      payload: { batchId: "b1" },
      priority: 10,
    });
    expect(created.status).toBe("pending");
    expect(created.type).toBe("kitchen.mark_prepared");

    const claimed = await queue.dequeue();
    expect(claimed?.id).toBe(created.id);
    expect(claimed?.status).toBe("processing");
    expect(claimed?.attempts).toBe(1);

    const done = await queue.markCompleted(created.id);
    expect(done.status).toBe("completed");
    expect(await queue.dequeue()).toBeNull();
    expect(await queue.stats()).toMatchObject({
      completed: 1,
      pending: 0,
      total: 1,
    });
  });

  it("is idempotent on enqueue with same id", async () => {
    const storage = createMemoryStorageProvider();
    const queue = createOfflineQueue(storage);
    const a = await queue.enqueue({
      id: "cmd-1",
      type: "delivery.complete",
      payload: { stop: 1 },
    });
    const b = await queue.enqueue({
      id: "cmd-1",
      type: "delivery.complete",
      payload: { stop: 99 },
    });
    expect(b).toEqual(a);
    expect((await queue.list()).length).toBe(1);
  });

  it("orders by priority then createdAt", async () => {
    const storage = createMemoryStorageProvider();
    let n = 0;
    const queue = createOfflineQueue(storage, {
      createId: () => `c${++n}`,
      now: () => new Date(1_000_000 + n * 1000),
    });

    await queue.enqueue({ type: "low", priority: 1 });
    await queue.enqueue({ type: "high", priority: 50 });
    await queue.enqueue({ type: "mid", priority: 10 });

    const first = await queue.dequeue();
    expect(first?.type).toBe("high");
    const second = await queue.dequeue();
    expect(second?.type).toBe("mid");
  });

  it("schedules retry with backoff then becomes claimable", async () => {
    const nowMs = { value: Date.parse("2026-07-31T10:00:00.000Z") };
    const queue = queueWithClock(nowMs);

    const cmd = await queue.enqueue({
      id: "retry-1",
      type: "ops.adjust",
      maxAttempts: 3,
    });
    await queue.markProcessing(cmd.id);
    const failed = await queue.markFailed(cmd.id, "network");
    expect(failed.status).toBe("failed");
    expect(failed.attempts).toBe(1);
    expect(failed.nextAttemptAt).not.toBeNull();
    expect(failed.lastError).toBe("network");

    // Still in backoff window.
    expect(await queue.dequeue()).toBeNull();

    nowMs.value = Date.parse(failed.nextAttemptAt!) + 1;
    const again = await queue.dequeue();
    expect(again?.id).toBe(cmd.id);
    expect(again?.status).toBe("processing");
    expect(again?.attempts).toBe(2);
  });

  it("moves to dead when max attempts exhausted", async () => {
    const storage = createMemoryStorageProvider();
    const queue = createOfflineQueue(storage, {
      defaultMaxAttempts: 2,
      baseBackoffMs: 1,
      createId: () => "dead-1",
    });

    await queue.enqueue({ type: "x" });
    await queue.markProcessing("dead-1");
    await queue.markFailed("dead-1", "e1");
    await queue.retryNow("dead-1");
    await queue.markProcessing("dead-1");
    const dead = await queue.markFailed("dead-1", "e2");
    expect(dead.status).toBe("dead");
    expect(dead.attempts).toBe(2);
    expect(await queue.dequeue()).toBeNull();
  });

  it("persists across queue instances sharing StorageProvider", async () => {
    const storage = createMemoryStorageProvider();
    const a = createOfflineQueue(storage);
    await a.enqueue({ id: "p1", type: "persist.me" });

    const b = createOfflineQueue(storage);
    const found = await b.get("p1");
    expect(found?.type).toBe("persist.me");
  });

  it("clearCompleted removes only completed rows", async () => {
    const storage = createMemoryStorageProvider();
    const queue = createOfflineQueue(storage, {
      createId: () => "only",
    });
    await queue.enqueue({ type: "t" });
    await queue.markProcessing("only");
    await queue.markCompleted("only");
    await queue.enqueue({ id: "keep", type: "t2" });
    expect(await queue.clearCompleted()).toBe(1);
    expect(await queue.get("only")).toBeNull();
    expect(await queue.get("keep")).not.toBeNull();
  });

  it("rejects empty type", async () => {
    const queue = createOfflineQueue(createMemoryStorageProvider());
    await expect(queue.enqueue({ type: "  " })).rejects.toThrow(/type/i);
  });
});

describe("getOfflineQueue · resolver", () => {
  it("honors test override", async () => {
    const stub = createOfflineQueue(createMemoryStorageProvider());
    setOfflineQueueForTests(stub);
    expect(getOfflineQueue()).toBe(stub);
  });
});

describe("OFFLINE_FEATURE_FLAGS", () => {
  it("exposes stable flag names for remote config", () => {
    expect(OFFLINE_FEATURE_FLAGS.queueEnabled).toBe("offline.queue.enabled");
    expect(OFFLINE_FEATURE_FLAGS.maxAttempts).toBe("offline.queue.maxAttempts");
    expect(OFFLINE_FEATURE_FLAGS.syncDrainEnabled).toBe(
      "offline.sync.drainEnabled",
    );
  });
});
