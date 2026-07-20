import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/promotions")({
  component: AdminPromotionsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Promotions" },
      {
        name: "description",
        content: "Department placeholder. Feature logic belongs in Services.",
      },
    ],
  }),
});

function AdminPromotionsPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("promotions", { defaultValue: "Promotions" })}
      description="Scaffold only. Business rules live in Services — never in this component."
    />
  );
}
