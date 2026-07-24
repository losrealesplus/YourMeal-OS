import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/routes/stops")({
  component: () => (
    <PlaceholderPanel
      title="Paradas"
      description="Módulo no activado en RI-001 (flag admin_module_routes). Sin datos simulados."
    />
  ),
  head: () => ({
    meta: [{ title: "YourMeal OS — Paradas" }],
  }),
});
