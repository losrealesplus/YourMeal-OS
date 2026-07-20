import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/saas/")({
  component: SaasIndexPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Companies" },
      { name: "description", content: "Manage tenant companies on the platform." },
    ],
  }),
});

function SaasIndexPage() {
  return (
    <PlaceholderPanel
      title="Companies"
      description="Manage tenant companies on the platform. Scaffold only — SaaS rules belong in Services."
    />
  );
}
