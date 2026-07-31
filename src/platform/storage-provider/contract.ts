/**
 * M-04 · StorageProvider — single persistence port for the app.
 *
 * Domain / UI must never touch localStorage, Capacitor Preferences,
 * IndexedDB, or SQLite directly. Future backends (Secure Storage, SQLite)
 * plug in behind this contract without changing callers.
 */
export type StorageBackend = "memory" | "web" | "capacitor";

export interface StorageProvider {
  /** Which adapter is serving this instance (for diagnostics / tests). */
  readonly backend: StorageBackend;

  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}
