import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  dishCatalogKeys,
  fetchCatalogDish,
  fetchCatalogDishes,
} from "@/modules/dish-library/application/dish-catalog-queries";

/**
 * CAP-002 — read-only dish catalog for the Customer App.
 * Preconditions: CAP-001 Connected · authenticated · tenant resolved.
 */
export function useDishes() {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: dishCatalogKeys.list(tenantId ?? "none"),
    queryFn: () => fetchCatalogDishes(tenantId!),
    enabled: Boolean(tenantId),
  });
}

export function useDish(dishId: string | undefined) {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: dishCatalogKeys.detail(tenantId ?? "none", dishId ?? "none"),
    queryFn: () => fetchCatalogDish(tenantId!, dishId!),
    enabled: Boolean(tenantId && dishId),
  });
}
