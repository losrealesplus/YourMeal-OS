import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/purchasing")({
  component: AdminPurchasingPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Purchasing" },
      {
        name: "description",
        content: "Department placeholder. Feature logic belongs in Services.",
      },
    ],
  }),
});

function AdminPurchasingPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("purchasing", { defaultValue: "Purchasing" })}
      description="Scaffold only. Business rules live in Services — never in this component."
    />
  );
}
