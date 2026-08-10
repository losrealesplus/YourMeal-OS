/**
 * SessionBootstrapService — identity ladder data load.
 * Extracted from SupabaseIdentityProvider (PRODUCT-CORE-003).
 * Business queries unchanged; ownership moves to SessionStage.
 *
 * Phase 2.2 / ADR 0018:
 * ActiveTenant is only bound for membership status = approved.
 * Pending membership must not unlock tenant-scoped customer ops.
 */

import { supabase } from "@/integrations/supabase/client";
import { tryEnsurePlatformOwnerSession } from "@/lib/ensure-platform-owner-session";
import type {
  ActiveTenant,
  AppRole,
  UserProfile,
} from "@/hooks/use-auth-types";

export type MembershipSessionStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "suspended"
  | "revoked"
  | "none";

export type SessionIdentityData = {
  userId: string;
  roles: AppRole[];
  profile: UserProfile | null;
  /** Operational tenant — only when membership is approved. */
  tenant: ActiveTenant | null;
  membershipStatus: MembershipSessionStatus;
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
      .select("tenant_id, status, tenants:tenant_id(id, name, slug)")
      .eq("user_id", userId)
      .is("deleted_at", null)
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

  const member = memberRes.data as
    | {
        status?: string | null;
        tenants?: ActiveTenant | null;
      }
    | null;

  const rawStatus = member?.status ?? null;
  const membershipStatus: MembershipSessionStatus =
    rawStatus === "approved" ||
    rawStatus === "pending" ||
    rawStatus === "rejected" ||
    rawStatus === "suspended" ||
    rawStatus === "revoked"
      ? rawStatus
      : member
        ? "pending"
        : "none";

  const t = member?.tenants ?? null;
  // ADR 0018 / P2-DEC-002: only approved membership unlocks ActiveTenant.
  const tenant =
    membershipStatus === "approved" && t
      ? { id: t.id, name: t.name, slug: t.slug ?? null }
      : null;

  return { userId, roles, profile, tenant, membershipStatus };
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
