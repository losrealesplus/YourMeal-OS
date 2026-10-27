import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseProcurementCostRepository } from "./procurement-cost-repository";
import { isValidUuid } from "../domain/purchase-invoice-calculator";
import { CalculatedPurchaseInvoice } from "../domain/procurement-types";

describe("SupabaseProcurementCostRepository", () => {
  it("maps partial receipt lines to the SQL contract without falling back to full receipt", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({
        data: {
          success: true,
          invoice_id: "invoice",
          status: "partially_received",
          receipt_id: "key",
          summary: {},
          processed_lines: [],
        },
        error: null,
      });
    const repo = new SupabaseProcurementCostRepository({ rpc } as unknown as SupabaseClient);
    await repo.receiveInvoiceAtomic({
      tenantId: "tenant",
      invoiceId: "invoice",
      receiptId: "key",
      receivedLines: [{ lineId: "line", quantity: 2 }],
    });
    expect(rpc).toHaveBeenCalledWith(
      "receive_purchase_invoice_v1",
      expect.objectContaining({ p_received_lines: [{ line_id: "line", quantity: 2 }] }),
    );
    await repo.receiveInvoiceAtomic({ tenantId: "tenant", invoiceId: "invoice", receivedLines: [] });
    expect(rpc.mock.calls[1][1].p_received_lines).toEqual([]);
    await repo.receiveInvoiceAtomic({ tenantId: "tenant", invoiceId: "invoice" });
    expect(rpc.mock.calls[2][1].p_received_lines).toBeNull();
  });

  it("createInvoice returns existing draft idempotently if already persisted", async () => {
    const existingInvoice: CalculatedPurchaseInvoice = {
      id: "11111111-2222-4333-8444-555555555555",
      tenantId: "tenant-1",
      supplierId: "supp-1",
      invoiceNumber: "INV-001",
      invoiceDate: "2026-10-27",
      subtotal: 100,
      taxAmount: 10,
      additionalCosts: 0,
      totalAmount: 110,
      allocationMethod: "value",
      status: "draft",
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockGet = vi.fn().mockResolvedValue(existingInvoice);
    const mockInsert = vi.fn();

    const repo = new SupabaseProcurementCostRepository({} as unknown as SupabaseClient);
    repo.getInvoiceById = mockGet;

    const result = await repo.createInvoice(existingInvoice);
    expect(result).toEqual(existingInvoice);
    expect(mockGet).toHaveBeenCalledWith("tenant-1", existingInvoice.id);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("createInvoice sanitizes non-UUID IDs to valid UUIDs before inserting", async () => {
    let insertedInvoice: any = null;
    let insertedItems: any[] = [];

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "purchase_invoices") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn((payload) => {
              insertedInvoice = payload;
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: payload, error: null }),
                }),
              };
            }),
          };
        }
        if (table === "purchase_invoice_items") {
          return {
            insert: vi.fn((payload) => {
              insertedItems = payload;
              return { error: null };
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const repo = new SupabaseProcurementCostRepository(mockClient);

    const invoiceWithBadIds: CalculatedPurchaseInvoice = {
      id: "temp-inv-id", // Invalid UUID
      tenantId: "00000000-0000-4000-8000-000000000001",
      supplierId: "00000000-0000-4000-8000-000000000002",
      invoiceNumber: "INV-BAD-ID",
      invoiceDate: "2026-10-27",
      subtotal: 50,
      taxAmount: 5,
      additionalCosts: 0,
      totalAmount: 55,
      allocationMethod: "value",
      status: "draft",
      items: [
        {
          id: "item-1", // Invalid UUID
          purchaseInvoiceId: "temp-inv-id",
          tenantId: "00000000-0000-4000-8000-000000000001",
          itemId: "item-custom-1234", // Invalid UUID
          itemName: "Línea Test",
          itemNature: "EXPENSE_SERVICE",
          quantity: 1,
          unit: "ud",
          unitPrice: 50,
          discountAmount: 0,
          taxRate: 10,
          taxAmount: 5,
          allocatedOverhead: 0,
          effectiveUnitCost: 50,
          lineTotal: 55,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await repo.createInvoice(invoiceWithBadIds);

    expect(isValidUuid(insertedInvoice.id)).toBe(true);
    expect(insertedInvoice.id).not.toBe("temp-inv-id");
    expect(isValidUuid(insertedItems[0].id)).toBe(true);
    expect(insertedItems[0].id).not.toBe("item-1");
    expect(isValidUuid(insertedItems[0].item_id)).toBe(true);
    expect(insertedItems[0].item_nature).toBe("EXPENSE_SERVICE");
    expect(res.id).toBe(insertedInvoice.id);
  });
});
