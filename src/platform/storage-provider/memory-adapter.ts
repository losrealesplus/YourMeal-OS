import type { StorageProvider } from "./contract";

/**
 * In-memory adapter — SSR, private mode fallbacks, and unit tests.
 * Data does not survive process restart.
 */
export function createMemoryStorageProvider(
  seed?: Record<string, string>,
): StorageProvider {
  const map = new Map<string, string>(
    seed ? Object.entries(seed) : undefined,
  );

  return {
    backend: "memory",

    async get(key) {
      return map.has(key) ? (map.get(key) ?? null) : null;
    },

    async set(key, value) {
      map.set(key, value);
    },

    async remove(key) {
      map.delete(key);
    },

    async clear() {
      map.clear();
    },

    async has(key) {
      return map.has(key);
    },
  };
}
