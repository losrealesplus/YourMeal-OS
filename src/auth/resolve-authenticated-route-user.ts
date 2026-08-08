import { requireAuthenticatedUser } from "./guards";
import { ymosTrace } from "@/runtime/ymos-trace";

export type AuthenticatedRouteUser = { id: string };

/**
 * Resolve the authenticated user for `/admin` · `/saas` · `/driver` beforeLoads.
 *
 * Primary: parent `/_authenticated` merges `{ user }` into TanStack route context
 * (ANDROID field fix #340).
 *
 * Fallback: when parent `context.user` is missing (observed on Capacitor SPA
 * cold-start / hydrate races), call `requireAuthenticatedUser()` again.
 * That still enforces the same auth rules — redirect to login when there is
 * no session — and never invents an anonymous user.
 */
export async function resolveAuthenticatedRouteUser(
  context: unknown,
  surface: string,
): Promise<AuthenticatedRouteUser> {
  const fromParent = (context as { user?: AuthenticatedRouteUser } | null)?.user;
  if (fromParent?.id) {
    return fromParent;
  }

  ymosTrace(
    `route-context.user missing on ${surface} — resolving via requireAuthenticatedUser`,
  );

  const { user } = await requireAuthenticatedUser();
  if (!user?.id) {
    // requireAuthenticatedUser redirects when unauthenticated; keep the
    // historical failure mode if a user object somehow lacks an id.
    throw new Error("Missing auth context");
  }
  return user;
}
