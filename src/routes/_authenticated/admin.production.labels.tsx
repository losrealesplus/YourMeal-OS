import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/production/labels")({
  component: () => (
    <PlaceholderPanel
      title="Etiquetas"
      description="Módulo no activado en RI-001 (flag admin_module_production). Sin datos simulados."
    />
  ),
  head: () => ({
    meta: [{ title: "YourMeal OS — Etiquetas" }],
  }),
});
