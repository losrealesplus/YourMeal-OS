import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseProcurementCostRepository } from "./procurement-cost-repository";
import { isValidUuid } from "../domain/purchase-invoice-calculator";
import { CalculatedPurchaseInvoice } from "../domain/procurement-types";

describe("SupabaseProcurementCostRepository", () => {
  const validTenantId = "00000000-0000-4000-8000-000000000001";
  const validSupplierId = "00000000-0000-4000-8000-000000000002";
  const validInvoiceId = "11111111-2222-4333-8444-555555555555";
  const validLineId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
  const validIngredientId = "99999999-8888-4777-8666-555555555555";

  const completeInvoice: CalculatedPurchaseInvoice = {
    id: validInvoiceId,
    tenantId: validTenantId,
    supplierId: validSupplierId,
    invoiceNumber: "INV-2026-001",
    invoiceDate: "2026-10-27",
    subtotal: 100,
    taxAmount: 10,
    additionalCosts: 0,
    totalAmount: 110,
    allocationMethod: "value",
    status: "draft",
    items: [
      {
        id: validLineId,
        purchaseInvoiceId: validInvoiceId,
        tenantId: validTenantId,
        itemId: validIngredientId,
        itemName: "Pechuga de Pollo",
        itemNature: "INVENTORYABLE",
        quantity: 20,
        unit: "kg",
        unitPrice: 5.0,
        discountAmount: 0,
        taxRate: 10,
        taxAmount: 10,
        allocatedOverhead: 0,
        effectiveUnitCost: 5.0,
        lineTotal: 110,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("1. Maps partial receipt lines to the SQL contract without falling back to full receipt", async () => {
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

  it("2. Creates a complete invoice with header and lines in PostgreSQL", async () => {
    let insertedHeader: any = null;
    let insertedLines: any[] = [];

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "purchase_invoices") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn((payload) => {
              insertedHeader = payload;
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
              insertedLines = payload;
              return { error: null };
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const repo = new SupabaseProcurementCostRepository(mockClient);
    const created = await repo.createInvoice(completeInvoice);

    expect(created.id).toBe(validInvoiceId);
    expect(insertedHeader.id).toBe(validInvoiceId);
    expect(insertedLines.length).toBe(1);
    expect(insertedLines[0].item_id).toBe(validIngredientId);
    expect(insertedLines[0].item_nature).toBe("INVENTORYABLE");
  });

  it("3. Detects incomplete invoice after simulated lines insertion failure and never returns false success on retry", async () => {
    // Simulate: header exists in DB, but lines insertion previously failed so DB has 0 items
    const incompleteInvoiceInDb: CalculatedPurchaseInvoice = {
      ...completeInvoice,
      items: [], // Corrupted / partial write with 0 lines
    };

    const repo = new SupabaseProcurementCostRepository({} as unknown as SupabaseClient);
    repo.getInvoiceById = vi.fn().mockResolvedValue(incompleteInvoiceInDb);

    // Retrying with the same invoice ID must NEVER return false success
    await expect(repo.createInvoice(completeInvoice)).rejects.toThrow(
      "INVOICE_INTEGRITY_MISMATCH",
    );
  });

  it("4. Rejects retry with the same invoice ID when content has been altered (conflict)", async () => {
    const existingInDb: CalculatedPurchaseInvoice = {
      ...completeInvoice,
      invoiceNumber: "ORIGINAL-INV-001",
    };

    const repo = new SupabaseProcurementCostRepository({} as unknown as SupabaseClient);
    repo.getInvoiceById = vi.fn().mockResolvedValue(existingInDb);

    // Retry has different invoice number
    const alteredPayload: CalculatedPurchaseInvoice = {
      ...completeInvoice,
      invoiceNumber: "ALTERED-INV-999",
    };

    await expect(repo.createInvoice(alteredPayload)).rejects.toThrow(
      "INVOICE_CONFLICT",
    );
  });

  it("5. Returns existing draft idempotently when retry matches identical complete header and lines", async () => {
    const repo = new SupabaseProcurementCostRepository({} as unknown as SupabaseClient);
    repo.getInvoiceById = vi.fn().mockResolvedValue(completeInvoice);

    const result = await repo.createInvoice(completeInvoice);
    expect(result).toEqual(completeInvoice);
    expect(result.id).toBe(validInvoiceId);
    expect(result.items.length).toBe(1);
  });

  it("6. Rejects invalid non-UUID invoice ID", async () => {
    const repo = new SupabaseProcurementCostRepository({} as unknown as SupabaseClient);
    const badInvoice = {
      ...completeInvoice,
      id: "temp-inv-id", // Invalid UUID
    };

    await expect(repo.createInvoice(badInvoice)).rejects.toThrow("INVALID_UUID");
  });

  it("7. Rejects inventoryable lines without a valid ingredient UUID", async () => {
    const repo = new SupabaseProcurementCostRepository({} as unknown as SupabaseClient);
    repo.getInvoiceById = vi.fn().mockResolvedValue(null);

    const badLineInvoice: CalculatedPurchaseInvoice = {
      ...completeInvoice,
      items: [
        {
          ...completeInvoice.items[0],
          itemId: "not-a-valid-ingredient-uuid",
        },
      ],
    };

    await expect(repo.createInvoice(badLineInvoice)).rejects.toThrow(
      "INVALID_INGREDIENT_ID",
    );
  });
});
