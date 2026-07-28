import type { Capability } from "@/permissions";
import { can, hasStaffAccess } from "@/permissions";
import type { AppRole } from "@/hooks/use-auth";
import { isBootstrapMode } from "@/bootstrap/flag";
import { getBootstrapProfileByUserId } from "@/bootstrap/profiles";
import { supabase } from "@/integrations/supabase/client";
import { redirect } from "@tanstack/react-router";

async function loadRoles(userId: string): Promise<AppRole[]> {
  // EP-BOOTSTRAP-001: identity origin only — guard logic unchanged.
  if (isBootstrapMode()) {
    const profile = getBootstrapProfileByUserId(userId);
    if (profile) return [...profile.roles];
  }

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.role as AppRole);
}

/**
 * Route → Permission Guard. Hiding nav is not enough.
 * @see docs/09-security/CAPABILITY_MATRIX.md
 */
export async function requireAuthRoles(userId: string): Promise<AppRole[]> {
  return loadRoles(userId);
}

export async function assertStaffRoute(userId: string): Promise<AppRole[]> {
  const roles = await loadRoles(userId);
  if (!hasStaffAccess(roles)) {
    throw redirect({ to: "/app" });
  }
  return roles;
}

export async function assertSaasRoute(userId: string): Promise<AppRole[]> {
  const roles = await loadRoles(userId);
  if (!can(roles, "saas.manage")) {
    // EP-OPS-002 negative case: Tenant staff denied Platform → Tenant home, not Customer App.
    throw redirect({ to: hasStaffAccess(roles) ? "/admin" : "/app" });
  }
  return roles;
}

export async function assertDriverRoute(userId: string): Promise<AppRole[]> {
  const roles = await loadRoles(userId);
  const ok =
    roles.includes("driver") ||
    can(roles, "logistics.operate") ||
    can(roles, "saas.manage");
  if (!ok) {
    throw redirect({ to: "/app" });
  }
  return roles;
}

export async function assertCapability(
  userId: string,
  capability: Capability,
  fallback: "/app" | "/admin" = "/app",
): Promise<AppRole[]> {
  const roles = await loadRoles(userId);
  if (!can(roles, capability)) {
    throw redirect({ to: fallback });
  }
  return roles;
}

/**
 * Sync capability guard for admin child routes. Reads pre-loaded roles from
 * the parent `/admin` route context (set by `assertStaffRoute`) and enforces
 * the specific capability required for the module. Hiding the nav item is
 * not enough — direct URL access must be blocked at `beforeLoad`.
 *
 * Every protected `/admin/*` route MUST call this in its `beforeLoad`.
 * @see docs/09-security/CAPABILITY_MATRIX.md
 * @see docs/00-status/RBAC_HARDENING_RI-001.md
 */
export function assertCapabilityFromContext(
  context: unknown,
  capability: Capability | readonly Capability[],
  fallback: "/app" | "/admin" = "/admin",
): void {
  const roles = (context as { roles?: AppRole[] }).roles ?? [];
  const caps = Array.isArray(capability) ? capability : [capability];
  const ok = caps.some((c) => can(roles, c));
  if (!ok) {
    throw redirect({ to: fallback });
  }
}
