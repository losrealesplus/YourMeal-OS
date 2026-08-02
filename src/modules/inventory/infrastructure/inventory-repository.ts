/**
 * FLOW-04 · Inventory consumption repository (T1–T2)
 *
 * In-memory store for certification — no Supabase.
 * T1: plan only (no stock). T2: apply decrements stock (I2 / I3).
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
  findById: (
    tenantId: string,
    consumptionId: string,
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
  getStock: (tenantId: string, ingredientId: string) => Promise<number>;
  /**
   * Atomically validate I3 then decrement stock and mark applied.
   * Caller enforces I2 (already applied) before calling.
   */
  applyConsumption: (input: {
    tenantId: string;
    consumptionId: string;
  }) => Promise<InventoryConsumption>;
};

const store = new Map<string, InventoryConsumption>();
const byId = new Map<string, InventoryConsumption>();
const productionInputs = new Map<string, ProductionPlanInput>();
/** tenantId::ingredientId → stock */
const stock = new Map<string, number>();

function sourceKey(tenantId: string, deliveryDate: string): string {
  return `${tenantId}::${deliveryDate}`;
}

function stockKey(tenantId: string, ingredientId: string): string {
  return `${tenantId}::${ingredientId}`;
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

/**
 * Test / driver helper: seed ingredient stock.
 * @internal
 */
export function __seedStock(
  tenantId: string,
  ingredientId: string,
  qty: number,
): void {
  stock.set(stockKey(tenantId, ingredientId), qty);
}

/** @internal vitest */
export function __resetInventoryStoreForTests(): void {
  store.clear();
  byId.clear();
  productionInputs.clear();
  stock.clear();
}

export function createInventoryRepository(
  _supabase: unknown,
  _tenantId: string,
): InventoryRepository {
  return {
    async findBySource(tenantId, deliveryDate) {
      return store.get(sourceKey(tenantId, deliveryDate)) ?? null;
    },

    async findById(tenantId, consumptionId) {
      const row = byId.get(consumptionId) ?? null;
      if (!row || row.tenantId !== tenantId) return null;
      return row;
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
      byId.set(record.id, record);
      return record;
    },

    async getStock(tenantId, ingredientId) {
      return stock.get(stockKey(tenantId, ingredientId)) ?? 0;
    },

    async applyConsumption({ tenantId, consumptionId }) {
      const current = byId.get(consumptionId);
      if (!current || current.tenantId !== tenantId) {
        throw new Error(`Consumption ${consumptionId} not found`);
      }
      if (current.status !== "planned") {
        throw new Error(
          `applyConsumption requires status=planned (got ${current.status})`,
        );
      }

      // FLOW04-I3 · validate all lines before any mutation
      for (const line of current.lines) {
        const available = stock.get(stockKey(tenantId, line.ingredientId)) ?? 0;
        if (available - line.qty < 0) {
          const err = new Error("insufficient_stock");
          (err as Error & { code: string }).code = "insufficient_stock";
          (err as Error & { details: Record<string, unknown> }).details = {
            ingredientId: line.ingredientId,
            available,
            required: line.qty,
          };
          throw err;
        }
      }

      for (const line of current.lines) {
        const key = stockKey(tenantId, line.ingredientId);
        const available = stock.get(key) ?? 0;
        stock.set(key, available - line.qty);
      }

      const applied: InventoryConsumption = {
        ...current,
        status: "applied",
        lines: current.lines.map((l) => ({ ...l })),
      };
      store.set(sourceKey(tenantId, current.deliveryDate), applied);
      byId.set(applied.id, applied);
      return applied;
    },
  };
}
