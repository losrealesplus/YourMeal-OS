/**
 * OP-002 · Permanent Platform Owners — first-login session ensure.
 *
 * Calls the SECURITY DEFINER RPC which, only for allowlisted Platform Owner
 * emails, upserts profile + EatClean Tenerife membership + roles:
 *   - saas_admin (tenant_id NULL)
 *   - company_admin (EatClean Tenerife)
 *
 * Idempotent. Non-owners skip the RPC. Does not bypass RBAC.
 */
import { supabase } from "@/integrations/supabase/client";
import { isPlatformOwnerEmail } from "@/lib/platform-owners";

export type PlatformOwnerEnsureResult = {
  ok: boolean;
  applied?: boolean;
  reason?: string;
  email?: string;
  roles?: string[];
  tenant_slug?: string;
};

export async function ensurePlatformOwnerSession(): Promise<PlatformOwnerEnsureResult | null> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const email = userData.user?.email;
  if (!isPlatformOwnerEmail(email)) {
    return null;
  }

  const { data, error } = await supabase.rpc("ensure_platform_owner_session");
  if (error) {
    console.error(
      "[OP-002] ensure_platform_owner_session failed:",
      error.message,
    );
    throw new Error(`Platform owner bootstrap failed: ${error.message}`);
  }
  if (data == null) return null;
  return data as PlatformOwnerEnsureResult;
}
