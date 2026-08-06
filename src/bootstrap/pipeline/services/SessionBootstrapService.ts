/**
 * SessionBootstrapService — identity ladder data load.
 * Extracted from SupabaseIdentityProvider (PRODUCT-CORE-003).
 * Business queries unchanged; ownership moves to SessionStage.
 */

import { supabase } from "@/integrations/supabase/client";
import { tryEnsurePlatformOwnerSession } from "@/lib/ensure-platform-owner-session";
import type {
  ActiveTenant,
  AppRole,
  UserProfile,
} from "@/hooks/use-auth-types";

export type SessionIdentityData = {
  userId: string;
  roles: AppRole[];
  profile: UserProfile | null;
  tenant: ActiveTenant | null;
};

const inflight = new Map<string, Promise<SessionIdentityData>>();

async function loadSessionIdentityUncached(
  userId: string,
): Promise<SessionIdentityData> {
  // Best-effort Platform Owner grants — same policy as former IdentityProvider.
  await tryEnsurePlatformOwnerSession();

  const [rolesRes, profileRes, memberRes] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, locale, phone")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("tenant_members")
      .select("tenant_id, tenants:tenant_id(id, name, slug)")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle(),
  ]);

  const roles = (rolesRes.data ?? []).map((r) => r.role as AppRole);
  const p = profileRes.data;
  const profile: UserProfile | null = p
    ? {
        id: p.id,
        fullName: p.full_name,
        avatarUrl: p.avatar_url,
        locale: p.locale,
        phone: p.phone,
      }
    : null;

  const t = (memberRes.data as { tenants?: ActiveTenant | null } | null)?.tenants;
  const tenant = t ? { id: t.id, name: t.name, slug: t.slug ?? null } : null;

  return { userId, roles, profile, tenant };
}

/**
 * Single-flight per userId — cold pipeline + auth-event resume share one load.
 */
export function loadSessionIdentity(
  userId: string,
): Promise<SessionIdentityData> {
  const existing = inflight.get(userId);
  if (existing) return existing;
  const promise = loadSessionIdentityUncached(userId).finally(() => {
    inflight.delete(userId);
  });
  inflight.set(userId, promise);
  return promise;
}

/** Test helper */
export function resetSessionIdentityInflight(): void {
  inflight.clear();
}
