/**
 * OP-002 · Platform Owners — first-login session ensure.
 *
 * Calls the SECURITY DEFINER RPC. Active owners are defined by bootstrap
 * configuration (`public.platform_owners`, synced from
 * `config/bootstrap/platform-owners.json`) — not by hardcoded frontend lists.
 *
 * For non-owners the RPC is a no-op. Does not bypass RBAC.
 */
import { supabase } from "@/integrations/supabase/client";

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
  if (!userData.user) return null;

  const { data, error } = await supabase.rpc("ensure_platform_owner_session");
  if (error) {
    // Function missing (migration not applied) — do not invent grants client-side.
    console.error(
      "[OP-002] ensure_platform_owner_session failed:",
      error.message,
    );
    throw new Error(`Platform owner bootstrap failed: ${error.message}`);
  }
  if (data == null) return null;
  return data as PlatformOwnerEnsureResult;
}
