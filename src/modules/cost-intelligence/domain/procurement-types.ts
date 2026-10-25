/**
 * YOURMEAL OS — PROCUREMENT COST TYPES (CR-COST-01)
 * Domain types for purchase invoices, items, and immutable cost history.
 */

import { ProrationMethod } from "./types";

export type PurchaseInvoiceStatus =
  | "draft"
  | "partially_received"
  | "received"
  | "posted"
  | "cancelled";

export type ItemNature = "INVENTORYABLE" | "EXPENSE_SERVICE" | "CAPEX_ASSET";

export interface PurchaseInvoiceItemInput {
  id?: string;
  itemId: string;
  itemName: string;
  itemNature?: ItemNature;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number; // e.g. 10.0 for 10% IVA
  weightKg?: number;
  volumeM3?: number;
  manualOverhead?: number;
}

export interface PurchaseInvoiceInput {
  id?: string;
  tenantId: string;
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  additionalCosts?: number; // Portes, seguros, tasas
  allocationMethod?: ProrationMethod;
  notes?: string;
  items: PurchaseInvoiceItemInput[];
}

export interface CalculatedPurchaseInvoiceItem {
  id: string;
  purchaseInvoiceId: string;
  tenantId: string;
  itemId: string;
  itemName: string;
  itemNature?: ItemNature;
  quantity: number;
  receivedQuantity?: number;
  unit: string;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  weightKg?: number;
  volumeM3?: number;
  manualOverhead?: number;
  allocatedOverhead: number;
  effectiveUnitCost: number;
  lineTotal: number;
}

export interface CalculatedPurchaseInvoice {
  id: string;
  tenantId: string;
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  subtotal: number;
  taxAmount: number;
  additionalCosts: number;
  totalAmount: number;
  allocationMethod: ProrationMethod;
  status: PurchaseInvoiceStatus;
  receivedAt?: string;
  receivedBy?: string;
  notes?: string;
  items: CalculatedPurchaseInvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ItemCostHistoryEntry {
  id: string;
  tenantId: string;
  itemId: string;
  sourceInvoiceItemId?: string;
  supplierId?: string;
  unitPrice: number;
  allocatedOverhead: number;
  effectiveUnitCost: number;
  costMethod: "effective_purchase" | "weighted_average" | "standard";
  effectiveAt: string;
}

export interface ReceiptExecutionLineResult {
  lineId: string;
  itemId: string;
  itemName: string;
  itemNature: ItemNature;
  receivedQuantity: number;
  unit?: string;
  previousStock?: number;
  newStock?: number;
  previousWac?: number;
  newWac?: number;
  stockMutated: boolean;
  notes?: string;
}

export interface ReceiptExecutionResult {
  success: boolean;
  invoiceId: string;
  status: PurchaseInvoiceStatus;
  receiptId: string;
  idempotent: boolean;
  summary: {
    itemsProcessed: number;
    totalStockIncrement: number;
    remainingPendingLines: number;
  };
  processedLines: ReceiptExecutionLineResult[];
  message?: string;
}

export interface ReceiptPreviewLine {
  lineId: string;
  itemId: string;
  itemName: string;
  itemNature: ItemNature;
  quantityToReceive: number;
  unit: string;
  currentStock: number;
  predictedNewStock: number;
  currentWac: number;
  predictedNewWac: number;
  stockMutated: boolean;
  unitConversionWarning?: string;
}

export interface ReceiptPreviewResult {
  invoiceId: string;
  invoiceNumber: string;
  supplierId: string;
  lines: ReceiptPreviewLine[];
  totalStockIncrement: number;
  hasServices: boolean;
  hasInventoryItems: boolean;
}
