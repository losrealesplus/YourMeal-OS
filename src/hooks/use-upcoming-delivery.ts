import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { orderKeys } from "@/modules/orders/application/order-query-keys";
import { UpcomingDeliveryService } from "@/modules/orders/application/upcoming-delivery-service";

export function useUpcomingDelivery() {
  const { tenantId, user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey:
      tenantId && userId
        ? [...orderKeys.list(tenantId, userId), "upcoming"]
        : ["orders", "upcoming", "anon"],
    queryFn: () => UpcomingDeliveryService.getForUser(tenantId!, userId!),
    enabled: Boolean(tenantId && userId),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
}
