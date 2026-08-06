import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "@/auth";
import { ensureApplicationReady } from "@/bootstrap/ready";

/**
 * Product Core entry — blocked until Application Ready Gate says READY (ADR 0053).
 * Public auth/landing routes are outside this layout and remain ungated.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    await requireAuthenticatedUser();
    await ensureApplicationReady();
  },
  component: () => <Outlet />,
});
