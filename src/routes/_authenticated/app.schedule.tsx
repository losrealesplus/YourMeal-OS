import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, ShoppingBag } from "lucide-react";
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
 * Screen: Customer · Schedule Weekly Order (2-step multi-day flow)
 * Step 1: Day picker (L M X J V S D) + Dishes published for active day + Independent Stepper per dish.
 * Step 2: Consolidated Multi-Day Resumen + Commercial Pricing Evaluation + Confirmation.
 * Capability: CAP-004 Draft order with multi-dish quantities per day (ADR 0017 / Ordering Contract v1).
 */
export const Route = createFileRoute("/_authenticated/app/schedule")({
  component: ScheduleFlow,
});

type Step = 1 | 2;

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
    t("customer:chooseMeals", "Elige tus platos"),
    t("customer:summaryWeeklyTitle", "Tu pedido semanal"),
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

  const effectiveOfferCode = selectedOfferCode ?? defaultOfferCode;
  const currentWeekDates = utcWeekDates(weekStart);
  const activeDayDate = currentWeekDates[deliveryDay] ?? weekStart;
  const activeDayDishes = weeklyMenu?.days[deliveryDay]?.dishes ?? [];

  // Lookup map for fast dish retrieval across the full weekly menu
  const dishLookup = new Map<string, MockDish>();
  weeklyMenu?.days.forEach((dayView) => {
    dayView.dishes.forEach((dish) => {
      dishLookup.set(dish.id, dish);
    });
  });

  // Flat array of all selected items across all days in the week
  const allOrderItems: Array<{ dishId: string; dayDate: string; qty: number }> = Object.entries(
    quantities,
  ).flatMap(([dayKey, dayMap]) =>
    Object.entries(dayMap)
      .filter(([_, qty]) => qty > 0)
      .map(([dishId, qty]) => ({
        dishId,
        dayDate: dayKey,
        qty,
      })),
  );

  const totalMealsCount = allOrderItems.reduce((sum, item) => sum + item.qty, 0);

  // Commercial pricing evaluated over all items across the week
  const commercialPricing = resolveOrderCommercialPricing({
    tenantSlug: activeTenantSlug,
    offerCode: effectiveOfferCode,
    items: allOrderItems,
  });

  // Authoritative total: commercial pricing evaluation or fallback to catalog price
  const totalEur = commercialPricing
    ? commercialPricing.grandTotalFinalPrice.cents / 100
    : allOrderItems.reduce((sum, item) => {
        const dish = dishLookup.get(item.dishId);
        return sum + Number(dish?.price ?? 0) * item.qty;
      }, 0);

  // Grouped summary for Step 2
  const selectedDaysSummary = (weeklyMenu?.days ?? [])
    .map((dayView, dayIdx) => {
      const dayDateStr = dayView.dayDate;
      const dayQuantities = quantities[dayDateStr] ?? {};
      const dishes = Object.entries(dayQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([dishId, qty]) => {
          const dish = dayView.dishes.find((d) => d.id === dishId) ?? dishLookup.get(dishId);
          return dish ? { dish, qty } : null;
        })
        .filter((entry): entry is { dish: MockDish; qty: number } => Boolean(entry));

      const dayMealsCount = dishes.reduce((sum, d) => sum + d.qty, 0);
      return {
        dayIdx,
        dayDate: dayDateStr,
        dayName: daysFull[dayIdx] ?? dayDateStr,
        dayDateLabel: formatDeliveryDate(dayDateStr, i18n.language),
        dishes,
        dayMealsCount,
      };
    })
    .filter((d) => d.dishes.length > 0);

  // Quantities for active day
  const currentDayQuantities = quantities[activeDayDate] ?? {};
  const currentDayMealsCount = Object.values(currentDayQuantities).reduce((sum, q) => sum + q, 0);
  const activeDayDateLabel = formatDeliveryDate(activeDayDate, i18n.language);

  async function onProgramDraft() {
    if (allOrderItems.length === 0 || programDraft.isPending) return;
    const result = await programDraft.mutateAsync({
      weekStart,
      items: allOrderItems,
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
    <div className="flex-1 flex flex-col pb-6">
      <ScreenHeader
        backTo={step === 1 ? "/app" : undefined}
        onBack={step > 1 ? () => setStep(((step - 1) as Step)) : undefined}
        overline={t("customer:scheduleFlow")}
        title={stepTitles[step - 1]}
      />

      <div className="px-6 flex gap-2 mb-4">
        {[1, 2].map((n) => (
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
        <section className="px-6 space-y-6">
          {/* Week Navigation */}
          <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-3 shadow-xs">
            <button
              type="button"
              disabled={weekOffset <= 0}
              onClick={() => {
                setWeekOffset((w) => Math.max(0, w - 1));
                setQuantities({});
              }}
              className="h-11 w-11 rounded-xl border border-border flex items-center justify-center text-foreground hover:bg-secondary disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
              className="h-11 w-11 rounded-xl border border-border flex items-center justify-center text-foreground hover:bg-secondary disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label={t("customer:nextWeek", "Semana siguiente")}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Delivery Day Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-muted-foreground">
                {t("customer:deliveryDay")}
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
            <DayPicker days={daysShort} activeIndex={deliveryDay} onSelect={setDeliveryDay} />
          </div>

          {/* Active Day Header & Dish List */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-extrabold tracking-tight">
                  {daysFull[deliveryDay]}
                </p>
                <p className="text-xs text-muted-foreground">{activeDayDateLabel}</p>
              </div>
              {currentDayMealsCount > 0 && (
                <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full tabular-nums">
                  {currentDayMealsCount}{" "}
                  {currentDayMealsCount === 1 ? "comida este día" : "comidas este día"}
                </span>
              )}
            </div>

            {/* Dishes for Active Day */}
            <div className="space-y-8 pb-4">
              {activeDayDishes.map((d) => {
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
                          onClick={() => setDishQty(activeDayDate, d.id, 1)}
                          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground text-[15px] font-bold tracking-wide hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          <Plus className="w-5 h-5" />
                          {t("customer:selectDish", "Añadir")}
                        </button>
                      ) : (
                        <div className="flex h-14 w-full items-center justify-between rounded-2xl bg-foreground text-background px-3 font-bold shadow-xs">
                          <button
                            type="button"
                            onClick={() => setDishQty(activeDayDate, d.id, qty - 1)}
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
                            onClick={() => setDishQty(activeDayDate, d.id, qty + 1)}
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

              {activeDayDishes.length === 0 ? (
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
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="px-6 space-y-8 pt-1 pb-4">
          {allOrderItems.length === 0 ? (
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
                onClick={() => setStep(1)}
              >
                {t("customer:chooseMeals")}
              </PrimaryCTA>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Breakdown Grouped by Day */}
              <div className="space-y-6">
                {selectedDaysSummary.map((daySummary) => (
                  <div key={daySummary.dayDate} className="bg-card border border-border/80 rounded-2xl p-4 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                      <div>
                        <p className="text-base font-extrabold tracking-tight">
                          {daySummary.dayName}
                        </p>
                        <p className="text-xs text-muted-foreground">{daySummary.dayDateLabel}</p>
                      </div>
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full tabular-nums">
                        {daySummary.dayMealsCount} {daySummary.dayMealsCount === 1 ? "comida" : "comidas"}
                      </span>
                    </div>

                    <ul className="space-y-3">
                      {daySummary.dishes.map(({ dish, qty }) => (
                        <li key={dish.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <DishThumb
                              emoji={dish.emoji}
                              imageSrc={dishPhoto}
                              size="sm"
                              className="!size-12 !text-xl !rounded-xl"
                            />
                            <div>
                              <p className="text-sm font-bold tracking-tight leading-snug">
                                {dish.name}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {dish.kcal} kcal · {dish.proteinG}g P
                              </p>
                            </div>
                          </div>
                          <div className="bg-secondary px-2.5 py-1 rounded-lg font-extrabold text-xs tabular-nums">
                            {qty}x
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/70" />

              {/* Delivery Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {t("customer:deliveryAddress")}
                  </p>
                  <p className="text-base font-extrabold mt-1 tracking-tight">
                    {t("customer:addressHomeDefault")}
                  </p>
                </div>
              </div>

              <div className="border-t border-border/70" />

              {/* Total and Promotions Breakdown */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("customer:mealsSelected", "Comidas totales")}</span>
                  <span className="font-bold tabular-nums">{totalMealsCount} {totalMealsCount === 1 ? "comida" : "comidas"}</span>
                </div>

                {commercialPricing?.offerTitle && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("customer:planOrOffer", "Plan")}</span>
                    <span className="font-bold text-primary">{commercialPricing.offerTitle}</span>
                  </div>
                )}

                {commercialPricing?.appliedPromotions && commercialPricing.appliedPromotions.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-border/40">
                    {commercialPricing.appliedPromotions.map((promo) => (
                      <div key={promo.code} className="flex items-center justify-between text-xs text-primary font-bold">
                        <span>{promo.badgeLabel || promo.name}</span>
                        <span>-{promo.discountAmount.formatted}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-border/60 pt-2 flex items-baseline justify-between">
                  <p className="text-base font-bold text-foreground">
                    {t("customer:total")}
                  </p>
                  <p className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                    {fmt.currency(totalEur, { currency: "EUR" })}
                  </p>
                </div>
              </div>

              {programDraft.isError ? (
                <p className="text-sm text-destructive text-center" role="alert">
                  {(programDraft.error as Error)?.message ?? "Error"}
                </p>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {/* Floating / Sticky Bottom CTA Bar */}
      <div className="px-6 mt-auto pt-6 space-y-3">
        {step === 1 ? (
          <div className="space-y-2">
            {totalMealsCount > 0 && (
              <div className="flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                  {totalMealsCount} {totalMealsCount === 1 ? "comida en la semana" : "comidas en la semana"}
                </span>
                <span className="font-extrabold text-foreground tabular-nums">
                  {fmt.currency(totalEur, { currency: "EUR" })}
                </span>
              </div>
            )}
            <PrimaryCTA
              disabled={totalMealsCount === 0}
              onClick={() => setStep(2)}
            >
              {t("customer:seeSummaryCta")}
            </PrimaryCTA>
          </div>
        ) : allOrderItems.length > 0 ? (
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
  if (!y || !m || !d) return isoDate;
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(locale || "es", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}
