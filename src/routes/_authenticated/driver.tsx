import { createFileRoute } from "@tanstack/react-router";
import { resolveAuthenticatedRouteUser } from "@/auth/resolve-authenticated-route-user";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { assertDriverRoute } from "@/permissions/route-guards";

export const Route = createFileRoute("/_authenticated/driver")({
  beforeLoad: async ({ context }) => {
    const user = await resolveAuthenticatedRouteUser(context, "/driver");
    const roles = await assertDriverRoute(user.id);
    return { roles, user };
  },
  component: DriverHome,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Driver" },
      { name: "description", content: "Driver department — deferred feature surface." },
    ],
  }),
});

function DriverHome() {
  return (
    <PlaceholderPanel
      title="Driver"
      description="Deferred logistics surface. Route and stop logic will live in RouteService."
    />
  );
}
