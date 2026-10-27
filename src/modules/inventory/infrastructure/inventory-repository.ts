/**
 * FLOW-04 · Inventory consumption repository (T1–T2–T3)
 *
 * Dual-mode adapter:
 * - PostgreSQL/Supabase persistence when a client with `.from` and `.rpc` is provided.
 * - In-memory fallback for offline test certification and unit isolation.
 *
 * Spec: docs/00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md (FROZEN)
 */
import type {
  ConsumptionLine,
  InventoryConsumption,
  ProductionPlanInput,
} from "../domain/inventory-consumption";
import type {
  InventoryStockItem,
  StockMovementRecord,
  StockMovementFilter,
} from "../domain/inventory-types";

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
    actorId?: string;
  }) => Promise<InventoryConsumption>;
  getStock: (tenantId: string, ingredientId: string) => Promise<number>;
  /**
   * Atomically validate I3 then decrement stock and mark applied.
   * Caller enforces I2 (already applied) before calling.
   */
  applyConsumption: (input: {
    tenantId: string;
    consumptionId: string;
    actorId?: string;
  }) => Promise<InventoryConsumption>;
  /** T3 · mark applied → sealed (no stock mutation). */
  sealConsumption: (input: {
    tenantId: string;
    consumptionId: string;
    actorId?: string;
  }) => Promise<InventoryConsumption>;
  listInventoryStock: (tenantId: string) => Promise<InventoryStockItem[]>;
  listStockMovements: (
    tenantId: string,
    filter?: StockMovementFilter,
  ) => Promise<StockMovementRecord[]>;
};

// ============================================================================
// IN-MEMORY STORE (FROZEN SPEC CERTIFICATION FALLBACK)
// ============================================================================
const store = new Map<string, InventoryConsumption>();
const byId = new Map<string, InventoryConsumption>();
const productionInputs = new Map<string, ProductionPlanInput>();
/** tenantId::ingredientId → stock */
const stock = new Map<string, number>();
const inMemoryIngredients = new Map<string, InventoryStockItem>();
const inMemoryMovements: StockMovementRecord[] = [];

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

/**
 * Test / driver helper: seed ingredient for stock listing.
 * @internal
 */
export function __seedIngredient(
  tenantId: string,
  item: InventoryStockItem,
): void {
  inMemoryIngredients.set(`${tenantId}::${item.id}`, { ...item, tenantId });
}

/**
 * Test / driver helper: seed stock movement record.
 * @internal
 */
export function __seedStockMovement(movement: StockMovementRecord): void {
  inMemoryMovements.push(movement);
}

/** @internal vitest */
export function __resetInventoryStoreForTests(): void {
  store.clear();
  byId.clear();
  productionInputs.clear();
  stock.clear();
  inMemoryIngredients.clear();
  inMemoryMovements.length = 0;
}

function isSupabaseClient(client: unknown): boolean {
  if (typeof client !== "object" || client === null) return false;
  const c = client as Record<string, unknown>;
  const hasFrom = "from" in c || typeof c.from === "function";
  const hasRpc = "rpc" in c || typeof c.rpc === "function";
  return hasFrom && hasRpc && typeof c.from === "function" && typeof c.rpc === "function";
}

