import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: AdminCustomersPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Customers" },
      {
        name: "description",
        content: "Department placeholder. Feature logic belongs in Services.",
      },
    ],
  }),
});

function AdminCustomersPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("customers", { defaultValue: "Customers" })}
      description="Scaffold only. Business rules live in Services — never in this component."
    />
  );
}
