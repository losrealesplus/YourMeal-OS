import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/routes/attempt")({
  component: () => (
    <PlaceholderPanel
      title="Intento de entrega"
      description="Módulo no activado en RI-001 (flag admin_module_routes). Sin datos simulados."
    />
  ),
  head: () => ({
    meta: [{ title: "YourMeal OS — Intento de entrega" }],
  }),
});
