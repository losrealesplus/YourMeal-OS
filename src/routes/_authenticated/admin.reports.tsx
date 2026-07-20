import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReportsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Reports" },
      {
        name: "description",
        content: "Department placeholder. Feature logic belongs in Services.",
      },
    ],
  }),
});

function AdminReportsPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("reports", { defaultValue: "Reports" })}
      description="Scaffold only. Business rules live in Services — never in this component."
    />
  );
}
