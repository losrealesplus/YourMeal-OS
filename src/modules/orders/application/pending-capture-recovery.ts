import { z } from "zod";

/**
 * Minimal non-sensitive token representing an in-flight / unconfirmed order capture.
 * Deliberately excludes customer PII (no name, no phone, no delivery address),
 * financial secrets, and raw food items.
 */
export interface PendingCaptureToken {
  requestId: string;
  tenantId: string;
  customerId: string;
  weekStart: string;
  lineCount: number;
  timestamp: string;
}

const PendingCaptureTokenSchema = z.object({
  requestId: z.string().uuid(),
  tenantId: z.string().uuid(),
  customerId: z.string().min(1),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lineCount: z.number().int().nonnegative(),
  timestamp: z.string().min(1),
});

export class StoragePersistenceError extends Error {
  constructor(message = "STORAGE_PERSISTENCE_FAILED") {
    super(message);
    this.name = "StoragePersistenceError";
  }
}

function storageKey(tenantId: string): string {
  return `ym_pending_order_capture_${tenantId}`;
}

/**
 * Retrieves the pending capture recovery token from persistent storage.
 * Returns null if not in browser context, missing, or invalid.
 */
export function getPendingCaptureToken(tenantId: string): PendingCaptureToken | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(tenantId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const result = PendingCaptureTokenSchema.safeParse(parsed);
    if (!result.success) {
      window.localStorage.removeItem(storageKey(tenantId));
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

/**
 * Persists an in-flight capture attempt to localStorage before commit.
 * Throws StoragePersistenceError if localStorage is unavailable or persistence fails.
 */
export function savePendingCaptureToken(token: PendingCaptureToken): void {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new StoragePersistenceError("LocalStorage is not available for capture recovery");
  }
  try {
    const key = storageKey(token.tenantId);
    const value = JSON.stringify(token);
    window.localStorage.setItem(key, value);
    const verified = window.localStorage.getItem(key);
    if (!verified || verified !== value) {
      throw new StoragePersistenceError("Failed to verify persisted capture token in localStorage");
    }
  } catch (err) {
    if (err instanceof StoragePersistenceError) throw err;
    throw new StoragePersistenceError(
      `Failed to persist recovery token: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Clears the pending capture token once committed, verified, or reconciled.
 */
export function clearPendingCaptureToken(tenantId: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(storageKey(tenantId));
  } catch {
    // Ignore storage issues on cleanup
  }
}
