import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/kitchen")({
  component: AdminKitchenPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Kitchen" },
      {
        name: "description",
        content: "Department placeholder. Feature logic belongs in Services.",
      },
    ],
  }),
});

function AdminKitchenPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("kitchen", { defaultValue: "Kitchen" })}
      description="Scaffold only. Business rules live in Services — never in this component."
    />
  );
}
