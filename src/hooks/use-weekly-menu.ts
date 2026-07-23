import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { utcWeekStartMonday } from "@/modules/weekly-menu/application/week-dates";
import {
  fetchPublishedWeeklyMenu,
  weeklyMenuKeys,
} from "@/modules/weekly-menu/application/weekly-menu-queries";

/**
 * CAP-003 — published Weekly Menu read for Customer App.
 * Preconditions: CAP-001 Connected · CAP-002 Connected · auth · tenant.
 */
export function useWeeklyMenu(weekStart: string = utcWeekStartMonday()) {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: weeklyMenuKeys.current(tenantId ?? "none", weekStart),
    queryFn: () => fetchPublishedWeeklyMenu(tenantId!, weekStart),
    enabled: Boolean(tenantId),
  });
}