function createPostgresInventoryRepository(client: any): InventoryRepository {
  async function findById(
    tenantId: string,
    consumptionId: string,
  ): Promise<InventoryConsumption | null> {
    const { data: cons, error } = await client
      .from("inventory_consumptions")
      .select("id, tenant_id, delivery_date, status, created_at")
      .eq("id", consumptionId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!cons) return null;

    const { data: lines, error: linesErr } = await client
      .from("inventory_consumption_lines")
      .select("ingredient_id, ingredient_name, quantity, unit")
      .eq("tenant_id", tenantId)
      .eq("consumption_id", cons.id)
      .order("ingredient_id", { ascending: true });

    if (linesErr) throw new Error(linesErr.message);

    return {
      id: cons.id,
      tenantId: cons.tenant_id,
      deliveryDate: cons.delivery_date,
      status: cons.status,
      createdAt: cons.created_at,
      lines: (lines || []).map((l: any) => ({
        ingredientId: l.ingredient_id,
        name: l.ingredient_name,
        qty: Number(l.quantity),
        unit: l.unit,
      })),
    };
  }

  return {
    async findBySource(tenantId, deliveryDate) {
      const { data: cons, error } = await client
        .from("inventory_consumptions")
        .select("id, tenant_id, delivery_date, status, created_at")
        .eq("tenant_id", tenantId)
        .eq("delivery_date", deliveryDate)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!cons) return null;

      const { data: lines, error: linesErr } = await client
        .from("inventory_consumption_lines")
        .select("ingredient_id, ingredient_name, quantity, unit")
        .eq("tenant_id", tenantId)
        .eq("consumption_id", cons.id)
        .order("ingredient_id", { ascending: true });

      if (linesErr) throw new Error(linesErr.message);

      return {
        id: cons.id,
        tenantId: cons.tenant_id,
        deliveryDate: cons.delivery_date,
        status: cons.status,
        createdAt: cons.created_at,
        lines: (lines || []).map((l: any) => ({
          ingredientId: l.ingredient_id,
          name: l.ingredient_name,
          qty: Number(l.quantity),
          unit: l.unit,
        })),
      };
    },

    findById,

    async loadProductionPlanInput(tenantId, deliveryDate) {
      const { data: rawItems, error: itemsErr } = await client
        .from("order_items")
        .select(`
          dish_id,
          qty,
          item_kind,
          orders (
            id,
            status,
            deleted_at
          )
        `)
        .eq("tenant_id", tenantId)
        .eq("day_date", deliveryDate)
        .eq("item_kind", "dish")
        .is("deleted_at", null);

      if (itemsErr) throw new Error(itemsErr.message);

      const AUTHORIZED_PRODUCTION_STATUSES = new Set([
        "confirmed",
        "in_production",
        "prepared",
        "ready_for_delivery",
        "out_for_delivery",
        "delivered",
      ]);

      const validItems = (rawItems || []).filter((item: any) => {
        const o = item.orders;
        return (
          o &&
          o.deleted_at === null &&
          o.status !== "draft" &&
          o.status !== "cancelled" &&
          AUTHORIZED_PRODUCTION_STATUSES.has(o.status) &&
          item.dish_id
        );
      });

      const portionsByDish = new Map<string, number>();
      for (const item of validItems) {
        const dishId = item.dish_id;
        const qty = Number(item.qty) || 0;
        if (qty > 0) {
          portionsByDish.set(dishId, (portionsByDish.get(dishId) || 0) + qty);
        }
      }

      if (portionsByDish.size === 0) {
        return null;
      }

      const dishIds = Array.from(portionsByDish.keys());

      const { data: dishIngs, error: diErr } = await client
        .from("dish_ingredients")
        .select(`
          dish_id,
          ingredient_id,
          qty,
          unit,
          ingredients (
            id,
            name,
            deleted_at
          )
        `)
        .eq("tenant_id", tenantId)
        .in("dish_id", dishIds);

      if (diErr) throw new Error(diErr.message);

      const activeRecipes = (dishIngs || [])
        .filter((di: any) => di.ingredients && di.ingredients.deleted_at === null)
        .map((di: any) => ({
          dishId: di.dish_id,
          ingredientId: di.ingredient_id,
          ingredientName: di.ingredients?.name || "Ingrediente",
          qty: Number(di.qty),
          unit: di.unit,
        }));

      return {
        deliveryDate,
        dishes: Array.from(portionsByDish.entries()).map(
          ([dishId, portions]) => ({
            dishId,
            portions,
          }),
        ),
        recipes: activeRecipes,
      };
    },

    async createPlanned({ tenantId, deliveryDate, lines, actorId }) {
      const linesPayload = lines.map((l) => ({
        ingredient_id: l.ingredientId,
        ingredient_name: l.name,
        quantity: Number(l.qty.toFixed(3)),
        unit: l.unit,
      }));

      const { data, error } = await client.rpc(
        "create_inventory_consumption_plan_v1",
        {
          p_tenant_id: tenantId,
          p_delivery_date: deliveryDate,
          p_lines: linesPayload,
          p_actor_id: actorId || null,
        },
      );

      if (error) throw new Error(error.message);
      const res = data as any;
      if (!res?.success) {
        throw new Error(res?.error || "Failed to create inventory consumption plan");
      }

      const cons = await findById(tenantId, res.consumption_id);
      if (!cons) {
        throw new Error(`Created consumption plan ${res.consumption_id} not found`);
      }

      return cons;
    },

    async getStock(tenantId, ingredientId) {
      const { data, error } = await client
        .from("ingredients")
        .select("stock")
        .eq("tenant_id", tenantId)
        .eq("id", ingredientId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data ? Number(data.stock) : 0;
    },

    async applyConsumption({ tenantId, consumptionId, actorId }) {
      const { error } = await client.rpc(
        "apply_inventory_consumption_v1",
        {
          p_tenant_id: tenantId,
          p_consumption_id: consumptionId,
          p_actor_id: actorId || null,
        },
      );

      if (error) {
        const msg = error.message || String(error);
        if (msg.includes("insufficient_stock")) {
          const domainErr = new Error("insufficient_stock");
          (domainErr as any).code = "insufficient_stock";
          (domainErr as any).details = { message: msg };
          throw domainErr;
        }
        throw new Error(msg);
      }

      const updated = await findById(tenantId, consumptionId);
      if (!updated) {
        throw new Error(`Consumption ${consumptionId} not found after apply`);
      }
      return updated;
    },

    async sealConsumption({ tenantId, consumptionId, actorId }) {
      const { error } = await client.rpc(
        "seal_inventory_consumption_v1",
        {
          p_tenant_id: tenantId,
          p_consumption_id: consumptionId,
          p_actor_id: actorId || null,
        },
      );

      if (error) {
        throw new Error(error.message || String(error));
      }

      const updated = await findById(tenantId, consumptionId);
      if (!updated) {
        throw new Error(`Consumption ${consumptionId} not found after seal`);
      }
      return updated;
    },

    async listInventoryStock(tenantId: string): Promise<InventoryStockItem[]> {
      const { data, error } = await client
        .from("ingredients")
        .select("id, tenant_id, name, unit, cost, stock, min_stock, waste_percentage, supplier_id")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      return (data || []).map((row: any) => {
        const stock = Number(row.stock || 0);
        const cost = Number(row.cost || 0);
        return {
          id: row.id,
          tenantId: row.tenant_id,
          name: row.name,
          unit: row.unit || "kg",
          stock,
          cost,
          minStock: Number(row.min_stock || 0),
          wastePercentage: Number(row.waste_percentage || 0),
          supplierId: row.supplier_id,
          totalValue: Math.round(stock * cost * 100) / 100,
          status: stock > 0 ? "available" : "out_of_stock",
        };
      });
    },

    async listStockMovements(
      tenantId: string,
      filter?: StockMovementFilter,
    ): Promise<StockMovementRecord[]> {
      let query = client
        .from("stock_movements")
        .select(`
          id,
          tenant_id,
          ingredient_id,
          movement_type,
          quantity,
          previous_stock,
          new_stock,
          unit_cost,
          reference_document_type,
          reference_document_id,
          receipt_id,
          notes,
          created_at,
          ingredient:ingredients(id, name, unit)
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (filter?.ingredientId) {
        query = query.eq("ingredient_id", filter.ingredientId);
      }
      if (filter?.movementType) {
        query = query.eq("movement_type", filter.movementType);
      }
      if (filter?.limit) {
        query = query.limit(filter.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return (data || []).map((row: any) => {
        const ing = Array.isArray(row.ingredient) ? row.ingredient[0] : row.ingredient;
        const qty = Number(row.quantity || 0);
        const prev = Number(row.previous_stock || 0);
        const next = Number(row.new_stock || 0);
        const isEntry = row.movement_type === "PURCHASE_RECEIPT" || next > prev;

        return {
          id: row.id,
          tenantId: row.tenant_id,
          ingredientId: row.ingredient_id,
          ingredientName: ing?.name || "Ingrediente Desconocido",
          ingredientUnit: ing?.unit || "kg",
          movementType: row.movement_type,
          direction: isEntry ? "IN" : "OUT",
          quantity: qty,
          previousStock: prev,
          newStock: next,
          unitCost: Number(row.unit_cost || 0),
          referenceDocumentType: row.reference_document_type,
          referenceDocumentId: row.reference_document_id,
          receiptId: row.receipt_id,
          notes: row.notes,
          createdAt: row.created_at,
        };
      });
    },
  };
}

export function createInventoryRepository(
  supabase: unknown,
  _tenantId: string,
): InventoryRepository {
  if (isSupabaseClient(supabase)) {
    return createPostgresInventoryRepository(supabase);
  }

  // Pure unit-test double: permitted ONLY when supabase is null/undefined or an empty test double {}
  const isUnitTestDouble =
    supabase === null ||
    supabase === undefined ||
    (typeof supabase === "object" &&
      Object.keys(supabase as object).length === 0 &&
      !("from" in (supabase as object)));

  if (isUnitTestDouble) {
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
        const previous = store.get(sourceKey(tenantId, deliveryDate));
        if (previous) {
          const canonical = (rows: ConsumptionLine[]) => JSON.stringify(rows
            .map(({ ingredientId, qty, unit }) => ({ ingredientId, qty, unit }))
            .sort((a, b) => a.ingredientId.localeCompare(b.ingredientId) || a.unit.localeCompare(b.unit)));
          if (canonical(previous.lines) !== canonical(lines)) {
            throw new Error("Existing consumption plan differs from canonical production");
          }
          return previous;
        }
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

      async sealConsumption({ tenantId, consumptionId }) {
        const current = byId.get(consumptionId);
        if (!current || current.tenantId !== tenantId) {
          throw new Error(`Consumption ${consumptionId} not found`);
        }
        if (current.status === "sealed") {
          return current;
        }
        if (current.status !== "applied") {
          throw new Error(
            `sealConsumption requires status=applied (got ${current.status})`,
          );
        }
        const sealed: InventoryConsumption = {
          ...current,
          status: "sealed",
          lines: current.lines.map((l) => ({ ...l })),
        };
        store.set(sourceKey(tenantId, current.deliveryDate), sealed);
        byId.set(sealed.id, sealed);
        return sealed;
      },

      async listInventoryStock(tenantId) {
        return Array.from(inMemoryIngredients.values()).filter(
          (item) => item.tenantId === tenantId,
        );
      },

      async listStockMovements(tenantId, filter) {
        return inMemoryMovements
          .filter((m) => {
            if (m.tenantId !== tenantId) return false;
            if (filter?.ingredientId && m.ingredientId !== filter.ingredientId) return false;
            if (filter?.movementType && m.movementType !== filter.movementType) return false;
            return true;
          })
          .slice(0, filter?.limit || 100);
      },
    };
  }

  throw new Error(
    "Invalid Supabase client provided to createInventoryRepository: expected valid Supabase client with from() and rpc(). Fallback to in-memory store is forbidden in non-test contexts.",
  );
}
