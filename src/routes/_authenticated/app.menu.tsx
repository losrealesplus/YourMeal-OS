import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  DayPicker,
  DishCard,
} from "@/components/consumer";
import { useWeeklyMenu } from "@/hooks/use-weekly-menu";
import heroImage from "@/assets/eatclean-hero.jpg";

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
  const featured = dishes[0];

  return (
    <div className="flex-1 flex flex-col pb-4">
      {/* Editorial header */}
      <section className="px-6 pt-6">
        <p className="meta-label text-primary">{t("customer:weekOf")}</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-balance">
          {t("customer:weeklyMenu")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          {t("customer:menuHint")}
        </p>
      </section>

      <div className="px-6 mt-5">
        <DayPicker days={days} activeIndex={active} onSelect={setActive} />
      </div>

      {/* Featured hero for the day */}
      {featured ? (
        <section className="px-6 mt-6">
          <div className="relative rounded-[1.75rem] overflow-hidden shadow-sm">
            <img
              src={heroImage}
              alt=""
              width={1600}
              height={1200}
              className="w-full h-52 object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 30%, rgba(26,46,36,0.8) 100%)",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">
                {days[active]}
              </p>
              <p className="text-xl font-extrabold tracking-tight mt-1 text-balance">
                {featured.name}
              </p>
              <p className="text-xs opacity-90 mt-1 line-clamp-1">
                {featured.tagline}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Rest of the day */}
      <div className="px-6 space-y-4 py-6">
        {dishes.slice(1).map((d) => (
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
