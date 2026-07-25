import { redirect } from "@tanstack/react-router";
import { getUser } from "./session";
import { AUTH_LOGIN_PATH } from "./urls";

export {
  assertCapability,
  assertCapabilityFromContext,
  assertDriverRoute,
  assertSaasRoute,
  assertStaffRoute,
  requireAuthRoles,
} from "@/permissions/route-guards";

/**
 * beforeLoad helper for authenticated layouts.
 * Throws a TanStack redirect to `/auth` when there is no valid user.
 */
export async function requireAuthenticatedUser() {
  const { data, error } = await getUser();
  if (error || !data.user) {
    throw redirect({ to: AUTH_LOGIN_PATH });
  }
  return { user: data.user };
}
