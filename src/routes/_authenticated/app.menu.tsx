import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DayPicker, MenuDishPost, dishMacrosLine, PrimaryCTA } from "@/components/consumer";
import { useWeeklyMenu } from "@/hooks/use-weekly-menu";
import { utcWeekStartMonday } from "@/modules/weekly-menu/application/week-dates";
import { DishThumb } from "@/components/consumer/dish-thumb";

/**
 * SCR-006 · Weekly Menu — CJ-001
 * Instagram product language: big photos, dish name hero, macros secondary.
 * Choosing food for the week — not filling a form.
 */
export const Route = createFileRoute("/_authenticated/app/menu")({
  component: MenuPage,
});

function MenuPage() {
  const { t, i18n } = useTranslation(["customer", "common"]);
  const [active, setActive] = useState(0);
  const weekStart = utcWeekStartMonday();
  const { data: weeklyMenu } = useWeeklyMenu(weekStart);

  const dayShort = [
    t("customer:dayMon"),
    t("customer:dayTue"),
    t("customer:dayWed"),
    t("customer:dayThu"),
    t("customer:dayFri"),
    t("customer:daySat"),
    t("customer:daySun"),
  ];

  const dayFull = [
    t("customer:dayMonFull"),
    t("customer:dayTueFull"),
    t("customer:dayWedFull"),
    t("customer:dayThuFull"),
    t("customer:dayFriFull"),
    t("customer:daySatFull"),
    t("customer:daySunFull"),
  ];

  const macroLabels = {
    protein: t("customer:macroProtein"),
    carbs: t("customer:macroCarbs"),
    fat: t("customer:macroFat"),
  };

  const dishes = weeklyMenu?.days[active]?.dishes ?? [];
  const hasAnyDish = useMemo(
    () => (weeklyMenu?.days ?? []).some((d) => d.dishes.length > 0),
    [weeklyMenu],
  );

  const weekLabel = formatWeekOf(weekStart, i18n.language, t("customer:weekOf"));

  return (
    <div className="flex-1 flex flex-col pb-28">
      <header className="px-6 pt-8 pb-2 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground tracking-wide">
          {weekLabel}
        </p>
        <h1 className="text-[1.85rem] font-extrabold tracking-tight text-balance leading-tight">
          {t("customer:programWeeklyMenu")}
        </h1>
      </header>

      <div className="px-6 mt-5 sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3">
        <DayPicker days={dayShort} activeIndex={active} onSelect={setActive} />
      </div>

      <div className="px-6 pt-2 pb-4">
        <p className="text-lg font-extrabold tracking-tight">{dayFull[active]}</p>
      </div>

      <div className="px-6 space-y-12 pb-6">
        {dishes.map((d) => (
          <MenuDishPost
            key={d.id + active}
            dish={d}
            macrosLabel={dishMacrosLine(d, macroLabels)}
            cta={
              <Link
                to="/app/schedule"
                className="flex h-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-[15px] font-bold tracking-wide"
              >
                {t("customer:selectDish")}
              </Link>
            }
          />
        ))}

        {dishes.length === 0 ? (
          <MenuEmpty
            title={
              hasAnyDish
                ? t("customer:menuEmptyDay")
                : t("customer:menuEmptyTitle")
            }
            hint={hasAnyDish ? undefined : t("customer:menuEmptyHint")}
            ctaLabel={t("customer:menuEmptyCta")}
          />
        ) : null}
      </div>

      {dishes.length > 0 ? (
        <div className="fixed bottom-20 inset-x-0 z-20 px-6 pointer-events-none">
          <div className="mx-auto max-w-lg pointer-events-auto">
            <Link to="/app/schedule" className="block">
              <PrimaryCTA className="!h-14 !rounded-2xl shadow-lg shadow-primary/20">
                {t("customer:scheduleCta")}
              </PrimaryCTA>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuEmpty({
  title,
  hint,
  ctaLabel,
}: {
  title: string;
  hint?: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center text-center pt-6 pb-10 space-y-6">
      <DishThumb emoji="🥗" size="hero" className="!rounded-[1.75rem] max-w-sm" />
      <div className="space-y-2 max-w-[22rem]">
        <p className="text-xl font-extrabold tracking-tight text-balance">{title}</p>
        {hint ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{hint}</p>
        ) : null}
      </div>
      <Link to="/app" className="w-full max-w-sm">
        <PrimaryCTA className="!h-14 !rounded-2xl">{ctaLabel}</PrimaryCTA>
      </Link>
    </div>
  );
}

function formatWeekOf(weekStart: string, locale: string, prefix: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const formatted = new Intl.DateTimeFormat(locale || "es", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
  return `${prefix} ${formatted}`;
}
