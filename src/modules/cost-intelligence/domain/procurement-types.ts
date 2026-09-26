/**
 * YOURMEAL OS — PROCUREMENT COST TYPES (CR-COST-01)
 * Domain types for purchase invoices, items, and immutable cost history.
 */

import { ProrationMethod } from "./types";

export type PurchaseInvoiceStatus = "draft" | "received" | "posted" | "cancelled";

export interface PurchaseInvoiceItemInput {
  id?: string;
  itemId: string;
  itemName: string;
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
  quantity: number;
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
