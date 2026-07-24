import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Resolves the current authenticated user's customer_id for the active tenant.
 * Uses the security-definer RPC `ensure_individual_customer` — reuse; no duplication.
 */
export function useCurrentCustomerId() {
  const { user, tenantId } = useAuth();
  const userId = user?.id ?? null;
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ?? null;

  return useQuery({
    queryKey: ["current-customer-id", tenantId, userId],
    enabled: Boolean(tenantId && userId),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const db = supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      };
      const { data, error } = await db.rpc("ensure_individual_customer", {
        p_tenant_id: tenantId!,
        p_user_id: userId!,
        p_display_name: displayName,
        p_email: user?.email ?? null,
      });
      if (error) throw new Error(error.message);
      return String(data);
    },
  });
}
