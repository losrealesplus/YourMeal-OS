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
  const { tenantId, user } = useAuth();
  const userId = user?.id ?? null;
  return useQuery({
    queryKey:
      tenantId && userId
        ? orderKeys.list(tenantId, userId)
        : ["orders", "list", "anon"],
    queryFn: () => fetchCustomerOrders(tenantId!, userId!),
    enabled: Boolean(tenantId && userId),
    staleTime: 30_000,
  });
}
