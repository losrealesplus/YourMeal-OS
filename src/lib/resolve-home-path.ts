import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/use-auth";
import { homePathForRoles } from "@/lib/home-path";
import { tryEnsurePlatformOwnerSession } from "@/lib/ensure-platform-owner-session";

/**
 * Load roles for the current user and return the post-login home path.
 *
 * BUGFIX-002: Platform Owner bootstrap is best-effort here. A failure of
 * `ensure_platform_owner_session` must not block customers, employees, or
 * tenant admins from navigating after login. Strict ensure stays on Ops entry
 * (`enterOperationsCenter` / `/auth/admin`).
 */
export async function resolveHomePath(userId: string): Promise<string> {
  // Apply Platform Owner grants when the RPC succeeds; ignore infra failures.
  await tryEnsurePlatformOwnerSession();

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const roles = (data ?? []).map((r) => r.role as AppRole);
  return homePathForRoles(roles);
}
