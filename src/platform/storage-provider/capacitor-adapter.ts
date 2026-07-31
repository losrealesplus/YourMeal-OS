import { Preferences } from "@capacitor/preferences";
import type { StorageProvider } from "./contract";

/**
 * Capacitor adapter — `@capacitor/preferences` only.
 * No Secure Storage / SQLite in M-04.
 */
export function createCapacitorStorageProvider(): StorageProvider {
  return {
    backend: "capacitor",

    async get(key) {
      const { value } = await Preferences.get({ key });
      return value;
    },

    async set(key, value) {
      await Preferences.set({ key, value });
    },

    async remove(key) {
      await Preferences.remove({ key });
    },

    async clear() {
      await Preferences.clear();
    },

    async has(key) {
      const { value } = await Preferences.get({ key });
      return value !== null;
    },
  };
}
