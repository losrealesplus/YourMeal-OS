import { supabase } from "@/integrations/supabase/client";
import { fetchCatalogDishesByIds } from "@/modules/dish-library/application/dish-catalog-queries";
import type { CatalogDish } from "@/modules/dish-library/application/dish-catalog-mapper";
import { createOrderRepository, type OrderRow } from "../infrastructure/order-repository";
import {
  mapOrderToSummaryView,
  type OrderDeliveryAddressView,
  type OrderSummaryView,
} from "./order-summary-mapper";
import { orderKeys } from "./order-query-keys";

export { orderKeys };

type AddressRow = {
  id: string;
  label: string | null;
  street: string;
  city: string | null;
};

function formatAddress(row: AddressRow): OrderDeliveryAddressView {
  return {
    label: row.label?.trim() || null,
    line: row.street.trim(),
    city: row.city?.trim() || null,
  };
}

async function loadAddressMap(
  tenantId: string,
  customerId: string,
  addressIds: string[],
): Promise<{
  byId: Map<string, OrderDeliveryAddressView>;
  defaultAddress: OrderDeliveryAddressView | null;
}> {
  const db = supabase as any;
  const byId = new Map<string, OrderDeliveryAddressView>();

  if (addressIds.length > 0) {
    const { data, error } = await db
      .from("customer_addresses")
      .select("id, label, street, city")
      .eq("tenant_id", tenantId)
      .eq("customer_id", customerId)
      .in("id", addressIds)
      .is("deleted_at", null);
    if (error) throw error;
    for (const row of (data ?? []) as AddressRow[]) {
      byId.set(row.id, formatAddress(row));
    }
  }

  const { data: defaults, error: dErr } = await db
    .from("customer_addresses")
    .select("id, label, street, city, is_default")
    .eq("tenant_id", tenantId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("is_default", { ascending: false })
    .limit(1);
  if (dErr) throw dErr;
  const def = (defaults ?? [])[0] as AddressRow | undefined;
  return {
    byId,
    defaultAddress: def ? formatAddress(def) : null,
  };
}

async function loadCompanyNames(
  tenantId: string,
  companyIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (companyIds.length === 0) return map;
  const db = supabase as any;
  const { data, error } = await db
    .from("companies")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .in("id", companyIds)
    .is("deleted_at", null);
  if (error) throw error;
  for (const row of (data ?? []) as Array<{ id: string; name: string }>) {
    map.set(row.id, row.name);
  }
  return map;
}

export async function fetchOrderSummary(
  tenantId: string,
  orderId: string,
): Promise<OrderSummaryView | null> {
  const result = await createOrderRepository(supabase, tenantId).findByIdWithItems(orderId);
  if (!result) return null;

  const uniqueDishIds = [...new Set(result.items.map((i) => i.dish_id))];
  const dishesById: Map<string, CatalogDish> = await fetchCatalogDishesByIds(
    tenantId,
    uniqueDishIds,
  );

  const orderAny = result.order as OrderRow & {
    delivery_address_id?: string | null;
    company_id?: string | null;
  };

  const { byId, defaultAddress } = await loadAddressMap(
    tenantId,
    result.order.customer_id,
    orderAny.delivery_address_id ? [orderAny.delivery_address_id] : [],
  );
  const address =
    (orderAny.delivery_address_id
      ? byId.get(orderAny.delivery_address_id)
      : null) ?? defaultAddress;

  let companyName: string | null = null;
  if (orderAny.company_id) {
    const names = await loadCompanyNames(tenantId, [orderAny.company_id]);
    companyName = names.get(orderAny.company_id) ?? null;
  }

  return mapOrderToSummaryView(result.order, result.items, dishesById, {
    address,
    companyName,
  });
}

export type CustomerOrderListItem = {
  id: string;
  weekStart: string;
  status: OrderRow["status"];
  total: number;
  currency: string;
  /** Sum of line quantities. */
  itemCount: number;
  createdAt: string;
  /** Delivery day (earliest item day) when known. */
  deliveryDate: string;
  dishNames: string[];
  address: OrderDeliveryAddressView | null;
  companyName: string | null;
};

/**
 * CAP-007 / EP-002A.2 — list Orders for the signed-in customer (own customer_id).
 */
export async function fetchCustomerOrders(
  tenantId: string,
  userId: string,
): Promise<CustomerOrderListItem[]> {
  const repo = createOrderRepository(supabase, tenantId);
  const customerId = await repo.findCustomerIdForUser(userId);
  if (!customerId) return [];

  const db = supabase as any;
  const { data, error } = await db
    .from("orders")
    .select(
      "id, week_start, status, total, created_at, delivery_address_id, company_id, order_items(id, dish_id, day_date, qty)",
    )
    .eq("tenant_id", tenantId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("week_start", { ascending: false });
  if (error) throw error;

  type ListRow = {
    id: string;
    week_start: string;
    status: OrderRow["status"];
    total: number | string;
    created_at: string;
    delivery_address_id?: string | null;
    company_id?: string | null;
    order_items?: Array<{
      id: string;
      dish_id: string;
      day_date: string;
      qty: number;
    }> | null;
  };

  const rows = (data ?? []) as ListRow[];
  const allDishIds = [
    ...new Set(
      rows.flatMap((r) => (r.order_items ?? []).map((i) => i.dish_id)),
    ),
  ];
  const dishesById = await fetchCatalogDishesByIds(tenantId, allDishIds);

  const addressIds = [
    ...new Set(
      rows
        .map((r) => r.delivery_address_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const { byId: addressById, defaultAddress } = await loadAddressMap(
    tenantId,
    customerId,
    addressIds,
  );

  const companyIds = [
    ...new Set(
      rows.map((r) => r.company_id).filter((id): id is string => Boolean(id)),
    ),
  ];
  const companyNames = await loadCompanyNames(tenantId, companyIds);

  return rows.map((row) => {
    const items = row.order_items ?? [];
    const days = items.map((i) => i.day_date).filter(Boolean).sort();
    const dishNames = [
      ...new Set(
        items
          .map((i) => dishesById.get(i.dish_id)?.name)
          .filter((n): n is string => Boolean(n)),
      ),
    ];
    const address =
      (row.delivery_address_id
        ? addressById.get(row.delivery_address_id)
        : null) ?? defaultAddress;

    return {
      id: row.id,
      weekStart: row.week_start,
      status: row.status,
      total: Number(row.total ?? 0),
      currency: "EUR",
      itemCount: items.reduce((s, i) => s + Number(i.qty || 1), 0),
      createdAt: row.created_at,
      deliveryDate: days[0] ?? row.week_start,
      dishNames,
      address,
      companyName: row.company_id
        ? (companyNames.get(row.company_id) ?? null)
        : null,
    };
  });
}
