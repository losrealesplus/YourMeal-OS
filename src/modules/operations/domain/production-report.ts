import type { KitchenBatchStatus } from "./kitchen-batch-status";
import type {
  AllergenSnapshotState,
  ItemIdentity,
  OrderItemReadModel,
} from "@/modules/orders/domain/order-item-read-model";
import type { OrderDietarySnapshot } from "@/types/dietary";

/**
 * EP-002B — Hoja de Producción (pure aggregation).
 * Groups kitchen lines by dish; customizations stay separate.
 * Never invents quantities or ingredient totals.
 */

export type ProductionSourceLine = {
  orderItemId?: string;
  line?: OrderItemReadModel;
  orderId: string;
  orderStatus: string;
  customerId: string;
  customerName: string | null;
  dishId: string | null;
  dishName: string | null;
  qty: number;
  dayDate: string;
  /** order_items.comment — customization / special note */
  comment: string | null;
  /** CR-CUST-01: Order-level frozen dietary snapshot */
  dietarySnapshot?: OrderDietarySnapshot | null;
};

export type ProductionCustomerLine = Partial<ProductionItemMetadata> & {
  dishName?: string;
  dishId?: string | null;
  allergens?: string[];
  orderId: string;
  orderStatus: string;
  customerId: string;
  customerName: string;
  qty: number;
  note: string | null;
};

export type ProductionDishBlock = Partial<ProductionItemMetadata> & {
  dishId: string | null;
  dishName: string;
  totalQty: number;
  customers: ProductionCustomerLine[];
  /** Digital enrichment — only when known from dish catalog */
  allergens: string[];
  prepMinutes: number | null;
  weightG: number | null;
  /** Distinct order statuses contributing to this block */
  orderStatuses: string[];
  /** EP-002B.2 — lot status for this dish × day (defaults to pending) */
  batchStatus: KitchenBatchStatus;
  batchUpdatedAt: string | null;
};

export type ProductionCustomLine = Partial<ProductionItemMetadata> & {
  orderId: string;
  orderStatus: string;
  customerId: string;
  customerName: string;
  dishId: string | null;
  dishName: string;
  qty: number;
  observation: string;
};

export type ProductionIngredientNeed = {
  ingredientId: string;
  name: string;
  /** Quantity in the recipe's native unit × portions, before display scaling */
  qty: number;
  unit: string;
  /** Display amount (e.g. kg) — null when unit cannot be normalized */
  displayQty: number | null;
  displayUnit: string;
};

export type DishMeta = {
  allergens: string[];
  prepMinutes: number | null;
  weightG: number | null;
};

export type RecipeLine = {
  dishId: string;
  ingredientId: string;
  ingredientName: string;
  qty: number;
  unit: string;
};

export type ProductionPackingCustomerItem = Partial<ProductionItemMetadata> & {
  dishId: string | null;
  dishName: string;
  qty: number;
  comment: string | null;
  allergens: string[];
};

export type ProductionPackingCustomerBlock = {
  customerId: string;
  customerName: string;
  orderId: string;
  orderStatus: string;
  totalPortions: number;
  items: ProductionPackingCustomerItem[];
  specialInstructions: string[];
  dietarySnapshot?: OrderDietarySnapshot | null;
};

export type ProductionPackingDishAllocation = Partial<ProductionItemMetadata> & {
  dishName?: string;
  dishId?: string | null;
  allergens?: string[];
  customerId: string;
  customerName: string;
  orderId: string;
  qty: number;
  comment: string | null;
};

export type ProductionPackingDishBlock = Partial<ProductionItemMetadata> & {
  dishId: string | null;
  dishName: string;
  totalQty: number;
  allergens: string[];
  allocations: ProductionPackingDishAllocation[];
};

export type ProductionReportModel = {
  deliveryDate: string;
  generatedAt: string;
  standardDishes: ProductionDishBlock[];
  customizations: ProductionCustomLine[];
  ingredientSummary: ProductionIngredientNeed[];
  packingByCustomer: ProductionPackingCustomerBlock[];
  packingByDish: ProductionPackingDishBlock[];
  totals: {
    orderCount: number;
    portionCount: number;
    dishCount: number;
    customizationCount: number;
  };
};

