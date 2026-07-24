import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchCustomerOrders,
  orderKeys,
} from "@/modules/orders/application/order-queries";

/**
 * CAP-007 — orders history for the signed-in customer.
 */
export function useCustomerOrders() {
  const { activeTenantId, userId } = useAuth();
  return useQuery({
    queryKey:
      activeTenantId && userId
        ? orderKeys.list(activeTenantId, userId)
        : ["orders", "list", "anon"],
    queryFn: () => fetchCustomerOrders(activeTenantId!, userId!),
    enabled: Boolean(activeTenantId && userId),
    staleTime: 30_000,
  });
}
