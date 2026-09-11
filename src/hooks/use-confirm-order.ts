import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createServiceContext } from "@/services/types";
import { OrderService } from "@/modules/orders/application/order-service";
import { orderKeys } from "@/modules/orders/application/order-query-keys";
import type { CustomerTier, ExtraItemInput } from "@/modules/commercial";
import { brandConfig } from "@/tenant/brand-config";

/**
 * CAP-006 — Confirm Draft order (Mutation Pattern).
 */
export function useConfirmOrder() {
  const { user, tenantId, tenant, roles } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input:
        | string
        | {
            orderId: string;
            expectedTotal?: number;
            offerCode?: string;
            customerTier?: CustomerTier;
            extras?: ExtraItemInput[];
          },
    ) => {
      const orderId = typeof input === "string" ? input : input.orderId;
      const expectedTotal =
        typeof input === "object" ? input.expectedTotal : undefined;
      const offerCode = typeof input === "object" ? input.offerCode : undefined;
      const customerTier =
        typeof input === "object" ? input.customerTier : undefined;
      const extras = typeof input === "object" ? input.extras : undefined;

      if (!user || !tenantId) {
        throw new Error("Authenticated user and tenant are required");
      }
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        tenantSlug: tenant?.slug ?? brandConfig.slug,
        roles,
      });
      return OrderService.confirm(ctx, orderId, {
        expectedTotal,
        offerCode,
        customerTier,
        extras,
      });
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
