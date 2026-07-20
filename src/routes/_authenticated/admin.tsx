import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { assertStaffRoute } from "@/permissions/route-guards";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    // user injected by `/_authenticated` beforeLoad
    const user = (context as { user?: { id: string } }).user;
    if (!user?.id) throw new Error("Missing auth context");
    const roles = await assertStaffRoute(user.id);
    return { roles };
  },
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});
