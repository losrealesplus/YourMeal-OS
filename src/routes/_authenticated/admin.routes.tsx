import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/routes")({
  component: AdminRoutesPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Logistics / Routes" },
      {
        name: "description",
        content: "Department placeholder. Feature logic belongs in Services.",
      },
    ],
  }),
});

function AdminRoutesPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("routes", { defaultValue: "Logistics / Routes" })}
      description="Scaffold only. Business rules live in Services — never in this component."
    />
  );
}
