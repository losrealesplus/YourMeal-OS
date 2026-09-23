import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createServiceContext } from "@/services/types";
import { OrderIntakeService } from "@/modules/order-intake";
import { orderKeys } from "@/modules/orders/application/order-query-keys";
import type { ProgramDraftOrderCommand } from "@/modules/orders/application/order-service";
import { resolveActiveTenantSlug } from "@/identity/active-tenant-slug";

export type ProgramDraftOrderPayload =
  | ProgramDraftOrderCommand
  | {
      weekStart: string;
      items: Array<{ dishId: string; dayDate: string; qty: number }>;
      notes?: string | null;
      offerCode?: string;
      customerTier?: import("@/modules/commercial").CustomerTier;
      extras?: import("@/modules/commercial").ExtraItemInput[];
    };

/**
 * CAP-004 — mutation hook: program Draft order via Order Intake (ADR 0017).
 * Channel: app (customer self-service).
 */
export function useProgramDraftOrder() {
  const { user, tenantId, tenant, roles } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: ProgramDraftOrderPayload) => {
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

      if ("items" in command && Array.isArray(command.items)) {
        return OrderIntakeService.intakeDraft(ctx, {
          channel: "app",
          weekStart: command.weekStart,
          items: command.items,
          notes: command.notes,
          offerCode: command.offerCode,
          customerTier: command.customerTier,
          extras: command.extras,
        });
      }

      const singleDayCmd = command as ProgramDraftOrderCommand;
      return OrderIntakeService.intakeDraftDay(ctx, {
        weekStart: singleDayCmd.weekStart,
        dayDate: singleDayCmd.dayDate,
        dishIds: singleDayCmd.dishIds,
        notes: singleDayCmd.notes,
        offerCode: singleDayCmd.offerCode,
        customerTier: singleDayCmd.customerTier,
        extras: singleDayCmd.extras,
      });
    },
    onSuccess: async () => {
      if (!tenantId) return;
      await queryClient.invalidateQueries({ queryKey: orderKeys.all(tenantId) });
    },
  });
}
