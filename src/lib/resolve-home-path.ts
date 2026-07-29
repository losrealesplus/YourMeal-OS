import { emitCanonicalReady } from "@/auth/post-login-pipeline";
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
 *
 * FCR-008 / PS-002: when a canonical post-login pipeline is active, emits
 * IDENTITY → PROFILE → MEMBERSHIP → ROLE → HOME_PATH_RESOLVED exactly once.
 */
export async function resolveHomePath(userId: string): Promise<string> {
  emitCanonicalReady("IDENTITY_READY", { userId });
  // Apply Platform Owner grants when the RPC succeeds; ignore infra failures.
  await tryEnsurePlatformOwnerSession();
  emitCanonicalReady("PROFILE_READY", { userId });
  const roles = await requireAuthRoles(userId);
  emitCanonicalReady("MEMBERSHIP_READY", {
    userId,
    roleCount: roles.length,
  });
  emitCanonicalReady("ROLE_READY", { userId, roles });
  const path = homePathForRoles(roles);
  emitCanonicalReady("HOME_PATH_RESOLVED", { userId, path });
  return path;
}
