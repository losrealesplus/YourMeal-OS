import type { AppSupabase } from "@/services/types";

export type HistoricalPriceSource = "customer_history" | "tenant_history" | "catalog";

export interface HistoricalPriceResult {
  suggestedPrice: number;
  source: HistoricalPriceSource;
  label: string;
}

export interface ReusableCustomItem {
  name: string;
  description: string | null;
  lastUsedAt?: string;
}

/**
 * Resolves the suggested sales price for an off-menu catalog dish following priority:
 * 1. Last confirmed purchase price for this customer and dish.
 * 2. Last confirmed purchase price in the tenant for this dish (any customer).
 * 3. Master dish catalog reference price (dishes.price).
 */
export async function fetchDishHistoricalPrice(
  supabaseClient: AppSupabase,
  tenantId: string,
  dishId: string,
  customerId?: string | null,
  catalogPrice?: number | null,
): Promise<HistoricalPriceResult> {
  // 1. Try customer-specific historical sales price
  if (customerId) {
    try {
      const { data, error } = await supabaseClient
        .from("order_items" as any)
        .select("unit_price, orders!inner(customer_id, status)")
        .eq("tenant_id", tenantId)
        .eq("dish_id", dishId)
        .eq("item_kind", "dish")
        .eq("orders.customer_id", customerId)
        .neq("orders.status", "cancelled")
        .is("deleted_at", null)
        .order("snapshot_captured_at", { ascending: false })
        .limit(1);

      const rows = data as any[];
      if (!error && rows && rows.length > 0 && rows[0].unit_price != null) {
        const price = Number(rows[0].unit_price);
        if (!isNaN(price) && price > 0) {
          return {
            suggestedPrice: price,
            source: "customer_history",
            label: `${price.toFixed(2)} € (histórico cliente)`,
          };
        }
      }
    } catch {
      // non-fatal, proceed to tenant fallback
    }
  }

  // 2. Try tenant-wide general historical sales price
  try {
    const { data, error } = await supabaseClient
      .from("order_items" as any)
      .select("unit_price")
      .eq("tenant_id", tenantId)
      .eq("dish_id", dishId)
      .eq("item_kind", "dish")
      .is("deleted_at", null)
      .order("snapshot_captured_at", { ascending: false })
      .limit(1);

    const rows = data as any[];
    if (!error && rows && rows.length > 0 && rows[0].unit_price != null) {
      const price = Number(rows[0].unit_price);
      if (!isNaN(price) && price > 0) {
        return {
          suggestedPrice: price,
          source: "tenant_history",
          label: `${price.toFixed(2)} € (histórico general)`,
        };
      }
    }
  } catch {
    // non-fatal, proceed to catalog fallback
  }

  // 3. Fallback to catalog price
  if (catalogPrice !== undefined && catalogPrice !== null && catalogPrice > 0) {
    return {
      suggestedPrice: catalogPrice,
      source: "catalog",
      label: `${catalogPrice.toFixed(2)} € (catálogo)`,
    };
  }

  // Direct catalog query if not provided
  try {
    const { data, error } = await supabaseClient
      .from("dishes")
      .select("price")
      .eq("tenant_id", tenantId)
      .eq("id", dishId)
      .maybeSingle();

    if (!error && data?.price != null) {
      const price = Number(data.price);
      return {
        suggestedPrice: price,
        source: "catalog",
        label: `${price.toFixed(2)} € (catálogo)`,
      };
    }
  } catch {
    // ignore
  }

  return {
    suggestedPrice: 0,
    source: "catalog",
    label: "0.00 € (sin histórico)",
  };
}

/**
 * Nivel 2: Retrieves past custom preparations for the tenant (tenant-isolated).
 * Enables the operator to search and reuse name & description while mandating a manual price entry.
 */
