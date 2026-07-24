import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/routes/")({
  component: () => (
    <PlaceholderPanel
      title="Rutas"
      description="Módulo no activado en RI-001 (flag admin_module_routes). Reparto operativo vive en /admin/delivery con datos reales."
    />
  ),
  head: () => ({
    meta: [{ title: "YourMeal OS — Rutas" }],
  }),
});
