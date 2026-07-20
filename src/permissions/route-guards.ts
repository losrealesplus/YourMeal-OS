import type { Capability } from "@/permissions";
import { can, hasStaffAccess } from "@/permissions";
import type { AppRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { redirect } from "@tanstack/react-router";

async function loadRoles(userId: string): Promise<AppRole[]> {
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
    throw redirect({ to: "/app" });
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
