import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/routes/deliveries")({
  component: () => (
    <PlaceholderPanel
      title="Entregas"
      description="Módulo no activado en RI-001 (flag admin_module_routes). Sin datos simulados."
    />
  ),
  head: () => ({
    meta: [{ title: "YourMeal OS — Entregas" }],
  }),
});
