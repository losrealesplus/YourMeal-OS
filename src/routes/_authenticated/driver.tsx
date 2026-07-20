import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/driver")({
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
