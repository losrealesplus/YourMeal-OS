import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createServiceContext } from "@/services/types";
import { OrderIntakeService } from "@/modules/order-intake";
import { orderKeys } from "@/modules/orders/application/order-query-keys";
import type { ProgramDraftOrderCommand } from "@/modules/orders/application/order-service";
import { resolveActiveTenantSlug } from "@/identity/active-tenant-slug";

/**
 * CAP-004 — mutation hook: program Draft order via Order Intake (ADR 0017).
 * Channel: app (customer self-service).
 */
export function useProgramDraftOrder() {
  const { user, tenantId, tenant, roles } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: ProgramDraftOrderCommand) => {
      if (!user || !tenantId) {
        throw new Error("Authenticated user and tenant are required");
      }
      const activeTenantSlug = resolveActiveTenantSlug(
        { tenant },
        typeof window !== "undefined" ? window.location.hostname : undefined,
      );
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        tenantSlug: activeTenantSlug,
        roles,
      });
      return OrderIntakeService.intakeDraftDay(ctx, {
        weekStart: command.weekStart,
        dayDate: command.dayDate,
        dishIds: command.dishIds,
        notes: command.notes,
        offerCode: command.offerCode,
        customerTier: command.customerTier,
        extras: command.extras,
      });
    },
    onSuccess: async () => {
      if (!tenantId) return;
      await queryClient.invalidateQueries({ queryKey: orderKeys.all(tenantId) });
    },
  });
}
