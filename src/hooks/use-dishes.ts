import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createServiceContext } from "@/services/types";
import { FeatureFlagService } from "@/services/feature-flag-service";
import {
  dishCatalogKeys,
  fetchCatalogDish,
  fetchCatalogDishes,
} from "@/modules/dish-library/application/dish-catalog-queries";

/**
 * CAP-002 — read-only dish catalog for the Customer App.
 * Preconditions: CAP-001 Connected · authenticated · tenant resolved.
 * Hardening INC-07: gated by `dish_library` feature flag.
 */
export function useDishes() {
  const { user, tenantId, roles } = useAuth();

  return useQuery({
    queryKey: dishCatalogKeys.list(tenantId ?? "none"),
    queryFn: async () => {
      const ctx = await createServiceContext({
        supabase,
        userId: user!.id,
        tenantId: tenantId!,
        roles,
      });
      if (!(await FeatureFlagService.isEnabled(ctx, "dish_library"))) {
        return [];
      }
      return fetchCatalogDishes(tenantId!);
    },
    enabled: Boolean(user && tenantId),
  });
}

export function useDish(dishId: string | undefined) {
  const { user, tenantId, roles } = useAuth();

  return useQuery({
    queryKey: dishCatalogKeys.detail(tenantId ?? "none", dishId ?? "none"),
    queryFn: async () => {
      const ctx = await createServiceContext({
        supabase,
        userId: user!.id,
        tenantId: tenantId!,
        roles,
      });
      if (!(await FeatureFlagService.isEnabled(ctx, "dish_library"))) {
        return null;
      }
      return fetchCatalogDish(tenantId!, dishId!);
    },
    enabled: Boolean(user && tenantId && dishId),
  });
}
