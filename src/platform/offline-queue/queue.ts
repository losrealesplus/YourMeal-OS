import type { StorageProvider } from "@/platform/storage-provider";
import { resolveQueueOptions } from "./options";
import type {
  EnqueueInput,
  OfflineQueue,
  OfflineQueueListFilter,
  OfflineQueueOptions,
  QueueItem,
  QueueItemStatus,
} from "./types";

type PersistedShape = {
  version: 1;
  items: QueueItem[];
};

function asStatusList(
  status: QueueItemStatus | QueueItemStatus[] | undefined,
): QueueItemStatus[] | null {
  if (!status) return null;
  return Array.isArray(status) ? status : [status];
}

function byCreatedAt(a: QueueItem, b: QueueItem): number {
  return a.createdAt.localeCompare(b.createdAt);
}

/**
 * StorageProvider-backed OfflineQueue (beta).
 * No network, no Supabase, no business rules — intents only.
 */
export function createOfflineQueue(
  storage: StorageProvider,
  options: OfflineQueueOptions = {},
): OfflineQueue {
  const opts = resolveQueueOptions(options);

  async function load(): Promise<QueueItem[]> {
    const raw = await storage.get(opts.storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as PersistedShape;
      if (parsed?.version !== 1 || !Array.isArray(parsed.items)) return [];
      return parsed.items;
    } catch {
      return [];
    }
  }

  async function save(items: QueueItem[]): Promise<void> {
    const body: PersistedShape = { version: 1, items };
    await storage.set(opts.storageKey, JSON.stringify(body));
  }

  async function update(
    id: string,
    mutator: (item: QueueItem) => QueueItem,
  ): Promise<QueueItem> {
    const items = await load();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error(`OfflineQueue: item not found: ${id}`);
    }
    const next = mutator(items[index]!);
    items[index] = next;
    await save(items);
    return next;
  }

  const queue: OfflineQueue = {
    async enqueue(input: EnqueueInput): Promise<QueueItem> {
      if (!input.type?.trim()) {
        throw new Error("OfflineQueue: type is required");
      }

      const items = await load();
      const id = input.id?.trim() || opts.createId();
      const existing = items.find((item) => item.id === id);
      if (existing) return existing;

      const item: QueueItem = {
        id,
        type: input.type.trim(),
        payload: input.payload ?? {},
        createdAt: opts.now().toISOString(),
        status: "pending",
        retryCount: 0,
      };

      items.push(item);
      await save(items);
      return item;
    },

    async get(id) {
      const items = await load();
      return items.find((item) => item.id === id) ?? null;
    },

    async list(filter: OfflineQueueListFilter = {}) {
      const items = await load();
      const statuses = asStatusList(filter.status);
      return items
        .filter((item) => !statuses || statuses.includes(item.status))
        .slice()
        .sort(byCreatedAt);
    },

    async dequeue() {
      const items = await load();
      const next = items
        .filter((item) => item.status === "pending")
        .sort(byCreatedAt)[0];
      if (!next) return null;

      return update(next.id, (item) => ({
        ...item,
        status: "processing",
      }));
    },

    async complete(id) {
      return update(id, (item) => {
        if (item.status !== "processing" && item.status !== "pending") {
          throw new Error(
            `OfflineQueue: cannot complete item in status ${item.status}`,
          );
        }
        return { ...item, status: "completed" };
      });
    },

    async fail(id) {
      return update(id, (item) => {
        if (item.status !== "processing" && item.status !== "pending") {
          throw new Error(
            `OfflineQueue: cannot fail item in status ${item.status}`,
          );
        }
        return {
          ...item,
          status: "failed",
          retryCount: item.retryCount + 1,
        };
      });
    },

    async retry(id) {
      return update(id, (item) => {
        if (item.status !== "failed") {
          throw new Error(
            `OfflineQueue: can only retry failed items (got ${item.status})`,
          );
        }
        return { ...item, status: "pending" };
      });
    },

    async remove(id) {
      const items = await load();
      const next = items.filter((item) => item.id !== id);
      if (next.length === items.length) return false;
      await save(next);
      return true;
    },
  };

  return queue;
}
