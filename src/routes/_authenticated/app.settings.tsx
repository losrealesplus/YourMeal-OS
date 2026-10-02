import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout: Customer · Settings Hub
 * Parent of `/app/settings/` (hub), `/app/settings/profile` and `/app/settings/dietary`.
 * Must render <Outlet /> so the child route mounts.
 */
export const Route = createFileRoute("/_authenticated/app/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  return <Outlet />;
}
