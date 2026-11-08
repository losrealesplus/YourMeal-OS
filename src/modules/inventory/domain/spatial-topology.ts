/**
 * Domain Models for Spatial Inventory Topology (Gate B · PR B1)
 *
 * Implements the 4-level spatial hierarchy:
 * Tenant -> Production Center -> Warehouse -> Location -> Inventory Balance
 */

export type WarehouseType =
  | 'DRY_STORAGE'
  | 'COLD_ROOM'
  | 'FREEZER'
  | 'KITCHEN_STAGE'
  | 'TRANSIT';

export interface ProductionCenter {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  tenant_id: string;
  center_id: string;
  code: string;
  name: string;
  warehouse_type: WarehouseType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryLocation {
  id: string;
  tenant_id: string;
  center_id: string;
  warehouse_id: string;
  code: string;
  name: string;
  is_default: boolean;
  is_transit: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryBalance {
  id: string;
  tenant_id: string;
  center_id: string;
  warehouse_id: string;
  location_id: string;
  ingredient_id: string;
  stock_quantity: number;
  updated_at: string;
}

export interface UserCenterAssignment {
  id: string;
  tenant_id: string;
  user_id: string;
  center_id: string;
  assigned_at: string;
  assigned_by?: string | null;
}

export type BackfillDiscrepancyStatus =
  | 'PENDING_AUDIT_REGULARIZATION'
  | 'RESOLVED_BY_ADJUSTMENT'
  | 'RESOLVED_BY_RECEIPT';

export interface InventoryBackfillDiscrepancy {
  id: string;
  tenant_id: string;
  ingredient_id: string;
  legacy_stock_quantity: number;
  initialized_physical_stock: number;
  discrepancy_quantity: number;
  status: BackfillDiscrepancyStatus;
  notes: string;
  created_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

export interface IngredientStockSummary {
  ingredient_id: string;
  total_stock: number;
  locations: Array<{
    center_id: string;
    center_name: string;
    warehouse_id: string;
    warehouse_name: string;
    location_id: string;
    location_code: string;
    stock_quantity: number;
    updated_at: string;
  }>;
}

/**
 * Domain invariant: physical stock cannot be negative.
 * If kitchen consumes beyond available balance, balance becomes 0.000
 * and deficit is logged in an operational exception table (PR B3).
 */
export function assertNonNegativePhysicalStock(stock: number): void {
  if (stock < 0) {
    throw new Error(
      `PHYSICAL_STOCK_CANNOT_BE_NEGATIVE: Quantity ${stock} violates physical non-negativity constraint.`,
    );
  }
}
