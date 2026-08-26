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

  return useQuery({
    queryKey: ["current-customer-id", tenantId, userId],
    enabled: Boolean(tenantId && userId),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id")
        .eq("tenant_id", tenantId!)
        .eq("user_id", userId!)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data?.id ? String(data.id) : null;
    },
  });
}
