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

export function generateSecureUuid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      const id = crypto.randomUUID();
      if (isValidUuid(id)) {
        return id;
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("SECURE_UUID_UNAVAILABLE")) {
      throw err;
    }
    throw new Error(`SECURE_UUID_UNAVAILABLE: crypto.randomUUID() failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  throw new Error("SECURE_UUID_UNAVAILABLE: crypto.randomUUID() is not available in the current environment.");
}

function round(val: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export function calculatePurchaseInvoiceTotals(
  input: PurchaseInvoiceInput,
  invoiceId?: string,
): CalculatedPurchaseInvoice {
  if (!input.items || input.items.length === 0) {
    throw new Error("Purchase invoice must contain at least one line item.");
  }

  // Validate or generate invoiceId
  let finalInvoiceId: string;
  if (invoiceId !== undefined) {
    if (!isValidUuid(invoiceId)) {
      throw new Error(`INVALID_UUID: Explicit invoiceId "${invoiceId}" is not a valid UUID.`);
    }
    finalInvoiceId = invoiceId;
  } else if (input.id !== undefined) {
    if (!isValidUuid(input.id)) {
      throw new Error(`INVALID_UUID: input.id "${input.id}" is not a valid UUID.`);
    }
    finalInvoiceId = input.id;
  } else {
    finalInvoiceId = generateSecureUuid();
  }

  // Validate tenantId
  if (!input.tenantId || !isValidUuid(input.tenantId)) {
    throw new Error(`INVALID_UUID: tenantId "${input.tenantId}" is not a valid UUID.`);
  }

  const additionalCosts = Math.max(0, input.additionalCosts ?? 0);
  const allocationMethod: ProrationMethod = input.allocationMethod ?? "value";

  // 1. Validate line values and map items to InboundPurchaseLine for cost-allocator
  const inboundLines: InboundPurchaseLine[] = input.items.map((item, idx) => {
    if (typeof item.quantity !== "number" || isNaN(item.quantity) || item.quantity <= 0) {
      throw new Error(`INVALID_QUANTITY: Line ${idx + 1} ("${item.itemName}") quantity must be greater than zero.`);
    }
    if (typeof item.unitPrice !== "number" || isNaN(item.unitPrice) || item.unitPrice < 0) {
      throw new Error(`INVALID_PRICE: Line ${idx + 1} ("${item.itemName}") unitPrice cannot be negative.`);
    }
    const discount = Math.max(0, item.discountAmount ?? 0);
    const netUnitPrice = Math.max(0, item.unitPrice - (discount > 0 ? discount / item.quantity : 0));

    return {
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: netUnitPrice,
      weightKg: item.weightKg,
      volumeM3: item.volumeM3,
      manualOverhead: item.manualOverhead,
    };
  });

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
      // Line UUID validation or generation
      let lineId: string;
      if (item.id !== undefined) {
        if (!isValidUuid(item.id)) {
          throw new Error(`INVALID_UUID: Line item.id "${item.id}" is not a valid UUID.`);
        }
        lineId = item.id;
      } else {
        lineId = generateSecureUuid();
      }

      // Item Nature & itemId validation
      const itemNature = item.itemNature ?? "INVENTORYABLE";
      let resolvedItemId: string;

      if (itemNature === "INVENTORYABLE") {
        if (!item.itemId || !isValidUuid(item.itemId)) {
          throw new Error(
            `INVALID_INGREDIENT_ID: Inventoryable line "${item.itemName}" requires a valid ingredient UUID itemId (got "${item.itemId}").`
          );
        }
        resolvedItemId = item.itemId;
      } else {
        // EXPENSE_SERVICE
        if (item.itemId !== undefined && item.itemId !== "") {
          if (!isValidUuid(item.itemId)) {
            throw new Error(
              `INVALID_UUID: Expense service line "${item.itemName}" itemId "${item.itemId}" is not a valid UUID.`
            );
          }
          resolvedItemId = item.itemId;
        } else {
          resolvedItemId = generateSecureUuid();
        }
      }

      // Tax rate: Preserve explicit 0% VAT
      let taxRate = 0;
      if (item.taxRate !== undefined && item.taxRate !== null) {
        if (typeof item.taxRate !== "number" || isNaN(item.taxRate) || item.taxRate < 0) {
          throw new Error(`INVALID_TAX_RATE: Line "${item.itemName}" taxRate cannot be negative or invalid.`);
        }
        taxRate = item.taxRate;
      }

      const discount = Math.max(0, item.discountAmount ?? 0);
      const netBaseUnitPrice = Math.max(0, item.unitPrice - (discount > 0 ? discount / item.quantity : 0));
      const lineSubtotal = round(item.quantity * netBaseUnitPrice);
      const lineTax = round((lineSubtotal * taxRate) / 100);

      const allocatedOverhead = allocationResult.lines[idx].allocatedOverhead;
      const effectiveUnitCost = allocationResult.lines[idx].effectiveUnitCost;
      const lineTotal = round(lineSubtotal + lineTax);

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        id: lineId,
        purchaseInvoiceId: finalInvoiceId,
        tenantId: input.tenantId,
        itemId: resolvedItemId,
        itemName: item.itemName,
        itemNature,
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
    id: finalInvoiceId,
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
