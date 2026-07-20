import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/saas/domains")({
  component: SaasDomainsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Domains" },
      { name: "description", content: "Custom domains per tenant." },
    ],
  }),
});

function SaasDomainsPage() {
  return (
    <PlaceholderPanel
      title="Domains"
      description="Custom domains per tenant. Scaffold only — SaaS rules belong in Services."
    />
  );
}
