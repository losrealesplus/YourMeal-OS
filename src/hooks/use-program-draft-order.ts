import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createServiceContext } from "@/services/types";
import { OrderService } from "@/modules/orders/application/order-service";
import { orderKeys } from "@/modules/orders/application/order-query-keys";
import type { ProgramDraftOrderCommand } from "@/modules/orders/application/order-service";

/**
 * CAP-004 — mutation hook: program Draft order + audit + invalidate.
 */
export function useProgramDraftOrder() {
  const { user, tenantId, roles } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: ProgramDraftOrderCommand) => {
      if (!user || !tenantId) {
        throw new Error("Authenticated user and tenant are required");
      }
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      return OrderService.programDraft(ctx, command);
    },
    onSuccess: async () => {
      if (!tenantId) return;
      await queryClient.invalidateQueries({ queryKey: orderKeys.all(tenantId) });
    },
  });
}
