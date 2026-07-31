import {
  getStorageProvider,
  type StorageProvider,
} from "@/platform/storage-provider";
import { createOfflineQueue } from "./queue";
import type { OfflineQueue, OfflineQueueOptions } from "./types";

let testOverride: OfflineQueue | null = null;
let cached: OfflineQueue | null = null;
let cachedStorage: StorageProvider | null = null;

/**
 * Test-only injection. Production code must not call this.
 */
export function setOfflineQueueForTests(value: OfflineQueue | null): void {
  testOverride = value;
  cached = null;
  cachedStorage = null;
}

/** Clears the resolver cache (tests / hot reload). */
export function resetOfflineQueueCache(): void {
  cached = null;
  cachedStorage = null;
}

/**
 * Single entry point for the Offline Queue.
 * Always persists through StorageProvider — never localStorage / Preferences.
 */
export function getOfflineQueue(
  options?: OfflineQueueOptions,
  storage: StorageProvider = getStorageProvider(),
): OfflineQueue {
  if (testOverride) return testOverride;

  if (!cached || cachedStorage !== storage) {
    cached = createOfflineQueue(storage, options);
    cachedStorage = storage;
  }

  return cached;
}
