import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { requireAuthenticatedUser, AUTH_LOGIN_PATH } from "@/auth";
import { ensureApplicationReady } from "@/bootstrap/ready";

/**
 * Product Core entry — blocked until Application Ready Gate says READY (ADR 0053).
 * Public auth/landing routes are outside this layout and remain ungated.
 *
 * Route context contract: `beforeLoad` MUST return `{ user }` so child layouts
 * (`/admin`, `/saas`, `/driver`) can read `context.user` without re-fetching.
 * Discarding the return of `requireAuthenticatedUser()` leaves `context.user`
 * undefined — children then re-resolve via `resolveAuthenticatedRouteUser`
 * (same auth gate; Capacitor SPA cold-start safety).
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { user } = await requireAuthenticatedUser();
      await ensureApplicationReady({ timeoutMs: 15_000 });
      return { user };
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) {
        throw err;
      }
      throw redirect({ to: AUTH_LOGIN_PATH });
    }
  },
  component: () => <Outlet />,
});
