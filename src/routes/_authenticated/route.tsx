import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "@/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => requireAuthenticatedUser(),
  component: () => <Outlet />,
});
