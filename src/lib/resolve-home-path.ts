import { homePathForRoles } from "@/lib/home-path";
import { tryEnsurePlatformOwnerSession } from "@/lib/ensure-platform-owner-session";
import { requireAuthRoles } from "@/permissions/route-guards";

/**
 * Load roles for the current user and return the post-login home path.
 *
 * BUGFIX-002: Platform Owner bootstrap is best-effort here. A failure of
 * `ensure_platform_owner_session` must not block customers, employees, or
 * tenant admins from navigating after login. Strict ensure stays on Ops entry
 * (`enterOperationsCenter` / `/auth/admin`).
 *
 * EP-BOOTSTRAP-001: roles come from `requireAuthRoles` so bootstrap identity
 * origin is honored when the flag is on.
 */
export async function resolveHomePath(userId: string): Promise<string> {
  // Apply Platform Owner grants when the RPC succeeds; ignore infra failures.
  await tryEnsurePlatformOwnerSession();
  const roles = await requireAuthRoles(userId);
  return homePathForRoles(roles);
}
