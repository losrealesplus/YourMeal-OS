/**
 * ADMIN · Menús semanales — oculto en piloto (feature flag admin_module_menus).
 * Sin datos simulados visibles.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/menus")({
  component: AdminMenusPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Menús semanales" },
      {
        name: "description",
        content: "Planificación de menús — pendiente de activación en piloto.",
      },
    ],
  }),
});

function AdminMenusPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("menus", { defaultValue: "Menús semanales" })}
      description="Módulo no activado en RI-001. Activa el feature flag admin_module_menus cuando la gestión de menús admin esté conectada a datos reales."
    />
  );
}
