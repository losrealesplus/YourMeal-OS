import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPendingCaptureToken,
  savePendingCaptureToken,
  clearPendingCaptureToken,
  StoragePersistenceError,
  type PendingCaptureToken,
} from "./pending-capture-recovery";

describe("PendingCaptureRecovery Unit Test Suite", () => {
  const tenantId = "10000000-0000-4000-8000-000000000001";
  const validToken: PendingCaptureToken = {
    requestId: "70000000-0000-4000-8000-000000000001",
    tenantId,
    customerId: "30000000-0000-4000-8000-000000000001",
    weekStart: "2026-10-12",
    lineCount: 2,
    timestamp: "2026-10-13T10:00:00.000Z",
  };

  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
      },
    });
  });

  it("saves and retrieves a valid pending capture recovery token", () => {
    savePendingCaptureToken(validToken);
    const retrieved = getPendingCaptureToken(tenantId);
    expect(retrieved).toEqual(validToken);
  });

  it("clears pending capture token on successful commit or resolution", () => {
    savePendingCaptureToken(validToken);
    expect(getPendingCaptureToken(tenantId)).not.toBeNull();
    clearPendingCaptureToken(tenantId);
    expect(getPendingCaptureToken(tenantId)).toBeNull();
  });

  it("clears corrupted or invalid token safely and returns null", () => {
    store[`ym_pending_order_capture_${tenantId}`] = JSON.stringify({
      requestId: "not-a-uuid",
      tenantId,
    });
    const retrieved = getPendingCaptureToken(tenantId);
    expect(retrieved).toBeNull();
    expect(store[`ym_pending_order_capture_${tenantId}`]).toBeUndefined();
  });

  it("reconciliation token contains zero customer personal/financial data (no names, PII, or secrets)", () => {
    savePendingCaptureToken(validToken);
    const raw = store[`ym_pending_order_capture_${tenantId}`]!;
    const parsed = JSON.parse(raw);

    // Verify presence of non-sensitive transaction identifiers
    expect(parsed.requestId).toBe(validToken.requestId);
    expect(parsed.tenantId).toBe(validToken.tenantId);
    expect(parsed.customerId).toBe(validToken.customerId);
    expect(parsed.weekStart).toBe(validToken.weekStart);
    expect(parsed.lineCount).toBe(validToken.lineCount);
    expect(parsed.timestamp).toBe(validToken.timestamp);

    // Verify STRICT ABSENCE of customer personal names or PII
    expect(parsed.customerDisplayName).toBeUndefined();
    expect(parsed.displayName).toBeUndefined();
    expect(parsed.name).toBeUndefined();
    expect(parsed.phone).toBeUndefined();
    expect(parsed.street).toBeUndefined();
    expect(parsed.city).toBeUndefined();
    expect(parsed.creditCard).toBeUndefined();
    expect(parsed.paymentToken).toBeUndefined();
    expect(parsed.allergens).toBeUndefined();
  });

  it("fails loudly with StoragePersistenceError when localStorage is not available", () => {
    vi.stubGlobal("window", undefined);
    expect(() => savePendingCaptureToken(validToken)).toThrow(StoragePersistenceError);
    expect(() => savePendingCaptureToken(validToken)).toThrow(
      "LocalStorage is not available for capture recovery",
    );
  });

  it("fails loudly with StoragePersistenceError when localStorage.setItem throws (e.g. quota exceeded)", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(() => {
          throw new Error("QuotaExceededError");
        }),
        removeItem: vi.fn(),
      },
    });
    expect(() => savePendingCaptureToken(validToken)).toThrow(StoragePersistenceError);
  });

  it("fails loudly when persisted token verification readback fails", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => null), // Returns null on readback
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    });
    expect(() => savePendingCaptureToken(validToken)).toThrow(StoragePersistenceError);
    expect(() => savePendingCaptureToken(validToken)).toThrow(
      "Failed to verify persisted capture token in localStorage",
    );
  });
});
