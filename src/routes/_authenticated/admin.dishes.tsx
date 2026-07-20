import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const Route = createFileRoute("/_authenticated/admin/dishes")({
  component: AdminDishesPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Dish Library" },
      {
        name: "description",
        content: "Department placeholder. Feature logic belongs in Services.",
      },
    ],
  }),
});

function AdminDishesPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("dishes", { defaultValue: "Dish Library" })}
      description="First business module. Implement via DishService — this page is a scaffold only."
    />
  );
}
