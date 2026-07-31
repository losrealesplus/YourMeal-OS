import type { OfflineQueueOptions } from "./types";

export const DEFAULT_STORAGE_KEY = "ymos.offline.queue.v1";

export function resolveQueueOptions(options: OfflineQueueOptions = {}) {
  return {
    storageKey: options.storageKey ?? DEFAULT_STORAGE_KEY,
    now: options.now ?? (() => new Date()),
    createId:
      options.createId ??
      (() =>
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `qi_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`),
  };
}
