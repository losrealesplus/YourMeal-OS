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
  ReceiptExecutionResult,
  ReceiptPreviewLine,
  ReceiptPreviewResult,
} from "../domain/procurement-types";
import { calculatePurchaseInvoiceTotals } from "../domain/purchase-invoice-calculator";
import { calculateWeightedAverageCost } from "../domain/wac-calculator";
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
   * Receives a purchase invoice atomically via PostgreSQL transaction.
   * Updates physical inventory stock, canonical WAC, immutable cost history,
   * stock_movements ledger, and marks invoice received/partially_received.
   */
  async receiveInvoice(
    ctx: ServiceContext,
    invoiceId: string,
    options?: {
      receiptId?: string;
      receivedLines?: Array<{ lineId: string; quantity: number }>;
    },
  ): Promise<ReceiptExecutionResult> {
    assertTenant(ctx);
    assertInventoryPermission(ctx);

    const repo = this.repositoryFactory(ctx);
    return await repo.receiveInvoiceAtomic({
      tenantId: ctx.tenantId,
      invoiceId,
      receiptId: options?.receiptId,
      receivedLines: options?.receivedLines,
      actorId: ctx.userId,
    });
  }

  /**
   * Previews the financial and inventory impact of receiving an invoice
   * before committing physical receipt in the warehouse.
   */
  async previewInvoiceReception(
    ctx: ServiceContext,
    invoiceId: string,
  ): Promise<ReceiptPreviewResult> {
    assertTenant(ctx);
    assertInventoryPermission(ctx);

    const repo = this.repositoryFactory(ctx);
    const invoice = await repo.getInvoiceById(ctx.tenantId, invoiceId);

    if (!invoice) {
      throw new DomainError("NOT_FOUND", `Purchase invoice ${invoiceId} not found.`);
    }

    const previewLines: ReceiptPreviewLine[] = [];
    let totalStockIncrement = 0;
    let hasServices = false;
    let hasInventoryItems = false;

    // Fetch current ingredients from Supabase or memory for preview
    const itemIds = invoice.items.map((i) => i.itemId);
    let dbIngredients: Array<{ id: string; name: string; unit: string; cost: number; stock: number }> = [];

    if (ctx.supabase?.from) {
      const { data } = await ctx.supabase
        .from("ingredients")
        .select("id, name, unit, cost, stock")
        .eq("tenant_id", ctx.tenantId)
        .in("id", itemIds);
      if (data) dbIngredients = data as any;
    }

    const ingMap = new Map<string, { id: string; name: string; unit: string; cost: number; stock: number }>();
    for (const ing of dbIngredients) {
      ingMap.set(ing.id, {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        cost: Number(ing.cost || 0),
        stock: Number(ing.stock || 0),
      });
    }

    for (const item of invoice.items) {
      const pendingQty = Math.max(0, item.quantity - (item.receivedQuantity ?? 0));
      const nature = item.itemNature ?? "INVENTORYABLE";

      if (nature === "EXPENSE_SERVICE" || nature === "CAPEX_ASSET") {
        hasServices = true;
        previewLines.push({
          lineId: item.id,
          itemId: item.itemId,
          itemName: item.itemName,
          itemNature: nature,
          quantityToReceive: pendingQty,
          unit: item.unit,
          currentStock: 0,
          predictedNewStock: 0,
          currentWac: 0,
          predictedNewWac: 0,
          stockMutated: false,
        });
        continue;
      }

      hasInventoryItems = true;
      const ing = ingMap.get(item.itemId);
      const currentStock = ing?.stock ?? 0;
      const currentCost = ing?.cost ?? 0;

      // Unit conversion check
      let normalizedQty = pendingQty;
      let normalizedCost = item.effectiveUnitCost;
      let unitWarning: string | undefined;

      const lineUnit = item.unit.toLowerCase();
      const baseUnit = (ing?.unit ?? item.unit).toLowerCase();

      if (lineUnit === "kg" && baseUnit === "g") {
        normalizedQty = pendingQty * 1000;
        normalizedCost = item.effectiveUnitCost / 1000;
        unitWarning = "Conversión automática: 1 kg = 1000 g";
      } else if (lineUnit === "g" && baseUnit === "kg") {
        normalizedQty = pendingQty / 1000;
        normalizedCost = item.effectiveUnitCost * 1000;
        unitWarning = "Conversión automática: 1000 g = 1 kg";
      } else if (lineUnit === "l" && baseUnit === "ml") {
        normalizedQty = pendingQty * 1000;
        normalizedCost = item.effectiveUnitCost / 1000;
        unitWarning = "Conversión automática: 1 l = 1000 ml";
      } else if (lineUnit === "ml" && baseUnit === "l") {
        normalizedQty = pendingQty / 1000;
        normalizedCost = item.effectiveUnitCost * 1000;
        unitWarning = "Conversión automática: 1000 ml = 1 l";
      }

      const predictedWac = calculateWeightedAverageCost({
        previousStock: currentStock,
        previousCost: currentCost,
        inboundQuantity: normalizedQty,
        inboundEffectiveCost: normalizedCost,
      });

      const predictedNewStock = currentStock + normalizedQty;
      totalStockIncrement += normalizedQty;

      previewLines.push({
        lineId: item.id,
        itemId: item.itemId,
        itemName: item.itemName,
        itemNature: "INVENTORYABLE",
        quantityToReceive: pendingQty,
        unit: ing?.unit ?? item.unit,
        currentStock,
        predictedNewStock,
        currentWac: currentCost,
        predictedNewWac: predictedWac,
        stockMutated: true,
        unitConversionWarning: unitWarning,
      });
    }

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      supplierId: invoice.supplierId,
      lines: previewLines,
      totalStockIncrement,
      hasServices,
      hasInventoryItems,
    };
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
