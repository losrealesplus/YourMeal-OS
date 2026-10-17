import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createServiceContext } from "@/services/types";
import {
  CustomerProfileService,
  type CustomerProfileRecord,
  type UpdateCustomerProfileInput,
} from "@/modules/customer-profile";

export const customerProfileKeys = {
  all: (tenantId: string) => ["customer-profile", tenantId] as const,
  detail: (tenantId: string, userId: string) =>
    [...customerProfileKeys.all(tenantId), "detail", userId] as const,
};

const customerProfileService = new CustomerProfileService();

export function useCustomerProfile() {
  const { user, tenantId, roles } = useAuth();
  const userId = user?.id ?? null;

  return useQuery<CustomerProfileRecord | null>({
    queryKey:
      tenantId && userId
        ? customerProfileKeys.detail(tenantId, userId)
        : ["customer-profile", "anon"],
    queryFn: async () => {
      if (!tenantId || !userId) return null;
      const ctx = await createServiceContext({
        supabase,
        userId,
        tenantId,
        roles,
      });

      return customerProfileService.getProfile(ctx, {
        fallbackUserMetadata: {
          full_name: (user?.user_metadata?.full_name as string) || undefined,
          phone: (user?.user_metadata?.phone as string) || undefined,
          email: user?.email || undefined,
        },
      });
    },
    enabled: Boolean(tenantId && userId),
    staleTime: 30_000,
  });
}

export function useUpdateCustomerProfile() {
  const { user, tenantId, roles } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation(["customer", "common"]);

  return useMutation({
    mutationFn: async (input: UpdateCustomerProfileInput) => {
      if (!user || !tenantId) {
        throw new Error(t("common:error"));
      }

      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });

      return customerProfileService.updateProfile(ctx, {
        ...input,
        email: user.email || undefined,
      });
    },
    onSuccess: async (updatedRecord) => {
      if (tenantId && user) {
        await queryClient.invalidateQueries({
          queryKey: customerProfileKeys.all(tenantId),
        });
        // Invalidate admin / customer directory queries to keep Operations in sync
        await queryClient.invalidateQueries({
          queryKey: ["customer-directory", tenantId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["current-customer-id", tenantId],
        });
      }
      toast.success(t("customer:profileUpdated", "Perfil actualizado correctamente"));
      return updatedRecord;
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : String(err));
    },
  });
}
