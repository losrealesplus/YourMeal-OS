import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/production/")({
  component: () => (
    <PlaceholderPanel
      title="Producción"
      description="Módulo no activado en RI-001 (flag admin_module_production). Cocina operativa vive en /admin/kitchen con datos reales."
    />
  ),
  head: () => ({
    meta: [{ title: "YourMeal OS — Producción" }],
  }),
});
