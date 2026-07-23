import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  DayPicker,
  MenuDishPost,
  dishMacrosLine,
  PrimaryCTA,
  ScreenHeader,
} from "@/components/consumer";
import { DishThumb } from "@/components/consumer/dish-thumb";
import { useFmt } from "@/i18n/localization-provider";
import { useWeeklyMenu } from "@/hooks/use-weekly-menu";
import { useProgramDraftOrder } from "@/hooks/use-program-draft-order";
import { utcWeekDates, utcWeekStartMonday } from "@/modules/weekly-menu/application/week-dates";
import { cn } from "@/lib/utils";
import dishPhoto from "@/assets/eatclean-hero.jpg";

/**
 * Screen: Customer · Schedule Weekly Order (3-step flow)
 * Experience: step 2 = Instagram dish choice · step 3 = calm Resumen.
 * Capability unchanged: CAP-004 Draft order (no Confirm logic change).
 */
export const Route = createFileRoute("/_authenticated/app/schedule")({
  component: ScheduleFlow,
});

type Step = 1 | 2 | 3;

function ScheduleFlow() {
  const { t, i18n } = useTranslation(["customer", "common"]);
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [mealsPerDay, setMealsPerDay] = useState(2);
  const [deliveryDay, setDeliveryDay] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const fmt = useFmt();
  const weekStart = utcWeekStartMonday();
  const { data: weeklyMenu } = useWeeklyMenu(weekStart);
  const programDraft = useProgramDraftOrder();

  const daysShort = [
    t("customer:dayMon"), t("customer:dayTue"), t("customer:dayWed"),
    t("customer:dayThu"), t("customer:dayFri"), t("customer:daySat"),
    t("customer:daySun"),
  ];
  const daysFull = [
    t("customer:dayMonFull"), t("customer:dayTueFull"), t("customer:dayWedFull"),
    t("customer:dayThuFull"), t("customer:dayFriFull"), t("customer:daySatFull"),
    t("customer:daySunFull"),
  ];

  const macroLabels = {
    protein: t("customer:macroProtein"),
    carbs: t("customer:macroCarbs"),
    fat: t("customer:macroFat"),
  };

  const stepTitles = [
    t("customer:scheduleStep1"),
    t("customer:scheduleStep2"),
    t("customer:summaryWeeklyTitle"),
  ];

  const offerDishes = weeklyMenu?.days[deliveryDay]?.dishes ?? [];
  const dayDate = utcWeekDates(weekStart)[deliveryDay] ?? weekStart;
  const selectedDishes = offerDishes.filter((d) => selected.includes(d.id));
  // Display-only scaffold estimate — authoritative total is computed server-side (INC-01).
  const totalCents = selected.length * 990;
  const totalEur = totalCents / 100;

  const deliveryDateLabel = formatDeliveryDate(dayDate, i18n.language);

  async function onProgramDraft() {
    if (selected.length === 0 || programDraft.isPending) return;
    const result = await programDraft.mutateAsync({
      weekStart,
      dayDate,
      dishIds: selected,
    });
    void navigate({
      to: "/app/orders/$orderId",
      params: { orderId: result.order.id },
    });
  }

  function toggleDish(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-4">
      <ScreenHeader
        backTo={step === 1 ? "/app" : undefined}
        onBack={step > 1 ? () => setStep(((step - 1) as Step)) : undefined}
        overline={t("customer:scheduleFlow")}
        title={stepTitles[step - 1]}
      />

      <div className="px-6 flex gap-2 mb-5">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={cn(
              "flex-1 h-1 rounded-full transition-colors",
              step >= n ? "bg-primary" : "bg-secondary",
            )}
          />
        ))}
      </div>

      {step === 1 ? (
        <section className="px-6 space-y-8">
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-3">
              {t("customer:mealsPerDay")}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMealsPerDay(n)}
                  className={cn(
                    "h-14 rounded-2xl font-bold border transition-colors",
                    mealsPerDay === n
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-3">
              {t("customer:deliveryDay")}
            </p>
            <DayPicker days={daysShort} activeIndex={deliveryDay} onSelect={setDeliveryDay} />
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <div className="px-6 space-y-12 pb-4">
          <p className="text-lg font-extrabold tracking-tight">
            {daysFull[deliveryDay]}
          </p>
          {offerDishes.map((d) => {
            const active = selected.includes(d.id);
            return (
              <MenuDishPost
                key={d.id}
                dish={d}
                imageSrc={dishPhoto}
                macrosLabel={dishMacrosLine(d, macroLabels)}
                cta={
                  <button
                    type="button"
                    onClick={() => toggleDish(d.id)}
                    className={cn(
                      "flex h-14 w-full items-center justify-center rounded-2xl text-[15px] font-bold tracking-wide transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {active ? t("customer:dishAdded") : t("customer:selectDish")}
                  </button>
                }
              />
            );
          })}
          {offerDishes.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10 space-y-5">
              <DishThumb
                emoji="🍽️"
                imageSrc={dishPhoto}
                size="xl"
                className="!rounded-[1.75rem]"
              />
              <p className="text-lg font-extrabold">{t("customer:menuEmptyDay")}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <section className="px-6 space-y-10 pt-1 pb-4">
          {selectedDishes.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8 space-y-6">
              <DishThumb
                emoji="🥗"
                imageSrc={dishPhoto}
                size="hero"
                className="!rounded-[1.75rem]"
              />
              <div className="space-y-2 max-w-[20rem]">
                <p className="text-xl font-extrabold tracking-tight">
                  {t("customer:noDishesSelected")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("customer:noDishesSelectedHint")}
                </p>
              </div>
              <PrimaryCTA
                className="!h-14 !rounded-2xl w-full max-w-sm"
                onClick={() => setStep(2)}
              >
                {t("customer:chooseMeals")}
              </PrimaryCTA>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-3">
                    {daysFull[deliveryDay]}
                  </p>
                  <ul className="space-y-4">
                    {selectedDishes.map((d) => (
                      <li key={d.id} className="flex items-center gap-4">
                        <DishThumb
                          emoji={d.emoji}
                          imageSrc={dishPhoto}
                          size="sm"
                          className="!size-14 !text-2xl !rounded-xl"
                        />
                        <p className="text-base font-bold tracking-tight leading-snug">
                          {d.name}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-border/70" />

                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {t("customer:deliveryDay")}
                    </p>
                    <p className="text-lg font-extrabold mt-1 tracking-tight">
                      {daysFull[deliveryDay]} {deliveryDateLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {t("customer:deliveryAddress")}
                    </p>
                    <p className="text-lg font-extrabold mt-1 tracking-tight">
                      {t("customer:addressHomeDefault")}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/70" />

                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {t("customer:total")}
                  </p>
                  <p className="text-3xl font-extrabold tracking-tight mt-1 tabular-nums">
                    {fmt.currency(totalEur, { currency: "EUR" })}
                  </p>
                </div>
              </div>

              {programDraft.isError ? (
                <p className="text-sm text-destructive text-center" role="alert">
                  {(programDraft.error as Error)?.message ?? "Error"}
                </p>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      <div className="px-6 mt-auto pt-8 space-y-3">
        {step < 3 ? (
          <PrimaryCTA
            disabled={step === 2 && selected.length === 0}
            onClick={() => setStep(((step + 1) as Step))}
          >
            {step === 2 ? t("customer:seeSummaryCta") : t("common:continue")}
          </PrimaryCTA>
        ) : selectedDishes.length > 0 ? (
          <PrimaryCTA
            disabled={programDraft.isPending}
            onClick={() => {
              void onProgramDraft();
            }}
          >
            {t("customer:confirmOrder")}
          </PrimaryCTA>
        ) : null}
      </div>
    </div>
  );
}

function formatDeliveryDate(isoDate: string, locale: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(locale || "es", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}
