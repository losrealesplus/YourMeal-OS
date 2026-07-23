import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createServiceContext } from "@/services/types";
import { FeatureFlagService } from "@/services/feature-flag-service";
import { utcWeekStartMonday } from "@/modules/weekly-menu/application/week-dates";
import {
  fetchPublishedWeeklyMenu,
  weeklyMenuKeys,
} from "@/modules/weekly-menu/application/weekly-menu-queries";

/**
 * CAP-003 — published Weekly Menu read for Customer App.
 * Preconditions: CAP-001 Connected · CAP-002 Connected · auth · tenant.
 * Hardening INC-07: gated by `dish_library` (offer depends on catalog).
 */
export function useWeeklyMenu(weekStart: string = utcWeekStartMonday()) {
  const { user, tenantId, roles } = useAuth();

  return useQuery({
    queryKey: weeklyMenuKeys.current(tenantId ?? "none", weekStart),
    queryFn: async () => {
      const ctx = await createServiceContext({
        supabase,
        userId: user!.id,
        tenantId: tenantId!,
        roles,
      });
      if (!(await FeatureFlagService.isEnabled(ctx, "dish_library"))) {
        return null;
      }
      return fetchPublishedWeeklyMenu(tenantId!, weekStart);
    },
    enabled: Boolean(user && tenantId),
  });
}
