import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createServiceContext } from "@/services/types";
import { RepeatOrderService } from "@/modules/orders/application/repeat-order-service";
import { orderKeys } from "@/modules/orders/application/order-query-keys";

/**
 * EP-002A.2 — preview whether a historical order can be repeated this week.
 */
export function useRepeatOrderPreview(sourceOrderId: string | undefined) {
  const { user, tenantId, roles } = useAuth();

  return useQuery({
    queryKey: ["orders", "repeat-preview", tenantId, sourceOrderId],
    queryFn: async () => {
      if (!user || !tenantId || !sourceOrderId) {
        throw new Error("Authenticated user, tenant and order are required");
      }
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      return RepeatOrderService.preview(ctx, sourceOrderId);
    },
    enabled: Boolean(user && tenantId && sourceOrderId),
    staleTime: 30_000,
  });
}

/**
 * EP-002A.2 — create a draft from a historical order (menu-validated).
 */
export function useRepeatOrder() {
  const { user, tenantId, roles } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation("customer");

  return useMutation({
    mutationFn: async (sourceOrderId: string) => {
      if (!user || !tenantId) {
        throw new Error("Authenticated user and tenant are required");
      }
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      return RepeatOrderService.execute(ctx, sourceOrderId);
    },
    onSuccess: async (result) => {
      if (tenantId) {
        await queryClient.invalidateQueries({ queryKey: orderKeys.all(tenantId) });
      }
      const skipped = result.preview.unavailable.length;
      if (skipped > 0) {
        toast.message(t("repeatPartialTitle"), {
          description: t("repeatPartialHint", { count: skipped }),
        });
      } else {
        toast.success(t("repeatSuccess"));
      }
      await navigate({
        to: "/app/orders/$orderId",
        params: { orderId: result.draft.order.id },
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : String(err));
    },
  });
}
