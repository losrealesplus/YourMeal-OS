import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/saas/licenses")({
  component: SaasLicensesPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Licenses" },
      { name: "description", content: "Plan and license controls." },
    ],
  }),
});

function SaasLicensesPage() {
  return (
    <PlaceholderPanel
      title="Licenses"
      description="Plan and license controls. Scaffold only — SaaS rules belong in Services."
    />
  );
}
