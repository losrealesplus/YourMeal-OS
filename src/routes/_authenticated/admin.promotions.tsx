import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/promotions")({
  component: AdminPromotionsPage,
  head: () => ({
    meta: [{ title: "YourMeal OS — Promociones" }],
  }),
});

function AdminPromotionsPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("promotions", { defaultValue: "Promociones" })}
      description="Módulo no activado en RI-001 (flag admin_module_promotions). Modelo de campañas en Atención al Cliente."
    />
  );
}
