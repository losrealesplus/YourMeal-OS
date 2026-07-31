export type { StorageBackend, StorageProvider } from "./contract";

export {
  getStorageProvider,
  resetStorageProviderCache,
  setStorageProviderForTests,
} from "./resolve";

export { createMemoryStorageProvider } from "./memory-adapter";
export { createWebStorageProvider } from "./web-adapter";
export { createCapacitorStorageProvider } from "./capacitor-adapter";
export { createSupabaseAuthStorage } from "./supabase-auth-storage";
