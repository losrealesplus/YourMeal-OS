import type { OfflineQueueOptions } from "./types";

export const DEFAULT_STORAGE_KEY = "ymos.offline.queue.v1";
export const DEFAULT_MAX_ATTEMPTS = 5;
export const DEFAULT_BASE_BACKOFF_MS = 1_000;
export const DEFAULT_MAX_BACKOFF_MS = 60_000;

export function resolveQueueOptions(options: OfflineQueueOptions = {}) {
  return {
    storageKey: options.storageKey ?? DEFAULT_STORAGE_KEY,
    defaultMaxAttempts: options.defaultMaxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    baseBackoffMs: options.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS,
    maxBackoffMs: options.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS,
    now: options.now ?? (() => new Date()),
    createId:
      options.createId ??
      (() =>
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`),
  };
}

/**
 * Exponential backoff with light jitter: base * 2^(attempts-1) ± 20%, capped.
 */
export function computeBackoffMs(
  attempts: number,
  baseBackoffMs: number,
  maxBackoffMs: number,
  random: () => number = Math.random,
): number {
  const exp = Math.max(0, attempts - 1);
  const raw = baseBackoffMs * 2 ** exp;
  const jitter = 1 + (random() * 0.4 - 0.2);
  return Math.min(maxBackoffMs, Math.round(raw * jitter));
}
