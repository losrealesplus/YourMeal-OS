import { z } from "zod";

/**
 * Minimal non-sensitive token representing an in-flight / unconfirmed order capture.
 * Deliberately excludes customer PII (no phone, no delivery address),
 * financial secrets, and raw food items.
 */
export interface PendingCaptureToken {
  requestId: string;
  tenantId: string;
  customerId: string;
  customerDisplayName?: string;
  weekStart: string;
  lineCount: number;
  timestamp: string;
}

const PendingCaptureTokenSchema = z.object({
  requestId: z.string().uuid(),
  tenantId: z.string().uuid(),
  customerId: z.string().min(1),
  customerDisplayName: z.string().optional(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lineCount: z.number().int().nonnegative(),
  timestamp: z.string().min(1),
});

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
 */
export function savePendingCaptureToken(token: PendingCaptureToken): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(storageKey(token.tenantId), JSON.stringify(token));
  } catch {
    // Ignore storage quota / access issues
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
    // Ignore storage issues
  }
}
