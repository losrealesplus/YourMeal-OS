import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createServiceContext } from "@/services/types";
import { OrderIntakeService } from "@/modules/order-intake";
import { orderKeys } from "@/modules/orders/application/order-query-keys";
import type { ProgramDraftOrderCommand } from "@/modules/orders/application/order-service";

/**
 * CAP-004 — mutation hook: program Draft order via Order Intake (ADR 0017).
 * Channel: app (customer self-service).
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
      return OrderIntakeService.intakeDraftDay(ctx, {
        weekStart: command.weekStart,
        dayDate: command.dayDate,
        dishIds: command.dishIds,
        notes: command.notes,
      });
    },
    onSuccess: async () => {
      if (!tenantId) return;
      await queryClient.invalidateQueries({ queryKey: orderKeys.all(tenantId) });
    },
  });
}
