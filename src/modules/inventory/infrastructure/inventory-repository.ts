/**
 * FLOW-04 · Inventory consumption repository (T1)
 *
 * In-memory store for certification — no Supabase, no stock mutation.
 * T2/T3 may replace persistence; Spec forbids stock changes in T1.
 */
import type {
  ConsumptionLine,
  InventoryConsumption,
  ProductionPlanInput,
} from "../domain/inventory-consumption";

export type InventoryRepository = {
  findBySource: (
    tenantId: string,
    deliveryDate: string,
  ) => Promise<InventoryConsumption | null>;
  /** Load production day → plan input (portions + recipes). */
  loadProductionPlanInput: (
    tenantId: string,
    deliveryDate: string,
  ) => Promise<ProductionPlanInput | null>;
  createPlanned: (input: {
    tenantId: string;
    deliveryDate: string;
    lines: ConsumptionLine[];
  }) => Promise<InventoryConsumption>;
};

const store = new Map<string, InventoryConsumption>();
const productionInputs = new Map<string, ProductionPlanInput>();

function sourceKey(tenantId: string, deliveryDate: string): string {
  return `${tenantId}::${deliveryDate}`;
}

function newId(): string {
  return `cons-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Test / driver helper: seed production day needs without Supabase.
 * @internal
 */
export function __seedProductionPlanInput(
  tenantId: string,
  input: ProductionPlanInput,
): void {
  productionInputs.set(sourceKey(tenantId, input.deliveryDate), input);
}

/** @internal vitest */
export function __resetInventoryStoreForTests(): void {
  store.clear();
  productionInputs.clear();
}

export function createInventoryRepository(
  _supabase: unknown,
  _tenantId: string,
): InventoryRepository {
  return {
    async findBySource(tenantId, deliveryDate) {
      return store.get(sourceKey(tenantId, deliveryDate)) ?? null;
    },

    async loadProductionPlanInput(tenantId, deliveryDate) {
      return productionInputs.get(sourceKey(tenantId, deliveryDate)) ?? null;
    },

    async createPlanned({ tenantId, deliveryDate, lines }) {
      const record: InventoryConsumption = {
        id: newId(),
        tenantId,
        deliveryDate,
        status: "planned",
        lines: lines.map((l) => ({ ...l })),
        createdAt: new Date().toISOString(),
      };
      store.set(sourceKey(tenantId, deliveryDate), record);
      return record;
    },
  };
}