export type ProductionItemMetadata = {
  itemIdentity: ItemIdentity;
  kind: "dish" | "custom";
  orderItemId: string | null;
  marker: "PERSONALIZADO" | null;
  metadataSource: "snapshot" | "current_catalogue" | "unavailable";
  allergenState: AllergenSnapshotState;
  recipeState: "CATALOGUE_LINKED" | "NOT_AVAILABLE";
};

/** Aggregate uncertainty conservatively while preserving each source declaration separately. */
function aggregateAllergenState(
  a: AllergenSnapshotState,
  b: AllergenSnapshotState,
): AllergenSnapshotState {
  if (a === "UNKNOWN" || b === "UNKNOWN") return "UNKNOWN";
  if (a === "HISTORICAL_UNAVAILABLE" || b === "HISTORICAL_UNAVAILABLE")
    return "HISTORICAL_UNAVAILABLE";
  return "DECLARED";
}

function itemDetails(line: ProductionSourceLine, meta: ReadonlyMap<string, DishMeta>) {
  const read = line.line;
  const dishId = read ? read.dishId : line.dishId;
  const kind = read?.kind ?? (dishId === null ? "custom" : "dish");
  const orderItemId = read?.orderItemId ?? line.orderItemId ?? null;
  if (
    kind === "custom" &&
    (!orderItemId || orderItemId === "null" || orderItemId === "undefined")
  ) {
    throw new Error("Custom production line requires order item identity");
  }
  if (kind === "custom" && (!read || read.metadataSource !== "snapshot" || !read.name?.trim())) {
    throw new Error("Custom production line requires captured snapshot");
  }
  if (kind === "dish" && (!dishId || dishId === "null" || dishId === "undefined")) {
    throw new Error("Dish production line requires dish identity");
  }
  const dishMeta = dishId === null ? undefined : meta.get(dishId);
  const allergens = kind === "custom" ? [] : (read?.allergensSnapshot ?? dishMeta?.allergens ?? []);
  const metadata: ProductionItemMetadata = {
    itemIdentity: kind === "custom" ? `custom:${orderItemId!}` : `dish:${dishId!}`,
    kind,
    orderItemId,
    marker: kind === "custom" ? "PERSONALIZADO" : null,
    metadataSource: read?.metadataSource ?? (line.dishName ? "current_catalogue" : "unavailable"),
    allergenState:
      kind === "custom" ? "UNKNOWN" : (read?.allergenState ?? "HISTORICAL_UNAVAILABLE"),
    recipeState: kind === "custom" ? "NOT_AVAILABLE" : "CATALOGUE_LINKED",
  };
  return {
    ...metadata,
    dishId,
    dishName:
      kind === "custom"
        ? (read?.name ?? line.dishName ?? "PERSONALIZADO")
        : dishLabel(read?.name ?? line.dishName, dishId!),
    allergens,
    prepMinutes: kind === "custom" ? null : (dishMeta?.prepMinutes ?? null),
    weightG: kind === "custom" ? null : (dishMeta?.weightG ?? null),
  };
}

function isCustomized(comment: string | null | undefined): boolean {
  return Boolean(comment && comment.trim().length > 0);
}

function customerLabel(name: string | null, customerId: string): string {
  const n = name?.trim();
  return n && n.length > 0 ? n : `Cliente ${customerId.slice(0, 8)}`;
}

function dishLabel(name: string | null, dishId: string): string {
  const n = name?.trim();
  return n && n.length > 0 ? n : `Plato ${dishId.slice(0, 8)}`;
}

/**
 * Convert recipe quantity × portions into a kitchen-friendly display.
 * Only scales units we understand; otherwise keep native qty/unit.
 */
