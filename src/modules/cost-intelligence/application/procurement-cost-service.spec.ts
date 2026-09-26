import { describe, expect, it } from "vitest";
import { ServiceContext } from "@/services/types";
import { ProcurementCostService } from "./procurement-cost-service";
import {
  CalculatedPurchaseInvoice,
  ItemCostHistoryEntry,
  PurchaseInvoiceStatus,
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

  it("1. Creates a draft invoice and transitions to received, populating immutable cost history", async () => {
    const draft = await service.createDraftInvoice(ctxTenantA, {
      id: "inv-makro-001",
      tenantId: tenantA,
      supplierId: "SUPP-MAKRO",
      invoiceNumber: "MK-8899",
      invoiceDate: "2026-09-26",
      additionalCosts: 20.0,
      items: [
        {
          id: "item-p1",
          itemId: "ING-POLLO",
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
    const received = await service.receiveInvoice(ctxTenantA, "inv-makro-001");
    expect(received.status).toBe("received");

    // Verify immutable cost history entry created
    const history = await service.getItemCostHistory(ctxTenantA, "ING-POLLO");
    expect(history.length).toBe(1);
    expect(history[0].effectiveUnitCost).toBe(7.0);
    expect(history[0].supplierId).toBe("SUPP-MAKRO");

    const latestCost = await service.getLatestEffectiveCost(ctxTenantA, "ING-POLLO");
    expect(latestCost).toBe(7.0);
  });

  it("2. Adversarial Multi-Tenant Proof (Tenant A != Tenant B): Complete data and cost isolation", async () => {
    // Tenant B creates an invoice for the same item ID but different price
    await service.createDraftInvoice(ctxTenantB, {
      id: "inv-tenantb-001",
      tenantId: tenantB,
      supplierId: "SUPP-OTHER",
      invoiceNumber: "TB-001",
      invoiceDate: "2026-09-26",
      additionalCosts: 0,
      items: [
        {
          id: "item-tb1",
          itemId: "ING-POLLO",
          itemName: "Pechuga de Pollo",
          quantity: 10,
          unit: "kg",
          unitPrice: 3.5, // 3.50€
        },
      ],
    });

    await service.receiveInvoice(ctxTenantB, "inv-tenantb-001");

    // Tenant A's cost remains 7.0€
    const costA = await service.getLatestEffectiveCost(ctxTenantA, "ING-POLLO");
    expect(costA).toBe(7.0);

    // Tenant B's cost is 3.5€
    const costB = await service.getLatestEffectiveCost(ctxTenantB, "ING-POLLO");
    expect(costB).toBe(3.5);

    // Tenant A cannot access Tenant B's invoice
    await expect(service.receiveInvoice(ctxTenantA, "inv-tenantb-001")).rejects.toThrow();
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
        items: [{ itemId: "ING-1", itemName: "Item 1", quantity: 1, unit: "kg", unitPrice: 1 }],
      }),
    ).rejects.toThrow();
  });
});
