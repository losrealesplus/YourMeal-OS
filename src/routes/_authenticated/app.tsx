import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";

export const Route = createFileRoute("/_authenticated/app")({
  component: () => (
    <MobileShell>
      <Outlet />
    </MobileShell>
  ),
});
