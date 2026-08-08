import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "@/auth";
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
    const { user } = await requireAuthenticatedUser();
    await ensureApplicationReady();
    return { user };
  },
  component: () => <Outlet />,
});
