/**
 * YOURMEAL OS — ATOMIC PHYSICAL RECEIPT ENGINE (INCREMENT 1)
 * Pure, deterministic domain logic governing inventory stock increments,
 * WAC recalculation, and prior delivery note reconciliation.
 */

import type {
  PurchaseDocument,
  PhysicalReceiptInput,
  InventoryStockSnapshot,
  ReceiptResult,
  ReceptionStatus,
} from './domain-types';

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

/**
 * Calculates Canonical Weighted Average Cost (WAC).
 * Invariant: If previous stock <= 0, new WAC directly adopts inbound cost.
 */
export function calculateWAC(params: {
  previousStock: number;
  previousWAC: number;
  inboundQuantity: number;
  inboundUnitCost: number;
}): number {
  const { previousStock, previousWAC, inboundQuantity, inboundUnitCost } = params;

  if (inboundQuantity <= 0) {
    return previousWAC;
  }

  if (previousStock <= 0) {
    return Number(inboundUnitCost.toFixed(4));
  }

  const currentTotalValue = previousStock * previousWAC;
  const inboundTotalValue = inboundQuantity * inboundUnitCost;
  const totalStock = previousStock + inboundQuantity;

  return Number(((currentTotalValue + inboundTotalValue) / totalStock).toFixed(4));
}

/**
 * Executes a deterministic physical receipt of goods against a purchase document.
 * This simulates the exact logic executed inside PostgreSQL RPC `receive_purchase_invoice_v1`.
 */
export function executePhysicalReceipt(
  document: PurchaseDocument,
  input: PhysicalReceiptInput,
  currentStockMap: Map<string, InventoryStockSnapshot>,
): {
  updatedDocument: PurchaseDocument;
  result: ReceiptResult;
} {
  if (document.id !== input.documentId) {
    throw new DomainError('INVALID_DOCUMENT', `Document ID mismatch: ${document.id} vs ${input.documentId}`);
  }

  if (document.documentStatus === 'CANCELLED') {
    throw new DomainError('INVALID_STATE', `Cannot receive cancelled document ${document.documentNumber}`);
  }

  const now = input.receptionDate || new Date().toISOString();
  const receptionRef = input.deliveryNoteNumber || document.documentNumber;

  const linesUpdated: ReceiptResult['linesUpdated'] = [];
  const costHistoryEntries: ReceiptResult['costHistoryEntries'] = [];
  const stockMovementEntries: ReceiptResult['stockMovementEntries'] = [];

  // Clone document to avoid mutating input references
  const updatedLines = document.lines.map((l) => ({ ...l }));

  for (const itemInput of input.receivedLines) {
    const line = updatedLines.find((l) => l.id === itemInput.lineId);
    if (!line) {
      throw new DomainError('LINE_NOT_FOUND', `Line item ${itemInput.lineId} not found in document`);
    }

    // INVARIANT 1: Never physically receive services, rent, or utilities into stock
    if (line.itemNature !== 'INVENTORYABLE') {
      throw new DomainError(
        'CANNOT_RECEIVE_SERVICE',
        `Line "${line.description}" has nature "${line.itemNature}". Only INVENTORYABLE items can be received into stock.`,
        { lineId: line.id, itemNature: line.itemNature }
      );
    }

    if (!line.matchedIngredientId) {
      throw new DomainError(
        'UNMAPPED_INGREDIENT',
        `Line "${line.description}" is not mapped to any catalog ingredient. Map before receiving.`,
        { lineId: line.id }
      );
    }

    if (itemInput.quantityReceivedNow < 0) {
      throw new DomainError(
        'INVALID_QUANTITY',
        `Quantity received cannot be negative: ${itemInput.quantityReceivedNow}`,
        { lineId: line.id }
      );
    }

    // INVARIANT 2: Idempotent check — if quantity to receive now is 0, skip stock mutation
    if (itemInput.quantityReceivedNow === 0) {
      continue;
    }

    // Prior Delivery Note Reconciliation:
    // If line is already marked physically received with full quantity (e.g. from prior albarán),
    // do NOT increment stock a second time!
    const alreadyReceived = line.receivedQuantity || 0;
    const remainingToOrder = Math.max(0, line.orderedQuantity - alreadyReceived);

    if (line.isPhysicallyReceived && alreadyReceived >= line.orderedQuantity) {
      // Already fully received previously — idempotent no-op for stock
      continue;
    }

    const qtyToAdd = itemInput.quantityReceivedNow;
    const currentStockInfo = currentStockMap.get(line.matchedIngredientId) || {
      ingredientId: line.matchedIngredientId,
      currentStock: 0,
      currentWAC: line.unitPrice,
    };

    const previousStock = currentStockInfo.currentStock;
    const previousWAC = currentStockInfo.currentWAC;
    const newStock = Number((previousStock + qtyToAdd).toFixed(3));
    const newWAC = calculateWAC({
      previousStock,
      previousWAC,
      inboundQuantity: qtyToAdd,
      inboundUnitCost: line.unitPrice,
    });

    // Update line state
    line.receivedQuantity = Number((alreadyReceived + qtyToAdd).toFixed(3));
    line.isPhysicallyReceived = line.receivedQuantity >= line.orderedQuantity;
    line.receivedAt = now;
    line.receptionNoteRef = receptionRef;

    // Update in-memory stock snapshot map
    currentStockMap.set(line.matchedIngredientId, {
      ingredientId: line.matchedIngredientId,
      currentStock: newStock,
      currentWAC: newWAC,
    });

    linesUpdated.push({
      lineId: line.id,
      ingredientId: line.matchedIngredientId,
      previousStock,
      quantityAdded: qtyToAdd,
      newStock,
      previousWAC,
      newWAC,
    });

    costHistoryEntries.push({
      id: `ich-${Date.now()}-${line.id.slice(0, 6)}`,
      ingredientId: line.matchedIngredientId,
      documentLineId: line.id,
      unitCost: line.unitPrice,
      effectiveWAC: newWAC,
      effectiveAt: now,
    });

    stockMovementEntries.push({
      id: `sm-${Date.now()}-${line.id.slice(0, 6)}`,
      ingredientId: line.matchedIngredientId,
      movementType: 'PURCHASE_RECEIPT',
      quantity: qtyToAdd,
      balanceAfter: newStock,
      referenceDoc: `${document.documentNumber} (${receptionRef})`,
    });
  }

  // Derive new document reception status
  const inventoryableLines = updatedLines.filter((l) => l.itemNature === 'INVENTORYABLE');
  let newReceptionStatus: ReceptionStatus = 'NOT_APPLICABLE';

  if (inventoryableLines.length > 0) {
    const allFullyReceived = inventoryableLines.every((l) => l.isPhysicallyReceived);
    const anyReceived = inventoryableLines.some((l) => (l.receivedQuantity || 0) > 0);

    if (allFullyReceived) {
      newReceptionStatus = 'FULLY_RECEIVED';
    } else if (anyReceived) {
      newReceptionStatus = 'PARTIALLY_RECEIVED';
    } else {
      newReceptionStatus = 'PENDING';
    }
  }

  const updatedDocument: PurchaseDocument = {
    ...document,
    receptionStatus: newReceptionStatus,
    documentStatus: document.documentStatus === 'DRAFT' && newReceptionStatus === 'FULLY_RECEIVED' ? 'VERIFIED' : document.documentStatus,
    lines: updatedLines,
    updatedAt: now,
  };

  const result: ReceiptResult = {
    documentId: document.id,
    receptionStatus: newReceptionStatus,
    linesUpdated,
    costHistoryEntries,
    stockMovementEntries,
  };

  return { updatedDocument, result };
}
