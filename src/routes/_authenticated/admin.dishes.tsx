import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { assertCapability } from "@/permissions/route-guards";

export const Route = createFileRoute("/_authenticated/admin/dishes")({
  beforeLoad: async ({ context }) => {
    const user = (context as { user?: { id: string } }).user;
    if (!user?.id) throw new Error("Missing auth context");
    await assertCapability(user.id, "dishes.read", "/admin");
  },
  component: AdminDishesPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Dish Library" },
      {
        name: "description",
        content: "Dish Library — Module 01. Domain scaffold ready; UI after Foundation Lock.",
      },
    ],
  }),
});

function AdminDishesPage() {
  const { t } = useTranslation("admin");
  return (
    <PlaceholderPanel
      title={t("dishes", { defaultValue: "Dish Library" })}
      description="Module 01. Domain + DishService + DishRepository are Foundation-Locked. CRUD UI starts after tag v0.1.0 — domain entities first, then screens."
    />
  );
}
