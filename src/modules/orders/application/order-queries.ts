import { supabase } from "@/integrations/supabase/client";
import { fetchCatalogDishesByIds } from "@/modules/dish-library/application/dish-catalog-queries";
import type { CatalogDish } from "@/modules/dish-library/application/dish-catalog-mapper";
import { createOrderRepository, type OrderRow } from "../infrastructure/order-repository";
import { mapOrderToSummaryView, type OrderSummaryView } from "./order-summary-mapper";
import { orderKeys } from "./order-query-keys";

export { orderKeys };

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

  return mapOrderToSummaryView(result.order, result.items, dishesById);
}

export type CustomerOrderListItem = {
  id: string;
  weekStart: string;
  status: OrderRow["status"];
  total: number;
  currency: string;
  itemCount: number;
  createdAt: string;
};

/**
 * CAP-007 — list Orders for the signed-in customer (own customer_id).
 * RLS scopes to tenant + own customer row; staff callers are out of scope here.
 */
export async function fetchCustomerOrders(
  tenantId: string,
  userId: string,
): Promise<CustomerOrderListItem[]> {
  const repo = createOrderRepository(supabase, tenantId);
  const customerId = await repo.findCustomerIdForUser(userId);
  if (!customerId) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("id, week_start, status, total, created_at, order_items(id)")
    .eq("tenant_id", tenantId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("week_start", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const items = (row as { order_items?: unknown[] }).order_items ?? [];
    return {
      id: row.id as string,
      weekStart: row.week_start as string,
      status: row.status as OrderRow["status"],
      total: Number(row.total ?? 0),
      currency: "EUR",
      itemCount: Array.isArray(items) ? items.length : 0,
      createdAt: row.created_at as string,
    };
  });
}
