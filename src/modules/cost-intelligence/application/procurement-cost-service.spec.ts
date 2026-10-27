import { describe, expect, it } from "vitest";
import { ServiceContext } from "@/services/types";
import { ProcurementCostService } from "./procurement-cost-service";
import {
  CalculatedPurchaseInvoice,
  ItemCostHistoryEntry,
  PurchaseInvoiceStatus,
  ReceiptExecutionResult,
} from "../domain/procurement-types";
import { ProcurementCostRepository } from "../infrastructure/procurement-cost-repository";

class InMemoryProcurementRepository implements ProcurementCostRepository {
  private invoices = new Map<string, CalculatedPurchaseInvoice>();
  private costHistory: ItemCostHistoryEntry[] = [];

  async createInvoice(invoice: CalculatedPurchaseInvoice): Promise<CalculatedPurchaseInvoice> {
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async getInvoiceById(tenantId: string, invoiceId: string): Promise<CalculatedPurchaseInvoice | null> {
    const inv = this.invoices.get(invoiceId);
    if (!inv || inv.tenantId !== tenantId) return null;
    return inv;
  }

  async listInvoices(tenantId: string): Promise<CalculatedPurchaseInvoice[]> {
    return Array.from(this.invoices.values()).filter((i) => i.tenantId === tenantId);
  }

  async updateInvoiceStatus(
    tenantId: string,
    invoiceId: string,
    status: PurchaseInvoiceStatus,
  ): Promise<void> {
    const inv = this.invoices.get(invoiceId);
    if (inv && inv.tenantId === tenantId) {
      inv.status = status;
    }
  }

  async receiveInvoiceAtomic(input: {
    tenantId: string;
    invoiceId: string;
    receiptId?: string;
    receivedLines?: Array<{ lineId: string; quantity: number }>;
    actorId?: string;
  }): Promise<ReceiptExecutionResult> {
    const inv = this.invoices.get(input.invoiceId);
    if (!inv || inv.tenantId !== input.tenantId) {
      throw new Error(`Purchase invoice ${input.invoiceId} not found or tenant mismatch`);
    }
    if (inv.status === "cancelled") {
      throw new Error(`Cannot receive a cancelled purchase invoice (${input.invoiceId})`);
    }
    if (inv.status === "received" && !input.receivedLines) {
      return {
        success: true,
        invoiceId: inv.id,
        status: "received",
        receiptId: input.receiptId ?? "rcpt-mock",
        idempotent: true,
        summary: { itemsProcessed: 0, totalStockIncrement: 0, remainingPendingLines: 0 },
        processedLines: [],
      };
    }

    inv.status = "received";
    const historyEntries: ItemCostHistoryEntry[] = inv.items.map((item) => ({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      itemId: item.itemId,
      sourceInvoiceItemId: item.id,
      supplierId: inv.supplierId,
      unitPrice: item.unitPrice,
      allocatedOverhead: item.allocatedOverhead,
      effectiveUnitCost: item.effectiveUnitCost,
      costMethod: "effective_purchase",
      effectiveAt: new Date().toISOString(),
    }));
    await this.recordCostHistory(historyEntries);

    return {
      success: true,
      invoiceId: inv.id,
      status: "received",
      receiptId: input.receiptId ?? "rcpt-mock",
      idempotent: false,
      summary: {
        itemsProcessed: inv.items.length,
        totalStockIncrement: inv.items.reduce((acc, i) => acc + i.quantity, 0),
        remainingPendingLines: 0,
      },
      processedLines: inv.items.map((i) => ({
        lineId: i.id,
        itemId: i.itemId,
        itemName: i.itemName,
        itemNature: i.itemNature ?? "INVENTORYABLE",
        receivedQuantity: i.quantity,
        stockMutated: (i.itemNature ?? "INVENTORYABLE") === "INVENTORYABLE",
      })),
    };
  }

  async recordCostHistory(entries: ItemCostHistoryEntry[]): Promise<void> {
    this.costHistory.push(...entries);
  }

  async getItemCostHistory(tenantId: string, itemId: string): Promise<ItemCostHistoryEntry[]> {
    return this.costHistory
      .filter((e) => e.tenantId === tenantId && e.itemId === itemId)
      .sort((a, b) => b.effectiveAt.localeCompare(a.effectiveAt));
  }

  async getLatestEffectiveCost(tenantId: string, itemId: string): Promise<number | null> {
    const history = await this.getItemCostHistory(tenantId, itemId);
    if (history.length === 0) return null;
    return history[0].effectiveUnitCost;
  }
}

describe("ProcurementCostService (CR-COST-01 Application Service)", () => {
  const mockRepo = new InMemoryProcurementRepository();
  const service = new ProcurementCostService(() => mockRepo);

  const tenantA = "8bba00ba-331b-42c8-9283-4e3836ffb870";
  const tenantB = "7cba00ba-221b-32c8-8183-3e2826ffb999";

  const ctxTenantA: ServiceContext = {
    tenantId: tenantA,
    userId: "user-admin-a",
    roles: ["company_admin"],
    capabilities: new Set(["inventory.operate"]),
    supabase: {} as any,
  };

  const ctxTenantB: ServiceContext = {
    tenantId: tenantB,
    userId: "user-admin-b",
    roles: ["company_admin"],
    capabilities: new Set(["inventory.operate"]),
    supabase: {} as any,
  };

  const polloItemId = "33333333-3333-4333-8333-333333333333";
  const invMakroId = "11111111-1111-4111-8111-111111111111";
  const invTenantBId = "44444444-4444-4444-8444-444444444444";

  it("1. Creates a draft invoice and transitions to received, populating immutable cost history", async () => {
    const draft = await service.createDraftInvoice(ctxTenantA, {
      id: invMakroId,
      tenantId: tenantA,
      supplierId: "SUPP-MAKRO",
      invoiceNumber: "MK-8899",
      invoiceDate: "2026-09-26",
      additionalCosts: 20.0,
      items: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          itemId: polloItemId,
          itemName: "Pechuga de Pollo",
          quantity: 10,
          unit: "kg",
          unitPrice: 5.0,
        },
      ],
    });

    expect(draft.status).toBe("draft");
    expect(draft.items[0].effectiveUnitCost).toBe(7.0); // 5.0 base + 2.0 (20€ / 10kg)

    // Receive invoice
    const received = await service.receiveInvoice(ctxTenantA, invMakroId);
    expect(received.status).toBe("received");

    // Verify immutable cost history entry created
    const history = await service.getItemCostHistory(ctxTenantA, polloItemId);
    expect(history.length).toBe(1);
    expect(history[0].effectiveUnitCost).toBe(7.0);
    expect(history[0].supplierId).toBe("SUPP-MAKRO");

    const latestCost = await service.getLatestEffectiveCost(ctxTenantA, polloItemId);
    expect(latestCost).toBe(7.0);
  });

