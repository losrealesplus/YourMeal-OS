import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/saas/analytics")({
  component: SaasAnalyticsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Analytics" },
      { name: "description", content: "Cross-tenant analytics." },
    ],
  }),
});

function SaasAnalyticsPage() {
  return (
    <PlaceholderPanel
      title="Analytics"
      description="Cross-tenant analytics. Scaffold only — SaaS rules belong in Services."
    />
  );
}
