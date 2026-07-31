import { getStorageProvider } from "./resolve";

/**
 * Shape accepted by `@supabase/supabase-js` auth `storage` option
 * (sync or async getItem / setItem / removeItem).
 */
export type AuthStorageBridge = {
  getItem: (key: string) => string | Promise<string | null> | null;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
};

/**
 * Bridges StorageProvider → Supabase Auth storage.
 * Keeps session persistence on the same port as the rest of the app
 * (localStorage on web, Preferences on native — never direct).
 */
export function createSupabaseAuthStorage(): AuthStorageBridge {
  return {
    getItem: (key) => getStorageProvider().get(key),
    setItem: (key, value) => getStorageProvider().set(key, value),
    removeItem: (key) => getStorageProvider().remove(key),
  };
}
