/**
 * YOURMEAL OS — PROCUREMENT COST SERVICE (CR-COST-01)
 * Application service for managing purchase invoices and cost history.
 */

import { ServiceContext } from "@/services/types";
import { DomainError, permissionDenied } from "@/domain/errors";
import {
  CalculatedPurchaseInvoice,
  ItemCostHistoryEntry,
  PurchaseInvoiceInput,
} from "../domain/procurement-types";
import { calculatePurchaseInvoiceTotals } from "../domain/purchase-invoice-calculator";
import {
  ProcurementCostRepository,
  SupabaseProcurementCostRepository,
} from "../infrastructure/procurement-cost-repository";

function assertTenant(ctx: ServiceContext): void {
  if (!ctx.tenantId || !ctx.userId) {
    throw new DomainError("PERMISSION_DENIED", "Tenant and user required");
  }
}

function assertInventoryPermission(ctx: ServiceContext): void {
  if (!ctx.capabilities.has("inventory.operate")) {
    throw permissionDenied("inventory.operate");
  }
}

export class ProcurementCostService {
  constructor(
    private readonly repositoryFactory: (ctx: ServiceContext) => ProcurementCostRepository = (ctx) =>
      new SupabaseProcurementCostRepository(ctx.supabase),
  ) {}

  /**
   * Lists purchase invoices for the tenant.
   */
  async listInvoices(
    ctx: ServiceContext,
    limit = 50,
  ): Promise<CalculatedPurchaseInvoice[]> {
    assertTenant(ctx);
    assertInventoryPermission(ctx);

    const repo = this.repositoryFactory(ctx);
    return await repo.listInvoices(ctx.tenantId, limit);
  }

  /**
   * Creates a calculated draft purchase invoice with prorated inbound costs.
   */
  async createDraftInvoice(
    ctx: ServiceContext,
    input: PurchaseInvoiceInput,
  ): Promise<CalculatedPurchaseInvoice> {
    assertTenant(ctx);
    assertInventoryPermission(ctx);

    if (input.tenantId !== ctx.tenantId) {
      throw new DomainError(
        "PERMISSION_DENIED",
        `Tenant mismatch: payload tenant (${input.tenantId}) != context (${ctx.tenantId})`,
      );
    }

    const calculated = calculatePurchaseInvoiceTotals(input);
    const repo = this.repositoryFactory(ctx);
    return await repo.createInvoice(calculated);
  }

  /**
   * Receives a purchase invoice, updates status to 'received',
   * and records immutable cost history entries for each purchased line item.
   */
  async receiveInvoice(
    ctx: ServiceContext,
    invoiceId: string,
  ): Promise<CalculatedPurchaseInvoice> {
    assertTenant(ctx);
    assertInventoryPermission(ctx);

    const repo = this.repositoryFactory(ctx);
    const invoice = await repo.getInvoiceById(ctx.tenantId, invoiceId);

    if (!invoice) {
      throw new DomainError("NOT_FOUND", `Purchase invoice ${invoiceId} not found.`);
    }

    if (invoice.status === "received" || invoice.status === "posted") {
      // Idempotent return if already received
      return invoice;
    }

    if (invoice.status === "cancelled") {
      throw new DomainError(
        "INVALID_STATE",
        `Cannot receive a cancelled purchase invoice (${invoiceId}).`,
      );
    }

    // 1. Update invoice status
    await repo.updateInvoiceStatus(ctx.tenantId, invoiceId, "received");

    // 2. Generate and record immutable cost history entries
    const historyEntries: ItemCostHistoryEntry[] = invoice.items.map((item) => ({
      id: crypto.randomUUID(),
      tenantId: ctx.tenantId,
      itemId: item.itemId,
      sourceInvoiceItemId: item.id,
      supplierId: invoice.supplierId,
      unitPrice: item.unitPrice,
      allocatedOverhead: item.allocatedOverhead,
      effectiveUnitCost: item.effectiveUnitCost,
      costMethod: "effective_purchase",
      effectiveAt: new Date().toISOString(),
    }));

    await repo.recordCostHistory(historyEntries);

    invoice.status = "received";
    return invoice;
  }

  /**
   * Retrieves chronological cost history for an item.
   */
  async getItemCostHistory(
    ctx: ServiceContext,
    itemId: string,
  ): Promise<ItemCostHistoryEntry[]> {
    assertTenant(ctx);
    assertInventoryPermission(ctx);

    const repo = this.repositoryFactory(ctx);
    return await repo.getItemCostHistory(ctx.tenantId, itemId);
  }

  /**
   * Retrieves the latest effective acquisition cost for an item.
   */
  async getLatestEffectiveCost(
    ctx: ServiceContext,
    itemId: string,
  ): Promise<number | null> {
    assertTenant(ctx);
    assertInventoryPermission(ctx);

    const repo = this.repositoryFactory(ctx);
    return await repo.getLatestEffectiveCost(ctx.tenantId, itemId);
  }
}
