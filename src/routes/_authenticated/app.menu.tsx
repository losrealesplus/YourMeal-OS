import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DayPicker } from "@/components/consumer";
import { useWeeklyMenu } from "@/hooks/use-weekly-menu";
import { DishThumb } from "@/components/consumer/dish-thumb";
import { TagChip } from "@/components/consumer/tag-chip";

/**
 * SCR-006 · Weekly Menu — CJ-001
 * Food-app heart: big photos, clear macros, visible CTA. No tables.
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
      <div className="px-6 pt-7 pb-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t("customer:weeklyMenu")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">{t("customer:menuHint")}</p>
      </div>
      <div className="px-6 mt-4">
        <DayPicker days={days} activeIndex={active} onSelect={setActive} />
      </div>
      <div className="px-5 space-y-5 py-5">
        {dishes.map((d) => (
          <article
            key={d.id + active}
            className="rounded-[1.5rem] overflow-hidden bg-card border border-border/60 shadow-sm"
          >
            <DishThumb
              emoji={d.emoji}
              size="xl"
              className="!rounded-none border-0"
            />
            <div className="p-4 space-y-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">{d.name}</h2>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {d.tagline}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold tabular-nums bg-secondary rounded-lg px-2.5 py-1">
                  {d.kcal} kcal
                </span>
                {d.tags.slice(0, 3).map((tag) => (
                  <TagChip key={tag}>{tagLabels[tag] ?? tag}</TagChip>
                ))}
              </div>
              <Link
                to="/app/menu/$dishId"
                params={{ dishId: d.id }}
                className="flex h-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-sm font-bold"
              >
                {t("customer:addToOrder")}
              </Link>
            </div>
          </article>
        ))}
        {dishes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16 px-6">
            {t("customer:menuEmptyDay")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
