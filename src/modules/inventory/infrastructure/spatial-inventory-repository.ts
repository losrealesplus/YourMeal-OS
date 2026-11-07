/**
 * Spatial Inventory Repository (Gate B · PR B1)
 *
 * Provides typed access to spatial topology, multi-center inventory balances,
 * user-center assignments, and backfill execution receipts.
 */
import type {
  ProductionCenter,
  Warehouse,
  InventoryLocation,
  InventoryBalance,
  IngredientStockSummary,
  InventoryBackfillDiscrepancy,
} from "../domain/spatial-topology";

export interface SupabaseLikeClient {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, any>) => any;
}

export interface SpatialInventoryRepository {
  getIngredientBalances(
    tenantId: string,
    ingredientId: string,
    centerId?: string,
  ): Promise<IngredientStockSummary>;

  assignUserToCenter(
    tenantId: string,
    targetUserId: string,
    centerId: string,
  ): Promise<{ success: boolean; user_id: string; center_id: string }>;

  provisionInitialCenter(
    tenantId: string,
    centerName?: string,
  ): Promise<{ success: boolean; center_id: string; warehouse_id: string; location_id: string }>;

  executeBackfill(): Promise<{
    success: boolean;
    total_tenants_processed: number;
    total_balances_migrated: number;
    discrepancies_registered: number;
  }>;

  rollbackBackfill(executionId: string): Promise<{
    success: boolean;
    rolled_back_execution: string;
    deleted_balances_count: number;
    deleted_discrepancies_count: number;
  }>;

  listCenters(tenantId: string): Promise<ProductionCenter[]>;
  listWarehouses(tenantId: string, centerId?: string): Promise<Warehouse[]>;
  listLocations(tenantId: string, warehouseId?: string): Promise<InventoryLocation[]>;
  listDiscrepancies(tenantId: string): Promise<InventoryBackfillDiscrepancy[]>;
}

export function createSpatialInventoryRepository(client: SupabaseLikeClient): SpatialInventoryRepository {
  return {
    async getIngredientBalances(tenantId, ingredientId, centerId) {
      const { data, error } = await client.rpc("get_ingredient_balances_v1", {
        p_tenant_id: tenantId,
        p_ingredient_id: ingredientId,
        p_center_id: centerId ?? null,
      });
      if (error) throw new Error(`get_ingredient_balances_v1 failed: ${error.message || JSON.stringify(error)}`);
      return data as IngredientStockSummary;
    },

    async assignUserToCenter(tenantId, targetUserId, centerId) {
      const { data, error } = await client.rpc("assign_user_to_center_v1", {
        p_tenant_id: tenantId,
        p_target_user_id: targetUserId,
        p_center_id: centerId,
      });
      if (error) throw new Error(`assign_user_to_center_v1 failed: ${error.message || JSON.stringify(error)}`);
      return data;
    },

    async provisionInitialCenter(tenantId, centerName) {
      const { data, error } = await client.rpc("provision_initial_tenant_center_v1", {
        p_tenant_id: tenantId,
        p_center_name: centerName ?? "Centro Principal",
      });
      if (error) throw new Error(`provision_initial_tenant_center_v1 failed: ${error.message || JSON.stringify(error)}`);
      return data;
    },

    async executeBackfill() {
      const { data, error } = await client.rpc("execute_gate_b1_backfill_v1");
      if (error) throw new Error(`execute_gate_b1_backfill_v1 failed: ${error.message || JSON.stringify(error)}`);
      return data;
    },

    async rollbackBackfill(executionId) {
      const { data, error } = await client.rpc("rollback_gate_b1_backfill_v1", {
        p_execution_id: executionId,
      });
      if (error) throw new Error(`rollback_gate_b1_backfill_v1 failed: ${error.message || JSON.stringify(error)}`);
      return data;
    },

    async listCenters(tenantId) {
      const { data, error } = await client
        .from("production_centers")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name");
      if (error) throw new Error(`listCenters failed: ${error.message}`);
      return data as ProductionCenter[];
    },

    async listWarehouses(tenantId, centerId) {
      let query = client
        .from("warehouses")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);
      if (centerId) query = query.eq("center_id", centerId);
      const { data, error } = await query.order("name");
      if (error) throw new Error(`listWarehouses failed: ${error.message}`);
      return data as Warehouse[];
    },

    async listLocations(tenantId, warehouseId) {
      let query = client
        .from("inventory_locations")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);
      if (warehouseId) query = query.eq("warehouse_id", warehouseId);
      const { data, error } = await query.order("code");
      if (error) throw new Error(`listLocations failed: ${error.message}`);
      return data as InventoryLocation[];
    },

    async listDiscrepancies(tenantId) {
      const { data, error } = await client
        .from("inventory_backfill_discrepancies")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(`listDiscrepancies failed: ${error.message}`);
      return data as InventoryBackfillDiscrepancy[];
    },
  };
}