export function scaleIngredientNeed(
  qtyPerPortion: number,
  unit: string,
  portions: number,
): Pick<ProductionIngredientNeed, "qty" | "unit" | "displayQty" | "displayUnit"> {
  const raw = qtyPerPortion * portions;
  const u = unit.trim().toLowerCase();

  if (u === "g" || u === "gr" || u === "gram" || u === "grams") {
    return {
      qty: raw,
      unit: "g",
      displayQty: Math.round((raw / 1000) * 1000) / 1000,
      displayUnit: "kg",
    };
  }
  if (u === "kg" || u === "kilo" || u === "kilos") {
    return {
      qty: raw,
      unit: "kg",
      displayQty: Math.round(raw * 1000) / 1000,
      displayUnit: "kg",
    };
  }
  if (u === "ml") {
    return {
      qty: raw,
      unit: "ml",
      displayQty: Math.round((raw / 1000) * 1000) / 1000,
      displayUnit: "L",
    };
  }
  if (u === "l" || u === "lt" || u === "liter" || u === "litre") {
    return {
      qty: raw,
      unit: "L",
      displayQty: Math.round(raw * 1000) / 1000,
      displayUnit: "L",
    };
  }

  return {
    qty: raw,
    unit,
    displayQty: Math.round(raw * 1000) / 1000,
    displayUnit: unit || "u",
  };
}

