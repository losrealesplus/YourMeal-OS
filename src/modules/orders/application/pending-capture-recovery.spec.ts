import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPendingCaptureToken,
  savePendingCaptureToken,
  clearPendingCaptureToken,
  type PendingCaptureToken,
} from "./pending-capture-recovery";

describe("PendingCaptureRecovery Unit Test Suite", () => {
  const tenantId = "10000000-0000-4000-8000-000000000001";
  const validToken: PendingCaptureToken = {
    requestId: "70000000-0000-4000-8000-000000000001",
    tenantId,
    customerId: "30000000-0000-4000-8000-000000000001",
    customerDisplayName: "Juan Pérez",
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

  it("reconciliation token contains no sensitive customer personal/financial data", () => {
    savePendingCaptureToken(validToken);
    const raw = store[`ym_pending_order_capture_${tenantId}`]!;
    const parsed = JSON.parse(raw);

    // Verify presence of non-sensitive transaction identifiers
    expect(parsed.requestId).toBe(validToken.requestId);
    expect(parsed.tenantId).toBe(validToken.tenantId);

    // Verify absence of sensitive PII or billing data
    expect(parsed.phone).toBeUndefined();
    expect(parsed.street).toBeUndefined();
    expect(parsed.city).toBeUndefined();
    expect(parsed.creditCard).toBeUndefined();
    expect(parsed.paymentToken).toBeUndefined();
    expect(parsed.allergens).toBeUndefined();
  });
});
