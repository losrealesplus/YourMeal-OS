import { supabase } from "@/integrations/supabase/client";
import { fetchCatalogDish } from "@/modules/dish-library/application/dish-catalog-queries";
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

  const dishesById = new Map<string, CatalogDish>();
  const uniqueDishIds = [...new Set(result.items.map((i) => i.dish_id))];
  await Promise.all(
    uniqueDishIds.map(async (dishId) => {
      const dish = await fetchCatalogDish(tenantId, dishId);
      if (dish) dishesById.set(dishId, dish);
    }),
  );

  return mapOrderToSummaryView(result.order, result.items, dishesById);
}
