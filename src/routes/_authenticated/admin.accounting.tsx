import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/accounting")({
  component: AdminAccountingPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Accounting" },
      {
        name: "description",
        content: "Department placeholder. Feature logic belongs in Services.",
      },
    ],
  }),
});

function AdminAccountingPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("accounting", { defaultValue: "Accounting" })}
      description="Scaffold only. Business rules live in Services — never in this component."
    />
  );
}
