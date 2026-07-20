import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/support")({
  component: AdminSupportPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Customer Support" },
      {
        name: "description",
        content: "Department placeholder. Feature logic belongs in Services.",
      },
    ],
  }),
});

function AdminSupportPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("support", { defaultValue: "Customer Support" })}
      description="Scaffold only. Business rules live in Services — never in this component."
    />
  );
}
