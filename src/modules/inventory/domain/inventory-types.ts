/**
 * INVENTORY DOMAIN TYPES
 * Definitions for stock balances, WAC valuations, and stock movement records.
 */

export type StockMovementType =
  | "PURCHASE_RECEIPT"
  | "PRODUCTION_CONSUMPTION"
  | "MANUAL_ADJUSTMENT"
  | "WASTE_DISPOSAL";

export type InventoryItemStatus = "available" | "out_of_stock";

export interface InventoryStockItem {
  id: string;
  tenantId: string;
  name: string;
  unit: string;
  stock: number;
  cost: number; // Current WAC / unit cost
  minStock: number;
  wastePercentage: number;
  supplierId?: string | null;
  totalValue: number; // stock * cost
  status: InventoryItemStatus;
}

export interface StockMovementRecord {
  id: string;
  tenantId: string;
  ingredientId: string;
  ingredientName: string;
  ingredientUnit: string;
  movementType: StockMovementType;
  direction: "IN" | "OUT";
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost: number;
  referenceDocumentType: string;
  referenceDocumentId: string;
  receiptId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface StockMovementFilter {
  ingredientId?: string;
  movementType?: string;
  limit?: number;
}

export interface InventorySummary {
  totalIngredients: number;
  inStockCount: number;
  outOfStockCount: number;
  totalValuation: number;
}
