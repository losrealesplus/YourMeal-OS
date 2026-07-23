import { supabase } from "@/integrations/supabase/client";
import { fetchCatalogDishesByIds } from "@/modules/dish-library/application/dish-catalog-queries";
import type { CatalogDish } from "@/modules/dish-library/application/dish-catalog-mapper";
import { createOrderRepository } from "../infrastructure/order-repository";
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
