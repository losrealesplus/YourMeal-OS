import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchOrderSummary,
  orderKeys,
} from "@/modules/orders/application/order-queries";

/**
 * CAP-005 — read Order Summary (Draft or later states) for Customer App.
 */
export function useOrder(orderId: string | undefined) {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: orderKeys.detail(tenantId ?? "none", orderId ?? "none"),
    queryFn: () => fetchOrderSummary(tenantId!, orderId!),
    enabled: Boolean(tenantId && orderId),
  });
}
