import type { StorageProvider } from "./contract";
import { createMemoryStorageProvider } from "./memory-adapter";

function canUseLocalStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probe = "__ymos_storage_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Web adapter — `localStorage` behind the StorageProvider contract.
 * Falls back to memory when localStorage is unavailable (SSR / private mode).
 */
export function createWebStorageProvider(): StorageProvider {
  if (!canUseLocalStorage()) {
    return createMemoryStorageProvider();
  }

  const store = window.localStorage;

  return {
    backend: "web",

    async get(key) {
      try {
        return store.getItem(key);
      } catch {
        return null;
      }
    },

    async set(key, value) {
      try {
        store.setItem(key, value);
      } catch {
        /* quota / private mode — swallow; callers treat as best-effort */
      }
    },

    async remove(key) {
      try {
        store.removeItem(key);
      } catch {
        /* ignore */
      }
    },

    async clear() {
      try {
        store.clear();
      } catch {
        /* ignore */
      }
    },

    async has(key) {
      try {
        return store.getItem(key) !== null;
      } catch {
        return false;
      }
    },
  };
}
