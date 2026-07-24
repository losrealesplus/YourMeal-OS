import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "inventory.operate");
  },
  component: AdminInventoryPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Inventory" },
      {
        name: "description",
        content: "Department placeholder. Feature logic belongs in Services.",
      },
    ],
  }),
});

function AdminInventoryPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("inventory", { defaultValue: "Inventory" })}
      description="Scaffold only. Business rules live in Services — never in this component."
    />
  );
}
