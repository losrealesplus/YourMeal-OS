import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/saas/settings")({
  component: SaasSettingsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Global Settings" },
      { name: "description", content: "Platform-wide settings." },
    ],
  }),
});

function SaasSettingsPage() {
  return (
    <PlaceholderPanel
      title="Global Settings"
      description="Platform-wide settings. Scaffold only — SaaS rules belong in Services."
    />
  );
}
