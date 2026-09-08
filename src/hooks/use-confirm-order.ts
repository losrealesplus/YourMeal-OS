import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createServiceContext } from "@/services/types";
import { OrderService } from "@/modules/orders/application/order-service";
import { orderKeys } from "@/modules/orders/application/order-query-keys";

/**
 * CAP-006 — Confirm Draft order (Mutation Pattern).
 */
export function useConfirmOrder() {
  const { user, tenantId, roles } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: string | { orderId: string; expectedTotal?: number },
    ) => {
      const orderId = typeof input === "string" ? input : input.orderId;
      const expectedTotal =
        typeof input === "object" ? input.expectedTotal : undefined;

      if (!user || !tenantId) {
        throw new Error("Authenticated user and tenant are required");
      }
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      return OrderService.confirm(ctx, orderId, { expectedTotal });
    },
    onSuccess: async (_order, input) => {
      const orderId = typeof input === "string" ? input : input.orderId;
      if (!tenantId) return;
      await queryClient.invalidateQueries({ queryKey: orderKeys.all(tenantId) });
      await queryClient.invalidateQueries({
        queryKey: orderKeys.detail(tenantId, orderId),
      });
    },
  });
}
