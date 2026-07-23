import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  DayPicker,
  DishCard,
} from "@/components/consumer";
import { useWeeklyMenu } from "@/hooks/use-weekly-menu";

/**
 * Screen: Customer · Weekly Menu
 * - Objetivo operacional: explorar el menú semanal antes de programar.
 * - Capability: weekly-menu.browse
 * - Core Object(s): WeeklyMenu · Dish
 * - CAP-003: useWeeklyMenu() published offer by day (no order/stock/promo rules)
 */
export const Route = createFileRoute("/_authenticated/app/menu")({
  component: MenuPage,
});

function MenuPage() {
  const { t } = useTranslation(["customer", "common"]);
  const [active, setActive] = useState(0);
  const { data: weeklyMenu } = useWeeklyMenu();
  const days = [
    t("customer:dayMon"),
    t("customer:dayTue"),
    t("customer:dayWed"),
    t("customer:dayThu"),
    t("customer:dayFri"),
    t("customer:daySat"),
    t("customer:daySun"),
  ];

  const tagLabels = {
    vegan: t("customer:tagVegan"),
    vegetarian: t("customer:tagVegetarian"),
    glutenFree: t("customer:tagGlutenFree"),
    lactoseFree: t("customer:tagLactoseFree"),
    spicy: t("customer:tagSpicy"),
  };

  const dishes = weeklyMenu?.days[active]?.dishes ?? [];

  return (
    <div className="flex-1 flex flex-col pb-4">
      <div className="px-6 pt-6 pb-2">
        <p className="meta-label text-primary">{t("customer:weekOf")}</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          {t("customer:weeklyMenu")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">{t("customer:menuHint")}</p>
      </div>
      <div className="px-6 mt-4">
        <DayPicker
          days={days}
          activeIndex={active}
          onSelect={setActive}
        />
      </div>
      <div className="px-6 space-y-4 py-5">
        {dishes.map((d) => (
          <DishCard key={d.id + active} dish={d} tagLabels={tagLabels} />
        ))}
        {dishes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            {t("customer:menuEmptyDay")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
