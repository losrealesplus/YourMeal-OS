import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { assertDriverRoute } from "@/permissions/route-guards";

export const Route = createFileRoute("/_authenticated/driver")({
  beforeLoad: async ({ context }) => {
    const user = (context as { user?: { id: string } }).user;
    if (!user?.id) throw new Error("Missing auth context");
    const roles = await assertDriverRoute(user.id);
    return { roles };
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
