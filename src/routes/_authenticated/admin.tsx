import { createFileRoute, Outlet } from "@tanstack/react-router";
import { resolveAuthenticatedRouteUser } from "@/auth/resolve-authenticated-route-user";
import { AdminShell } from "@/components/admin-shell";
import { assertStaffRoute } from "@/permissions/route-guards";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    // Prefer parent `/_authenticated` context.user (#340); fall back to the
    // same requireAuthenticatedUser() gate on Capacitor SPA context races.
    const user = await resolveAuthenticatedRouteUser(context, "/admin");
    const roles = await assertStaffRoute(user.id);
    return { roles, user };
  },
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});