  it("2. Adversarial Multi-Tenant Proof (Tenant A != Tenant B): Complete data and cost isolation", async () => {
    // Tenant B creates an invoice for the same item ID but different price
    await service.createDraftInvoice(ctxTenantB, {
      id: invTenantBId,
      tenantId: tenantB,
      supplierId: "SUPP-OTHER",
      invoiceNumber: "TB-001",
      invoiceDate: "2026-09-26",
      additionalCosts: 0,
      items: [
        {
          id: "55555555-5555-4555-8555-555555555555",
          itemId: polloItemId,
          itemName: "Pechuga de Pollo",
          quantity: 10,
          unit: "kg",
          unitPrice: 3.5, // 3.50€
        },
      ],
    });

    await service.receiveInvoice(ctxTenantB, invTenantBId);

    // Tenant A's cost remains 7.0€
    const costA = await service.getLatestEffectiveCost(ctxTenantA, polloItemId);
    expect(costA).toBe(7.0);

    // Tenant B's cost is 3.5€
    const costB = await service.getLatestEffectiveCost(ctxTenantB, polloItemId);
    expect(costB).toBe(3.5);

    // Tenant A cannot access Tenant B's invoice
    await expect(service.receiveInvoice(ctxTenantA, invTenantBId)).rejects.toThrow();
  });

  it("3. Enforces RBAC permissions (Requires inventory.operate)", async () => {
    const unprivilegedCtx: ServiceContext = {
      tenantId: tenantA,
      userId: "user-readonly",
      roles: ["customer"],
      capabilities: new Set([]), // No inventory.operate
      supabase: {} as any,
    };

    await expect(
      service.createDraftInvoice(unprivilegedCtx, {
        tenantId: tenantA,
        supplierId: "SUPP-MAKRO",
        invoiceNumber: "MK-002",
        invoiceDate: "2026-09-26",
        items: [{ itemId: polloItemId, itemName: "Item 1", quantity: 1, unit: "kg", unitPrice: 1 }],
      }),
    ).rejects.toThrow();
  });
});
