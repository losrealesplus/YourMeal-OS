/**
 * CustomerMaterializationService — ensure `customers` exists after ActiveTenant.
 *
 * Contract (Minimum Indispensable):
 *   authenticated + approved membership + ActiveTenant
 *     → ensure_individual_customer (existing RPC)
 *     → customers(user_id, tenant_id)
 *
 * Does NOT create access (membership remains authority).
 * Does NOT run without ActiveTenant (pending/rejected/suspended/revoked stay out).
 * Idempotent: RPC upserts / selects existing customer.
 */

import { supabase } from "@/integrations/supabase/client";

export type EnsureCustomerForActiveTenantInput = {
  userId: string;
  tenantId: string;
  displayName?: string | null;
  email?: string | null;
};

export type EnsureCustomerForActiveTenantResult = {
  customerId: string;
};

/**
 * Materialize the individual Customer for the ActiveTenant.
 * Caller must only invoke when ActiveTenant is bound (approved membership).
 */
export async function ensureCustomerForActiveTenant(
  input: EnsureCustomerForActiveTenantInput,
): Promise<EnsureCustomerForActiveTenantResult> {
  const { userId, tenantId, displayName, email } = input;
  if (!userId || !tenantId) {
    throw new Error("ensureCustomerForActiveTenant requires userId and tenantId");
  }

  const { data, error } = await supabase.rpc("ensure_individual_customer", {
    p_tenant_id: tenantId,
    p_user_id: userId,
    p_display_name: displayName ?? undefined,
    p_email: email ?? undefined,
  });

  if (error) throw new Error(error.message);
  if (data == null || data === "") {
    throw new Error("ensure_individual_customer returned empty customer id");
  }

  return { customerId: String(data) };
}
