import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createServiceContext } from "@/services/types";
import { CustomerPreferencesService } from "@/modules/customer-preferences";
import { utcWeekStartMonday } from "@/modules/weekly-menu/application/week-dates";

export const preferenceKeys = {
  all: (tenantId: string) => ["customer-preferences", tenantId] as const,
  snapshot: (tenantId: string, userId: string, weekStart: string) =>
    [...preferenceKeys.all(tenantId), "snapshot", userId, weekStart] as const,
  isFavorite: (tenantId: string, userId: string, dishId: string) =>
    [...preferenceKeys.all(tenantId), "fav", userId, dishId] as const,
};

export function useCustomerPreferences() {
  const { user, tenantId, roles } = useAuth();
  const weekStart = utcWeekStartMonday();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey:
      tenantId && userId
        ? preferenceKeys.snapshot(tenantId, userId, weekStart)
        : ["customer-preferences", "anon"],
    queryFn: async () => {
      const ctx = await createServiceContext({
        supabase,
        userId: userId!,
        tenantId: tenantId!,
        roles,
      });
      return CustomerPreferencesService.getSnapshot(ctx, weekStart);
    },
    enabled: Boolean(tenantId && userId),
    staleTime: 30_000,
  });
}

export function useIsFavorite(dishId: string | undefined) {
  const { user, tenantId, roles } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey:
      tenantId && userId && dishId
        ? preferenceKeys.isFavorite(tenantId, userId, dishId)
        : ["customer-preferences", "fav", "anon"],
    queryFn: async () => {
      const ctx = await createServiceContext({
        supabase,
        userId: userId!,
        tenantId: tenantId!,
        roles,
      });
      return CustomerPreferencesService.isFavorite(ctx, dishId!);
    },
    enabled: Boolean(tenantId && userId && dishId),
    staleTime: 30_000,
  });
}

export function useToggleFavorite() {
  const { user, tenantId, roles } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation("customer");

  return useMutation({
    mutationFn: async (input: { dishId: string; favorite: boolean }) => {
      if (!user || !tenantId) {
        throw new Error("Authenticated user and tenant are required");
      }
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      if (input.favorite) {
        await CustomerPreferencesService.addFavorite(ctx, input.dishId);
      } else {
        await CustomerPreferencesService.removeFavorite(ctx, input.dishId);
      }
    },
    onSuccess: async (_data, vars) => {
      if (tenantId) {
        await queryClient.invalidateQueries({
          queryKey: preferenceKeys.all(tenantId),
        });
      }
      toast.success(
        vars.favorite ? t("favoriteAdded") : t("favoriteRemoved"),
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : String(err));
    },
  });
}
