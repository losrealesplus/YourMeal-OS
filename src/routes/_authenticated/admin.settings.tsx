import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Administration" },
      {
        name: "description",
        content: "Department placeholder. Feature logic belongs in Services.",
      },
    ],
  }),
});

function AdminSettingsPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("settings", { defaultValue: "Administration" })}
      description="Scaffold only. Business rules live in Services — never in this component."
    />
  );
}
