/**
 * YOURMEAL OS — PROCUREMENT COST REPOSITORY (CR-COST-01)
 * Database persistence layer for purchase invoices, items, and cost history.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  CalculatedPurchaseInvoice,
  ItemCostHistoryEntry,
  ItemNature,
  PurchaseInvoiceStatus,
  ReceiptExecutionResult,
} from "../domain/procurement-types";

export interface ProcurementCostRepository {
  createInvoice(invoice: CalculatedPurchaseInvoice): Promise<CalculatedPurchaseInvoice>;
  getInvoiceById(tenantId: string, invoiceId: string): Promise<CalculatedPurchaseInvoice | null>;
  listInvoices(tenantId: string, limit?: number): Promise<CalculatedPurchaseInvoice[]>;
  updateInvoiceStatus(
    tenantId: string,
    invoiceId: string,
    status: PurchaseInvoiceStatus,
  ): Promise<void>;
  receiveInvoiceAtomic(input: {
    tenantId: string;
    invoiceId: string;
    receiptId?: string;
    receivedLines?: Array<{ lineId: string; quantity: number }>;
    actorId?: string;
  }): Promise<ReceiptExecutionResult>;
  recordCostHistory(entries: ItemCostHistoryEntry[]): Promise<void>;
  getItemCostHistory(tenantId: string, itemId: string): Promise<ItemCostHistoryEntry[]>;
  getLatestEffectiveCost(tenantId: string, itemId: string): Promise<number | null>;
}

export class SupabaseProcurementCostRepository implements ProcurementCostRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createInvoice(invoice: CalculatedPurchaseInvoice): Promise<CalculatedPurchaseInvoice> {
    const { data: invData, error: invError } = await this.supabase
      .from("purchase_invoices")
      .insert({
        id: invoice.id,
        tenant_id: invoice.tenantId,
        supplier_id: invoice.supplierId,
        invoice_number: invoice.invoiceNumber,
        invoice_date: invoice.invoiceDate,
        subtotal: invoice.subtotal,
        tax_amount: invoice.taxAmount,
        additional_costs: invoice.additionalCosts,
        total_amount: invoice.totalAmount,
        allocation_method: invoice.allocationMethod,
        status: invoice.status,
        notes: invoice.notes,
      })
      .select()
      .single();

    if (invError) throw invError;

    const itemsToInsert = invoice.items.map((item) => ({
      id: item.id,
      tenant_id: invoice.tenantId,
      purchase_invoice_id: invoice.id,
      item_id: item.itemId,
      item_name: item.itemName,
      item_nature: item.itemNature ?? "INVENTORYABLE",
      quantity: item.quantity,
      received_quantity: item.receivedQuantity ?? 0,
      unit: item.unit,
      unit_price: item.unitPrice,
      discount_amount: item.discountAmount,
      tax_rate: item.taxRate,
      tax_amount: item.taxAmount,
      weight_kg: item.weightKg,
      volume_m3: item.volumeM3,
      manual_overhead: item.manualOverhead,
      allocated_overhead: item.allocatedOverhead,
      effective_unit_cost: item.effectiveUnitCost,
      line_total: item.lineTotal,
    }));

    const { error: itemsError } = await this.supabase
      .from("purchase_invoice_items")
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return invoice;
  }

  async getInvoiceById(tenantId: string, invoiceId: string): Promise<CalculatedPurchaseInvoice | null> {
    const { data: inv, error: invError } = await this.supabase
      .from("purchase_invoices")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", invoiceId)
      .maybeSingle();

    if (invError || !inv) return null;

    const { data: items, error: itemsError } = await this.supabase
      .from("purchase_invoice_items")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("purchase_invoice_id", invoiceId);

    if (itemsError) throw itemsError;

    return {
      id: inv.id,
      tenantId: inv.tenant_id,
      supplierId: inv.supplier_id,
      invoiceNumber: inv.invoice_number,
      invoiceDate: inv.invoice_date,
      subtotal: Number(inv.subtotal),
      taxAmount: Number(inv.tax_amount),
      additionalCosts: Number(inv.additional_costs),
      totalAmount: Number(inv.total_amount),
      allocationMethod: inv.allocation_method,
      status: inv.status,
      receivedAt: inv.received_at,
      receivedBy: inv.received_by,
      notes: inv.notes,
      items: (items || []).map((i) => ({
        id: i.id,
        purchaseInvoiceId: i.purchase_invoice_id,
        tenantId: i.tenant_id,
        itemId: i.item_id,
        itemName: i.item_name,
        itemNature: (i.item_nature as ItemNature) ?? "INVENTORYABLE",
        quantity: Number(i.quantity),
        receivedQuantity: Number(i.received_quantity ?? 0),
        unit: i.unit,
        unitPrice: Number(i.unit_price),
        discountAmount: Number(i.discount_amount),
        taxRate: Number(i.tax_rate),
        taxAmount: Number(i.tax_amount),
        weightKg: i.weight_kg ? Number(i.weight_kg) : undefined,
        volumeM3: i.volume_m3 ? Number(i.volume_m3) : undefined,
        manualOverhead: i.manual_overhead ? Number(i.manual_overhead) : undefined,
        allocatedOverhead: Number(i.allocated_overhead),
        effectiveUnitCost: Number(i.effective_unit_cost),
        lineTotal: Number(i.line_total),
      })),
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
    };
  }

  async listInvoices(tenantId: string, limit = 50): Promise<CalculatedPurchaseInvoice[]> {
    const { data, error } = await this.supabase
      .from("purchase_invoices")
      .select("*, purchase_invoice_items (*)")
      .eq("tenant_id", tenantId)
      .order("invoice_date", { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data) return [];

    return data.map((inv) => ({
      id: inv.id,
      tenantId: inv.tenant_id,
      supplierId: inv.supplier_id,
      invoiceNumber: inv.invoice_number,
      invoiceDate: inv.invoice_date,
      subtotal: Number(inv.subtotal),
      taxAmount: Number(inv.tax_amount),
      additionalCosts: Number(inv.additional_costs),
      totalAmount: Number(inv.total_amount),
      allocationMethod: inv.allocation_method,
      status: inv.status,
      receivedAt: inv.received_at,
      receivedBy: inv.received_by,
      notes: inv.notes,
      items: (inv.purchase_invoice_items || []).map((i: Record<string, unknown>) => ({
        id: String(i.id),
        purchaseInvoiceId: String(i.purchase_invoice_id),
        tenantId: String(i.tenant_id),
        itemId: String(i.item_id),
        itemName: String(i.item_name),
        itemNature: (i.item_nature as ItemNature) ?? "INVENTORYABLE",
        quantity: Number(i.quantity),
        receivedQuantity: Number(i.received_quantity ?? 0),
        unit: String(i.unit),
        unitPrice: Number(i.unit_price),
        discountAmount: Number(i.discount_amount),
        taxRate: Number(i.tax_rate),
        taxAmount: Number(i.tax_amount),
        weightKg: i.weight_kg ? Number(i.weight_kg) : undefined,
        volumeM3: i.volume_m3 ? Number(i.volume_m3) : undefined,
        manualOverhead: i.manual_overhead ? Number(i.manual_overhead) : undefined,
        allocatedOverhead: Number(i.allocated_overhead),
        effectiveUnitCost: Number(i.effective_unit_cost),
        lineTotal: Number(i.line_total),
      })),
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
    }));
  }

  async receiveInvoiceAtomic(input: {
    tenantId: string;
    invoiceId: string;
    receiptId?: string;
    receivedLines?: Array<{ lineId: string; quantity: number }>;
    actorId?: string;
  }): Promise<ReceiptExecutionResult> {
    const { data, error } = await this.supabase.rpc("receive_purchase_invoice_v1", {
      p_tenant_id: input.tenantId,
      p_invoice_id: input.invoiceId,
      p_receipt_id: input.receiptId ?? null,
      p_received_lines: input.receivedLines?.map(({ lineId, quantity }) => ({ line_id: lineId, quantity })) ?? null,
      p_actor_id: input.actorId ?? null,
    });

    if (error) throw error;
    if (!data) {
      throw new Error("RPC receive_purchase_invoice_v1 returned no data");
    }

    const payload = data as Record<string, any>;

    return {
      success: Boolean(payload.success),
      invoiceId: payload.invoice_id,
      status: payload.status,
      receiptId: payload.receipt_id,
      idempotent: Boolean(payload.idempotent),
      summary: {
        itemsProcessed: Number(payload.summary?.items_processed ?? 0),
        totalStockIncrement: Number(payload.summary?.total_stock_increment ?? 0),
        remainingPendingLines: Number(payload.summary?.remaining_pending_lines ?? 0),
      },
      processedLines: (payload.processed_lines || []).map((l: Record<string, unknown>) => ({
        lineId: String(l.line_id),
        itemId: String(l.item_id),
        itemName: String(l.item_name),
        itemNature: (l.item_nature as ItemNature) ?? "INVENTORYABLE",
        receivedQuantity: Number(l.received_quantity ?? 0),
        unit: l.unit ? String(l.unit) : undefined,
        previousStock: l.previous_stock !== undefined ? Number(l.previous_stock) : undefined,
        newStock: l.new_stock !== undefined ? Number(l.new_stock) : undefined,
        previousWac: l.previous_wac !== undefined ? Number(l.previous_wac) : undefined,
        newWac: l.new_wac !== undefined ? Number(l.new_wac) : undefined,
        stockMutated: Boolean(l.stock_mutated),
        notes: l.notes ? String(l.notes) : undefined,
      })),
      message: payload.message ? String(payload.message) : undefined,
    };
  }

  async updateInvoiceStatus(
    tenantId: string,
    invoiceId: string,
    status: PurchaseInvoiceStatus,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("purchase_invoices")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId)
      .eq("id", invoiceId);

    if (error) throw error;
  }

  async recordCostHistory(entries: ItemCostHistoryEntry[]): Promise<void> {
    if (entries.length === 0) return;

    const rows = entries.map((e) => ({
      id: e.id,
      tenant_id: e.tenantId,
      item_id: e.itemId,
      source_invoice_item_id: e.sourceInvoiceItemId,
      supplier_id: e.supplierId,
      unit_price: e.unitPrice,
      allocated_overhead: e.allocatedOverhead,
      effective_unit_cost: e.effectiveUnitCost,
      cost_method: e.costMethod,
      effective_at: e.effectiveAt,
    }));

    const { error } = await this.supabase.from("item_cost_history").insert(rows);
    if (error) throw error;
  }

  async getItemCostHistory(tenantId: string, itemId: string): Promise<ItemCostHistoryEntry[]> {
    const { data, error } = await this.supabase
      .from("item_cost_history")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("item_id", itemId)
      .order("effective_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((d) => ({
      id: d.id,
      tenantId: d.tenant_id,
      itemId: d.item_id,
      sourceInvoiceItemId: d.source_invoice_item_id,
      supplierId: d.supplier_id,
      unitPrice: Number(d.unit_price),
      allocatedOverhead: Number(d.allocated_overhead),
      effectiveUnitCost: Number(d.effective_unit_cost),
      costMethod: d.cost_method,
      effectiveAt: d.effective_at,
    }));
  }

  async getLatestEffectiveCost(tenantId: string, itemId: string): Promise<number | null> {
    const { data, error } = await this.supabase
      .from("item_cost_history")
      .select("effective_unit_cost")
      .eq("tenant_id", tenantId)
      .eq("item_id", itemId)
      .order("effective_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return Number(data.effective_unit_cost);
  }
}
