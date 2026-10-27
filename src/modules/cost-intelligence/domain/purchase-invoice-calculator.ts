/**
 * YOURMEAL OS — PURCHASE INVOICE CALCULATOR (CR-COST-01)
 * Pure domain math for computing purchase invoice totals, line item taxes,
 * and prorated effective acquisition costs.
 */

import { allocateInboundCosts } from "./cost-allocator";
import { InboundPurchaseLine, ProrationMethod } from "./types";
import {
  CalculatedPurchaseInvoice,
  CalculatedPurchaseInvoiceItem,
  PurchaseInvoiceInput,
} from "./procurement-types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: unknown): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "00000000-0000-4000-8000-000000000000";
}

function round(val: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export function calculatePurchaseInvoiceTotals(
  input: PurchaseInvoiceInput,
  invoiceId: string = (input.id && isValidUuid(input.id))
    ? input.id
    : (input.id ? input.id : generateUuid()),
): CalculatedPurchaseInvoice {
  if (!input.items || input.items.length === 0) {
    throw new Error("Purchase invoice must contain at least one line item.");
  }

  const additionalCosts = Math.max(0, input.additionalCosts ?? 0);
  const allocationMethod: ProrationMethod = input.allocationMethod ?? "value";

  // 1. Map items to InboundPurchaseLine for cost-allocator
  const inboundLines: InboundPurchaseLine[] = input.items.map((item) => ({
    itemId: item.itemId,
    itemName: item.itemName,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: Math.max(0, item.unitPrice - (item.discountAmount ? item.discountAmount / item.quantity : 0)),
    weightKg: item.weightKg,
    volumeM3: item.volumeM3,
    manualOverhead: item.manualOverhead,
  }));

  // 2. Allocate additional inbound overheads
  const allocationResult = allocateInboundCosts(
    inboundLines,
    additionalCosts,
    allocationMethod,
  );

  let subtotal = 0;
  let taxAmount = 0;

  const calculatedItems: CalculatedPurchaseInvoiceItem[] = input.items.map(
    (item, idx) => {
      const discount = Math.max(0, item.discountAmount ?? 0);
      const netBaseUnitPrice = Math.max(0, item.unitPrice - (discount > 0 ? discount / item.quantity : 0));
      const lineSubtotal = round(item.quantity * netBaseUnitPrice);
      const taxRate = Math.max(0, item.taxRate ?? 0);
      const lineTax = round((lineSubtotal * taxRate) / 100);

      const allocatedOverhead = allocationResult.lines[idx].allocatedOverhead;
      const effectiveUnitCost = allocationResult.lines[idx].effectiveUnitCost;
      const lineTotal = round(lineSubtotal + lineTax);

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        id: (item.id && isValidUuid(item.id)) ? item.id : (item.id ? item.id : generateUuid()),
        purchaseInvoiceId: invoiceId,
        tenantId: input.tenantId,
        itemId: item.itemId,
        itemName: item.itemName,
        itemNature: item.itemNature ?? "INVENTORYABLE",
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discountAmount: discount,
        taxRate,
        taxAmount: lineTax,
        weightKg: item.weightKg,
        volumeM3: item.volumeM3,
        manualOverhead: item.manualOverhead,
        allocatedOverhead,
        effectiveUnitCost,
        lineTotal,
      };
    },
  );

  subtotal = round(subtotal);
  taxAmount = round(taxAmount);
  const totalAmount = round(subtotal + taxAmount + additionalCosts);

  return {
    id: invoiceId,
    tenantId: input.tenantId,
    supplierId: input.supplierId,
    invoiceNumber: input.invoiceNumber,
    invoiceDate: input.invoiceDate,
    subtotal,
    taxAmount,
    additionalCosts,
    totalAmount,
    allocationMethod,
    status: "draft",
    notes: input.notes,
    items: calculatedItems,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