export function buildProductionReport(input: {
  deliveryDate: string;
  generatedAt?: string;
  lines: readonly ProductionSourceLine[];
  dishMetaById?: ReadonlyMap<string, DishMeta>;
  recipeLines?: readonly RecipeLine[];
  batchStatusByDish?: ReadonlyMap<string, { status: KitchenBatchStatus; updatedAt: string | null }>;
}): ProductionReportModel {
  const meta = input.dishMetaById ?? new Map<string, DishMeta>();
  const standardMap = new Map<
    string,
    {
      details: ReturnType<typeof itemDetails>;
      customers: ProductionCustomerLine[];
      statuses: Set<string>;
    }
  >();
  const customizations: ProductionCustomLine[] = [];
  const orderIds = new Set<string>();
  /** dishId → total portions (standard + custom) for recipe rollup */
  const portionsByDish = new Map<string, number>();
  let portionCount = 0;

  for (const line of input.lines) {
    if (line.qty <= 0) continue;
    orderIds.add(line.orderId);
    portionCount += line.qty;
    const details = itemDetails(line, meta);
    if (details.dishId !== null) {
      portionsByDish.set(details.dishId, (portionsByDish.get(details.dishId) ?? 0) + line.qty);
    }

    const name = customerLabel(line.customerName, line.customerId);
    const dishName = details.dishName;

    if (details.kind === "dish" && isCustomized(line.comment)) {
      customizations.push({
        ...details,
        orderId: line.orderId,
        orderStatus: line.orderStatus,
        customerId: line.customerId,
        customerName: name,
        dishId: details.dishId,
        dishName,
        qty: line.qty,
        observation: line.comment!.trim(),
      });
      continue;
    }

    const block = standardMap.get(details.itemIdentity) ?? {
      details,
      customers: [],
      statuses: new Set<string>(),
    };
    // Keep declarations from captured lines, never overwrite them with catalogue metadata.
    block.details.allergens = [...new Set([...block.details.allergens, ...details.allergens])];
    block.details.allergenState = aggregateAllergenState(
      block.details.allergenState,
      details.allergenState,
    );
    block.statuses.add(line.orderStatus);

    const existing = block.customers.find(
      (c) =>
        c.customerId === line.customerId &&
        c.orderId === line.orderId &&
        c.orderItemId === details.orderItemId,
    );
    if (existing) {
      existing.qty += line.qty;
    } else {
      block.customers.push({
        ...details,
        orderId: line.orderId,
        orderStatus: line.orderStatus,
        customerId: line.customerId,
        customerName: name,
        qty: line.qty,
        note: line.comment?.trim() || null,
      });
    }
    standardMap.set(details.itemIdentity, block);
  }

  const batchMap = input.batchStatusByDish ?? new Map();
  const standardDishes: ProductionDishBlock[] = [...standardMap.entries()]
    .map(([identity, block]) => {
      const totalQty = block.customers.reduce((s, c) => s + c.qty, 0);
      const batch =
        batchMap.get(identity) ??
        (block.details.dishId === null ? undefined : batchMap.get(block.details.dishId));
      return {
        ...block.details,
        totalQty,
        customers: block.customers.sort((a, b) =>
          a.customerName.localeCompare(b.customerName, "es"),
        ),

        orderStatuses: [...block.statuses],
        batchStatus: batch?.status ?? "pending",
        batchUpdatedAt: batch?.updatedAt ?? null,
      };
    })
    .sort((a, b) => a.dishName.localeCompare(b.dishName, "es"));

  customizations.sort((a, b) => {
    const byCustomer = a.customerName.localeCompare(b.customerName, "es");
    if (byCustomer !== 0) return byCustomer;
    return a.dishName.localeCompare(b.dishName, "es");
  });

  const ingredientAcc = new Map<string, { name: string; qty: number; unit: string }>();
  for (const recipe of input.recipeLines ?? []) {
    const portions = portionsByDish.get(recipe.dishId) ?? 0;
    if (portions <= 0) continue;
    const scaled = scaleIngredientNeed(recipe.qty, recipe.unit, portions);
    const key = `${recipe.ingredientId}::${scaled.unit}`;
    const prev = ingredientAcc.get(key);
    if (prev) {
      prev.qty += scaled.qty;
    } else {
      ingredientAcc.set(key, {
        name: recipe.ingredientName,
        qty: scaled.qty,
        unit: scaled.unit,
      });
    }
  }

  const ingredientSummary: ProductionIngredientNeed[] = [...ingredientAcc.entries()]
    .map(([key, row]) => {
      const ingredientId = key.split("::")[0]!;
      const display = scaleIngredientNeed(row.qty, row.unit, 1);
      return {
        ingredientId,
        name: row.name,
        qty: row.qty,
        unit: row.unit,
        displayQty: display.displayQty,
        displayUnit: display.displayUnit,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  // 1. Packing by Customer
  const customerPackingMap = new Map<string, ProductionPackingCustomerBlock>();
  for (const line of input.lines) {
    if (line.qty <= 0) continue;
    const name = customerLabel(line.customerName, line.customerId);
    const details = itemDetails(line, meta);
    const { dishName, allergens } = details;
    const customerKey = `${line.customerId}::${line.orderId}`;

    let block = customerPackingMap.get(customerKey);
    if (!block) {
      block = {
        customerId: line.customerId,
        customerName: name,
        orderId: line.orderId,
        orderStatus: line.orderStatus,
        totalPortions: 0,
        items: [],
        specialInstructions: [],
        dietarySnapshot: line.dietarySnapshot ?? null,
      };
      customerPackingMap.set(customerKey, block);
    }

    block.totalPortions += line.qty;
    block.items.push({
      ...details,
      dishId: details.dishId,
      dishName,
      qty: line.qty,
      comment: line.comment?.trim() || null,
      allergens,
    });
    if (line.comment?.trim() && !block.specialInstructions.includes(line.comment.trim())) {
      block.specialInstructions.push(line.comment.trim());
    }
  }

  const packingByCustomer: ProductionPackingCustomerBlock[] = [...customerPackingMap.values()].sort(
    (a, b) => a.customerName.localeCompare(b.customerName, "es"),
  );

  // 2. Packing by Dish
  const dishPackingMap = new Map<string, ProductionPackingDishBlock>();
  for (const line of input.lines) {
    if (line.qty <= 0) continue;
    const name = customerLabel(line.customerName, line.customerId);
    const details = itemDetails(line, meta);
    const { dishName, allergens } = details;

    let block = dishPackingMap.get(details.itemIdentity);
    if (!block) {
      block = {
        ...details,
        dishId: details.dishId,
        dishName,
        totalQty: 0,
        allergens,
        allocations: [],
      };
      dishPackingMap.set(details.itemIdentity, block);
    }

    block.allergens = [...new Set([...block.allergens, ...allergens])];
    block.allergenState = aggregateAllergenState(
      block.allergenState ?? "HISTORICAL_UNAVAILABLE",
      details.allergenState,
    );
    block.totalQty += line.qty;
    block.allocations.push({
      ...details,
      customerId: line.customerId,
      customerName: name,
      orderId: line.orderId,
      qty: line.qty,
      comment: line.comment?.trim() || null,
    });
  }

  const packingByDish: ProductionPackingDishBlock[] = [...dishPackingMap.values()].sort((a, b) =>
    a.dishName.localeCompare(b.dishName, "es"),
  );

  return {
    deliveryDate: input.deliveryDate,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    standardDishes,
    customizations,
    ingredientSummary,
    packingByCustomer,
    packingByDish,
    totals: {
      orderCount: orderIds.size,
      portionCount,
      dishCount: standardDishes.length,
      customizationCount: customizations.length,
    },
  };
}