export async function fetchTenantReusableCustomItems(
  supabaseClient: AppSupabase,
  tenantId: string,
  search?: string,
): Promise<ReusableCustomItem[]> {
  try {
    let query = supabaseClient
      .from("order_items" as any)
      .select("name_snapshot, description_snapshot, snapshot_captured_at")
      .eq("tenant_id", tenantId)
      .eq("item_kind", "custom")
      .is("deleted_at", null)
      .order("snapshot_captured_at", { ascending: false })
      .limit(50);

    if (search && search.trim()) {
      query = query.ilike("name_snapshot", `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    const seen = new Set<string>();
    const uniqueItems: ReusableCustomItem[] = [];

    for (const row of data as any[]) {
      if (!row.name_snapshot) continue;
      const norm = row.name_snapshot.trim().toLowerCase();
      if (!seen.has(norm)) {
        seen.add(norm);
        uniqueItems.push({
          name: row.name_snapshot.trim(),
          description: row.description_snapshot?.trim() || null,
          lastUsedAt: row.snapshot_captured_at,
        });
      }
    }

    return uniqueItems;
  } catch {
    return [];
  }
}

/**
 * Efficiently batches price resolution for a list of catalog dishes:
 * 1. Resolves customer history for provided dishes in one query.
 * 2. Resolves tenant history for remaining dishes in a second query.
 * 3. Falls back to catalog dishes.price.
 */
export async function fetchCatalogHistoricalPricesMap(
  supabaseClient: AppSupabase,
  tenantId: string,
  dishes: Array<{ id: string; price: number | null }>,
  customerId?: string | null,
): Promise<Record<string, HistoricalPriceResult>> {
  const result: Record<string, HistoricalPriceResult> = {};
  if (dishes.length === 0) return result;

  const dishIds = dishes.map((d) => d.id);

  // 1. Try customer historical sales
  if (customerId) {
    try {
      const { data, error } = await supabaseClient
        .from("order_items" as any)
        .select("dish_id, unit_price, snapshot_captured_at, orders!inner(customer_id, status)")
        .eq("tenant_id", tenantId)
        .in("dish_id", dishIds)
        .eq("item_kind", "dish")
        .eq("orders.customer_id", customerId)
        .neq("orders.status", "cancelled")
        .is("deleted_at", null)
        .order("snapshot_captured_at", { ascending: false });

      if (!error && data) {
        for (const row of data as any[]) {
          if (row.dish_id && !result[row.dish_id] && row.unit_price != null) {
            const price = Number(row.unit_price);
            if (!isNaN(price) && price > 0) {
              result[row.dish_id] = {
                suggestedPrice: price,
                source: "customer_history",
                label: `${price.toFixed(2)} € (histórico cliente)`,
              };
            }
          }
        }
      }
    } catch {
      // non-fatal
    }
  }

  // 2. For remaining dishes, query tenant-wide historical sales
  const remainingIds = dishIds.filter((id) => !result[id]);
  if (remainingIds.length > 0) {
    try {
      const { data, error } = await supabaseClient
        .from("order_items" as any)
        .select("dish_id, unit_price, snapshot_captured_at")
        .eq("tenant_id", tenantId)
        .in("dish_id", remainingIds)
        .eq("item_kind", "dish")
        .is("deleted_at", null)
        .order("snapshot_captured_at", { ascending: false });

      if (!error && data) {
        for (const row of data as any[]) {
          if (row.dish_id && !result[row.dish_id] && row.unit_price != null) {
            const price = Number(row.unit_price);
            if (!isNaN(price) && price > 0) {
              result[row.dish_id] = {
                suggestedPrice: price,
                source: "tenant_history",
                label: `${price.toFixed(2)} € (histórico general)`,
              };
            }
          }
        }
      }
    } catch {
      // non-fatal
    }
  }

  // 3. For any still remaining, fallback to catalog price
  for (const dish of dishes) {
    if (!result[dish.id]) {
      const p = dish.price != null && dish.price > 0 ? dish.price : 0;
      result[dish.id] = {
        suggestedPrice: p,
        source: "catalog",
        label: p > 0 ? `${p.toFixed(2)} € (catálogo)` : "0.00 € (sin histórico)",
      };
    }
  }

  return result;
}
