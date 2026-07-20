import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/production")({
  component: AdminProductionPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Production" },
      {
        name: "description",
        content: "Department placeholder. Feature logic belongs in Services.",
      },
    ],
  }),
});

function AdminProductionPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("production", { defaultValue: "Production" })}
      description="Scaffold only. Business rules live in Services — never in this component."
    />
  );
}
