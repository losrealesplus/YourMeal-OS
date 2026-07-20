import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/_authenticated/admin")({
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});
