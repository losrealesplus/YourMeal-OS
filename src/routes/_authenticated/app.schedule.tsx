import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from "lucide-react";
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
import {
  utcWeekDates,
  utcWeekStartMonday,
  offsetWeekMonday,
  formatWeekRangeEs,
  MAX_FUTURE_WEEKS,
} from "@/modules/weekly-menu/application/week-dates";
import { resolveOrderCommercialPricing, getTenantOffers } from "@/modules/commercial";
import { useActiveTenantSlug } from "@/identity/active-tenant-slug";
import type { MockDish } from "@/lib/mock-catalog";
import { cn } from "@/lib/utils";
import dishPhoto from "@/assets/eatclean-hero.jpg";

/**
 * Screen: Customer · Schedule Weekly Order (3-step flow)
 * Experience: step 1 = Day picker · step 2 = Stepper multi-quantity dish choice · step 3 = calm Resumen.
 * Capability: CAP-004 Draft order with multi-dish quantities (ADR 0017 / Ordering Contract v1).
 */
export const Route = createFileRoute("/_authenticated/app/schedule")({
  component: ScheduleFlow,
});

type Step = 1 | 2 | 3;

function ScheduleFlow() {
  const { t, i18n } = useTranslation(["customer", "common"]);
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [deliveryDay, setDeliveryDay] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({});
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const fmt = useFmt();

  const baseWeekStart = utcWeekStartMonday();
  const weekStart = offsetWeekMonday(baseWeekStart, weekOffset);
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

  const activeTenantSlug = useActiveTenantSlug();
  const availableOffers = getTenantOffers(activeTenantSlug);
  const defaultOfferCode =
    availableOffers.find((o) => (o as { isDefault?: boolean }).isDefault)?.code ??
    availableOffers[0]?.code;

  const [selectedOfferCode, setSelectedOfferCode] = useState<string | undefined>(defaultOfferCode);

  useEffect(() => {
    if (!selectedOfferCode && defaultOfferCode) {
      setSelectedOfferCode(defaultOfferCode);
    }
  }, [defaultOfferCode, selectedOfferCode]);

  const offerDishes = weeklyMenu?.days[deliveryDay]?.dishes ?? [];
  const dayDate = utcWeekDates(weekStart)[deliveryDay] ?? weekStart;

  const currentDayQuantities = quantities[dayDate] ?? {};
  const selectedDishEntries = Object.entries(currentDayQuantities)
    .filter(([_, qty]) => qty > 0)
    .map(([dishId, qty]) => {
      const dish = offerDishes.find((d) => d.id === dishId);
      return { dishId, dish, qty };
    })
    .filter((entry): entry is { dishId: string; dish: MockDish; qty: number } => Boolean(entry.dish));

  const totalMealsCount = selectedDishEntries.reduce((sum, item) => sum + item.qty, 0);

  const effectiveOfferCode = selectedOfferCode ?? defaultOfferCode;
  const orderItems = selectedDishEntries.map((item) => ({
    dishId: item.dishId,
    dayDate,
    qty: item.qty,
  }));

  const commercialPricing = resolveOrderCommercialPricing({
    tenantSlug: activeTenantSlug,
    offerCode: effectiveOfferCode,
    items: orderItems,
  });

  // Authoritative total = commercial offer evaluation with catalog price fallback
  const totalEur = commercialPricing
    ? commercialPricing.grandTotalFinalPrice.cents / 100
    : selectedDishEntries.reduce(
        (sum, item) => sum + Number(item.dish.price ?? 0) * item.qty,
        0,
      );

  const deliveryDateLabel = formatDeliveryDate(dayDate, i18n.language);

  async function onProgramDraft() {
    if (orderItems.length === 0 || programDraft.isPending) return;
    const result = await programDraft.mutateAsync({
      weekStart,
      items: orderItems,
      offerCode: effectiveOfferCode,
    });
    void navigate({
      to: "/app/orders/$orderId",
      params: { orderId: result.order.id },
    });
  }

  function setDishQty(day: string, dishId: string, qty: number) {
    setQuantities((prev) => {
      const dayMap = { ...(prev[day] ?? {}) };
      if (qty <= 0) {
        delete dayMap[dishId];
      } else {
        dayMap[dishId] = qty;
      }
      return { ...prev, [day]: dayMap };
    });
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
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-muted-foreground">
                {t("customer:scheduleWeekTitle", "Semana de entrega")}
              </p>
              {weekOffset > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setWeekOffset(0);
                    setQuantities({});
                  }}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t("customer:resetToCurrentWeek", "Esta semana")}
                </button>
              )}
            </div>
            <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-3 shadow-xs">
              <button
                type="button"
                disabled={weekOffset <= 0}
                onClick={() => {
                  setWeekOffset((w) => Math.max(0, w - 1));
                  setQuantities({});
                }}
                className="h-11 w-11 rounded-xl border border-border flex items-center justify-center text-foreground hover:bg-secondary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                aria-label={t("customer:prevWeek", "Semana anterior")}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center px-2">
                <span
                  className={cn(
                    "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase mb-1",
                    weekOffset === 0
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {weekOffset === 0
                    ? t("customer:currentWeekLabel", "Esta semana")
                    : weekOffset === 1
                      ? t("customer:nextWeekLabel", "Próxima semana")
                      : t("customer:futureWeekOffsetLabel", `+${weekOffset} semanas`)}
                </span>
                <p className="text-sm font-extrabold text-foreground tracking-tight">
                  {formatWeekRangeEs(weekStart)}
                </p>
              </div>
              <button
                type="button"
                disabled={weekOffset >= MAX_FUTURE_WEEKS}
                onClick={() => {
                  setWeekOffset((w) => Math.min(MAX_FUTURE_WEEKS, w + 1));
                  setQuantities({});
                }}
                className="h-11 w-11 rounded-xl border border-border flex items-center justify-center text-foreground hover:bg-secondary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                aria-label={t("customer:nextWeek", "Semana siguiente")}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
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
        <div className="px-6 space-y-10 pb-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-extrabold tracking-tight">
              {daysFull[deliveryDay]}
            </p>
            {totalMealsCount > 0 && (
              <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                {totalMealsCount} {totalMealsCount === 1 ? "comida seleccionada" : "comidas seleccionadas"}
              </span>
            )}
          </div>
          {offerDishes.map((d) => {
            const qty = currentDayQuantities[d.id] ?? 0;
            return (
              <MenuDishPost
                key={d.id}
                dish={d}
                imageSrc={dishPhoto}
                macrosLabel={dishMacrosLine(d, macroLabels)}
                cta={
                  qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => setDishQty(dayDate, d.id, 1)}
                      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground text-[15px] font-bold tracking-wide hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                      {t("customer:selectDish", "Añadir")}
                    </button>
                  ) : (
                    <div className="flex h-14 w-full items-center justify-between rounded-2xl bg-foreground text-background px-3 font-bold shadow-xs">
                      <button
                        type="button"
                        onClick={() => setDishQty(dayDate, d.id, qty - 1)}
                        className="h-10 w-10 rounded-xl bg-background/20 hover:bg-background/30 flex items-center justify-center text-background transition-colors cursor-pointer"
                        aria-label="Disminuir ración"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-base font-extrabold tracking-tight tabular-nums">
                        {qty} {qty === 1 ? "ración" : "raciones"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDishQty(dayDate, d.id, qty + 1)}
                        className="h-10 w-10 rounded-xl bg-background/20 hover:bg-background/30 flex items-center justify-center text-background transition-colors cursor-pointer"
                        aria-label="Aumentar ración"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  )
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
          {selectedDishEntries.length === 0 ? (
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
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-muted-foreground">
                      {daysFull[deliveryDay]} · {totalMealsCount} {totalMealsCount === 1 ? "comida" : "comidas"}
                    </p>
                  </div>
                  <ul className="space-y-4">
                    {selectedDishEntries.map(({ dish, qty }) => (
                      <li key={dish.id} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <DishThumb
                            emoji={dish.emoji}
                            imageSrc={dishPhoto}
                            size="sm"
                            className="!size-14 !text-2xl !rounded-xl"
                          />
                          <div>
                            <p className="text-base font-bold tracking-tight leading-snug">
                              {dish.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {dish.kcal} kcal · {dish.proteinG}g P
                            </p>
                          </div>
                        </div>
                        <div className="bg-secondary px-3 py-1.5 rounded-xl font-extrabold text-sm tabular-nums">
                          {qty}x
                        </div>
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
            disabled={step === 2 && totalMealsCount === 0}
            onClick={() => setStep(((step + 1) as Step))}
          >
            {step === 2 ? t("customer:seeSummaryCta") : t("common:continue")}
          </PrimaryCTA>
        ) : selectedDishEntries.length > 0 ? (
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

