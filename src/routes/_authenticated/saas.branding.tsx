import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/saas/branding")({
  component: SaasBrandingPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Branding" },
      { name: "description", content: "Platform and tenant branding." },
    ],
  }),
});

function SaasBrandingPage() {
  return (
    <PlaceholderPanel
      title="Branding"
      description="Platform and tenant branding. Scaffold only — SaaS rules belong in Services."
    />
  );
}
