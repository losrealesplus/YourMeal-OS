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
import type { AppRole } from "@/hooks/use-auth";
import type { Json } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";

/** Official Platform Owner roles — members of `app_role`. */
export const PLATFORM_OWNER_ROLES: AppRole[] = [
  "saas_admin",
  "company_admin",
];

const APP_ROLES: readonly AppRole[] = Constants.public.Enums.app_role;

export type PlatformOwnerEnsureResult = {
  ok: boolean;
  applied?: boolean;
  reason?: string;
  email?: string;
  roles?: AppRole[];
  tenant_slug?: string;
};

function isAppRole(value: string): value is AppRole {
  for (const role of APP_ROLES) {
    if (role === value) return true;
  }
  return false;
}

function parsePlatformOwnerEnsureResult(
  data: Json,
): PlatformOwnerEnsureResult | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }
  if (typeof data.ok !== "boolean") {
    return null;
  }

  const result: PlatformOwnerEnsureResult = { ok: data.ok };

  if (typeof data.applied === "boolean") result.applied = data.applied;
  if (typeof data.reason === "string") result.reason = data.reason;
  if (typeof data.email === "string") result.email = data.email;
  if (typeof data.tenant_slug === "string") {
    result.tenant_slug = data.tenant_slug;
  }
  if (Array.isArray(data.roles)) {
    const roles: AppRole[] = [];
    for (const item of data.roles) {
      if (typeof item === "string" && isAppRole(item)) {
        roles.push(item);
      }
    }
    result.roles = roles;
  }

  return result;
}

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
  return parsePlatformOwnerEnsureResult(data);
}
