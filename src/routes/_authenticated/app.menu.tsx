import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  DayPicker,
  DishCard,
  ScreenHeader,
} from "@/components/consumer";
import { MOCK_DISHES } from "@/lib/mock-catalog";

/**
 * Screen: Customer · Weekly Menu
 * - Objetivo operacional: explorar el menú semanal antes de programar.
 * - Capability: weekly-menu.browse
 * - Core Object(s): WeeklyMenu · Dish
 */
export const Route = createFileRoute("/_authenticated/app/menu")({
  component: MenuPage,
});

function MenuPage() {
  const { t } = useTranslation(["customer", "common"]);
  const [active, setActive] = useState(0);
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

  // Scaffold: same mock dishes rotated per day.
  const dishes = [...MOCK_DISHES.slice(active), ...MOCK_DISHES.slice(0, active)];

  return (
    <div className="flex-1 flex flex-col">
      <ScreenHeader
        overline={t("customer:weekOf")}
        title={t("customer:weeklyMenu")}
        subtitle={t("customer:menuHint")}
      />
      <div className="px-6">
        <DayPicker
          days={days}
          activeIndex={active}
          onSelect={setActive}
        />
      </div>
      <div className="px-6 space-y-3 py-4">
        {dishes.map((d) => (
          <DishCard key={d.id + active} dish={d} tagLabels={tagLabels} />
        ))}
      </div>
    </div>
  );
}
