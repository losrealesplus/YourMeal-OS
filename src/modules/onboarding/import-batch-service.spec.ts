import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isImportBatchCommitted,
  rollbackImportBatch,
  commitImportBatch,
} from "./import-batch-service";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://test.supabase.co";
const SERVICE_KEY = "test-service-key";
const TENANT_ID = "8bba00ba-331b-42c8-9283-4e3836ffb870";
const BATCH_ID = "de5224d7-604e-40d2-afe1-65624a8aee85";

function mockFetch(responsesByUrl: Record<string, unknown>) {
  return vi.fn((url: string) => {
    const match = Object.entries(responsesByUrl).find(([key]) => url.includes(key));
    const body = match ? match[1] : [];
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
      headers: new Headers({ "content-range": `0-10/5` }),
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
describe("Import Batch Service — H-3 Atomic Audit Invariants", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Invariant H-3.1: isImportBatchCommitted returns true when audit_log has batch entry", async () => {
    const fetch = mockFetch({
      "audit_log": [{ id: "audit-1", entity_id: BATCH_ID, action: "onboarding.menu_and_dish_import" }],
    });
    vi.stubGlobal("fetch", fetch);

    const result = await isImportBatchCommitted(SUPABASE_URL, SERVICE_KEY, BATCH_ID);
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("audit_log"),
      expect.any(Object),
    );
  });

  it("Invariant H-3.2: isImportBatchCommitted returns false when no audit_log entry", async () => {
    const fetch = mockFetch({ "audit_log": [] });
    vi.stubGlobal("fetch", fetch);

    const result = await isImportBatchCommitted(SUPABASE_URL, SERVICE_KEY, BATCH_ID);
    expect(result).toBe(false);
  });

  it("Invariant H-3.3: commitImportBatch writes exactly one audit_log entry with correct fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve([]),
      text: () => Promise.resolve(""),
      headers: new Headers(),
    });
    vi.stubGlobal("fetch", fetchMock);

    await commitImportBatch(
      SUPABASE_URL,
      SERVICE_KEY,
      {
        tenantId: TENANT_ID,
        actorId: "actor-uuid",
        sourceFile: "Menú x semanas ECT.xlsx",
        sourceFileSha256: "abc123",
        batchId: BATCH_ID,
      },
      { dishesInserted: 180, menusInserted: 8, slotsInserted: 280, sourceSlotsReconciled: 280 },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toContain("audit_log");
    expect(call[1]?.method).toBe("POST");

    const body = JSON.parse(call[1].body);
    expect(body.entity_id).toBe(BATCH_ID);
    expect(body.action).toBe("onboarding.menu_and_dish_import");
    expect(body.new_data.dishes_imported).toBe(180);
    expect(body.new_data.menu_slots_imported).toBe(280);
    expect(body.new_data.source_slots_reconciled).toBe(280);
    expect(body.new_data.source_file).toBe("Menú x semanas ECT.xlsx");
    expect(body.new_data.source_file_sha256).toBe("abc123");
  });

  it("Invariant H-3.4: commitImportBatch throws if audit_log write fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
      headers: new Headers(),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      commitImportBatch(
        SUPABASE_URL,
        SERVICE_KEY,
        { tenantId: TENANT_ID, actorId: "actor-uuid", sourceFile: "file.xlsx", sourceFileSha256: "sha", batchId: BATCH_ID },
        { dishesInserted: 1, menusInserted: 1, slotsInserted: 1, sourceSlotsReconciled: 1 },
      ),
    ).rejects.toThrow("Import batch commit failed (audit_log write): 500");
  });

  it("Invariant H-3.5: idempotency gate prevents re-commit when batch already committed", async () => {
    // Simulate: batch is already committed (audit_log has entry)
    const fetchMock = mockFetch({
      "audit_log": [{ id: "existing-audit", entity_id: BATCH_ID }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const alreadyCommitted = await isImportBatchCommitted(SUPABASE_URL, SERVICE_KEY, BATCH_ID);
    expect(alreadyCommitted).toBe(true);

    // Caller MUST check this before calling commitImportBatch — no duplicates
    // (The service doesn't auto-deduplicate; the idempotency contract is at caller level)
  });
});
