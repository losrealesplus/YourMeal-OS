import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/menus")({
  component: AdminMenusPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Weekly Menus" },
      {
        name: "description",
        content: "Department placeholder. Feature logic belongs in Services.",
      },
    ],
  }),
});

function AdminMenusPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("menus", { defaultValue: "Weekly Menus" })}
      description="Scaffold only. Business rules live in Services — never in this component."
    />
  );
}
