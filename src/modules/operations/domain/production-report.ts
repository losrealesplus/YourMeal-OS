/**
 * EP-002B — Hoja de Producción (pure aggregation).
 * Groups kitchen lines by dish; customizations stay separate.
 * Never invents quantities or ingredient totals.
 */

export type ProductionSourceLine = {
  orderId: string;
  orderStatus: string;
  customerId: string;
  customerName: string | null;
  dishId: string;
  dishName: string | null;
  qty: number;
  dayDate: string;
  /** order_items.comment — customization / special note */
  comment: string | null;
};

export type ProductionCustomerLine = {
  orderId: string;
  orderStatus: string;
  customerId: string;
  customerName: string;
  qty: number;
  note: string | null;
};

export type ProductionDishBlock = {
  dishId: string;
  dishName: string;
  totalQty: number;
  customers: ProductionCustomerLine[];
  /** Digital enrichment — only when known from dish catalog */
  allergens: string[];
  prepMinutes: number | null;
  weightG: number | null;
  /** Distinct order statuses contributing to this block */
  orderStatuses: string[];
};

export type ProductionCustomLine = {
  orderId: string;
  orderStatus: string;
  customerId: string;
  customerName: string;
  dishId: string;
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

export type ProductionReportModel = {
  deliveryDate: string;
  generatedAt: string;
  standardDishes: ProductionDishBlock[];
  customizations: ProductionCustomLine[];
  ingredientSummary: ProductionIngredientNeed[];
  totals: {
    orderCount: number;
    portionCount: number;
    dishCount: number;
    customizationCount: number;
  };
};

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
}): ProductionReportModel {
  const meta = input.dishMetaById ?? new Map<string, DishMeta>();
  const standardMap = new Map<
    string,
    {
      dishName: string;
      customers: ProductionCustomerLine[];
      statuses: Set<string>;
    }
  >();
  const customizations: ProductionCustomLine[] = [];
  const orderIds = new Set<string>();
  /** dishId → total portions (standard + custom) for recipe rollup */
  const portionsByDish = new Map<string, number>();

  for (const line of input.lines) {
    if (line.qty <= 0) continue;
    orderIds.add(line.orderId);
    portionsByDish.set(
      line.dishId,
      (portionsByDish.get(line.dishId) ?? 0) + line.qty,
    );

    const name = customerLabel(line.customerName, line.customerId);
    const dishName = dishLabel(line.dishName, line.dishId);

    if (isCustomized(line.comment)) {
      customizations.push({
        orderId: line.orderId,
        orderStatus: line.orderStatus,
        customerId: line.customerId,
        customerName: name,
        dishId: line.dishId,
        dishName,
        qty: line.qty,
        observation: line.comment!.trim(),
      });
      continue;
    }

    const block = standardMap.get(line.dishId) ?? {
      dishName,
      customers: [],
      statuses: new Set<string>(),
    };
    block.dishName = dishName;
    block.statuses.add(line.orderStatus);

    const existing = block.customers.find(
      (c) => c.customerId === line.customerId && c.orderId === line.orderId,
    );
    if (existing) {
      existing.qty += line.qty;
    } else {
      block.customers.push({
        orderId: line.orderId,
        orderStatus: line.orderStatus,
        customerId: line.customerId,
        customerName: name,
        qty: line.qty,
        note: null,
      });
    }
    standardMap.set(line.dishId, block);
  }

  const standardDishes: ProductionDishBlock[] = [...standardMap.entries()]
    .map(([dishId, block]) => {
      const totalQty = block.customers.reduce((s, c) => s + c.qty, 0);
      const dishMeta = meta.get(dishId);
      return {
        dishId,
        dishName: block.dishName,
        totalQty,
        customers: block.customers.sort((a, b) =>
          a.customerName.localeCompare(b.customerName, "es"),
        ),
        allergens: dishMeta?.allergens ?? [],
        prepMinutes: dishMeta?.prepMinutes ?? null,
        weightG: dishMeta?.weightG ?? null,
        orderStatuses: [...block.statuses],
      };
    })
    .sort((a, b) => a.dishName.localeCompare(b.dishName, "es"));

  customizations.sort((a, b) => {
    const byCustomer = a.customerName.localeCompare(b.customerName, "es");
    if (byCustomer !== 0) return byCustomer;
    return a.dishName.localeCompare(b.dishName, "es");
  });

  const ingredientAcc = new Map<
    string,
    { name: string; qty: number; unit: string }
  >();
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

  const portionCount = [...portionsByDish.values()].reduce((s, n) => s + n, 0);

  return {
    deliveryDate: input.deliveryDate,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    standardDishes,
    customizations,
    ingredientSummary,
    totals: {
      orderCount: orderIds.size,
      portionCount,
      dishCount: standardDishes.length,
      customizationCount: customizations.length,
    },
  };
}
