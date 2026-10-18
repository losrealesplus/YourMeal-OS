import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  MapPin,
  Check,
  ShoppingBag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentCustomerId } from "@/hooks/use-current-customer-id";
import {
  DayPicker,
  MenuDishPost,
  dishMacrosLine,
  PrimaryCTA,
  ScreenHeader,
  CustomerWelcomeModal,
} from "@/components/consumer";
import type { OnboardingStep } from "@/components/consumer/customer-welcome-modal";
import { DishThumb } from "@/components/consumer/dish-thumb";
import { useFmt } from "@/i18n/localization-provider";
import { useWeeklyMenu } from "@/hooks/use-weekly-menu";
import { useProgramDraftOrder } from "@/hooks/use-program-draft-order";
import { useConfirmOrder } from "@/hooks/use-confirm-order";
import { useTenantActiveWeek } from "@/hooks/use-tenant-active-week";
import { utcDateOnly } from "@/modules/weekly-menu/application/week-dates";
import { resolveOrderCommercialPricing, getTenantOffers } from "@/modules/commercial";
import { useActiveTenantSlug } from "@/identity/active-tenant-slug";
import type { MockDish } from "@/lib/mock-catalog";
import { cn } from "@/lib/utils";
import dishPhoto from "@/assets/eatclean-hero.jpg";
import { toast } from "sonner";
import {
  isEatCleanOrderCreationFrozen,
  EATCLEAN_PARTIAL_LAUNCH_CONFIG,
} from "@/config/eatclean-partial-launch";

/**
 * Screen: Customer · Schedule Weekly Order (Multi-Day Basket Flow)
 * Experience:
 * - Step 1: Carta Semanal con Selector Multidía persistente y barra flotante de resumen.
 * - Step 2: Resumen y Checkout con salvavidas de onboarding.
 * Capability: CAP-004 Draft order with multi-dish quantities (ADR 0017 / Ordering Contract v1).
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
  const todayIso = utcDateOnly();
  const fmt = useFmt();

  // Unified tenant active week & weekly cutoff (Friday 14:00 Canary)
  const activeWeek = useTenantActiveWeek();
  const weekStart = activeWeek.weekStart;
  const deliveryDates = activeWeek.activeDeliveryDates;
  const deliveryDayIndices = activeWeek.config.activeDeliveryDays.map((d) => d - 1);

  const allDaysShort = [
    t("customer:dayMon"),
    t("customer:dayTue"),
    t("customer:dayWed"),
    t("customer:dayThu"),
    t("customer:dayFri"),
    t("customer:daySat"),
    t("customer:daySun"),
  ];

  const allDaysFull = [
    t("customer:dayMonFull"),
    t("customer:dayTueFull"),
    t("customer:dayWedFull"),
    t("customer:dayThuFull"),
    t("customer:dayFriFull"),
    t("customer:daySatFull"),
    t("customer:daySunFull"),
  ];

  const daysShort = deliveryDayIndices.map((idx) => allDaysShort[idx] ?? "");
  const daysFull = deliveryDayIndices.map((idx) => allDaysFull[idx] ?? "");

  const { data: weeklyMenu } = useWeeklyMenu(weekStart);
  const programDraft = useProgramDraftOrder();
  const confirmOrder = useConfirmOrder();

  const isDayDisabled = (i: number) => (deliveryDates[i] ? deliveryDates[i] < todayIso : false);

  useEffect(() => {
    if (isDayDisabled(deliveryDay)) {
      const firstAvailable = deliveryDates.findIndex((d) => d >= todayIso);
      if (firstAvailable !== -1) {
        setDeliveryDay(firstAvailable);
      }
    }
  }, [weekStart, deliveryDay, todayIso, deliveryDates]);

  const macroLabels = {
    protein: t("customer:macroProtein"),
    carbs: t("customer:macroCarbs"),
    fat: t("customer:macroFat"),
  };

  const stepTitles = [
    t("customer:scheduleStep2", "Elegir platos"),
    t("customer:summaryWeeklyTitle", "Resumen de tu pedido"),
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

  // Catalog mapping
  const allDishesMap = new Map<string, MockDish>();
  for (const day of weeklyMenu?.days ?? []) {
    for (const d of day.dishes ?? []) {
      allDishesMap.set(d.id, d);
    }
  }

  // Selected dishes calculation across all days
  const allSelectedDishEntries: Array<{
    dishId: string;
    dayDate: string;
    qty: number;
    dish: MockDish;
  }> = [];

  for (const [dDate, dayQtys] of Object.entries(quantities)) {
    for (const [dishId, qty] of Object.entries(dayQtys)) {
      if (qty > 0) {
        const dish = allDishesMap.get(dishId);
        if (dish) {
          allSelectedDishEntries.push({ dishId, dayDate: dDate, qty, dish });
        }
      }
    }
  }

  const totalMealsCount = allSelectedDishEntries.reduce((sum, item) => sum + item.qty, 0);

  const effectiveOfferCode = selectedOfferCode ?? defaultOfferCode;
  const orderItems = allSelectedDishEntries.map((item) => ({
    dishId: item.dishId,
    dayDate: item.dayDate,
    qty: item.qty,
  }));

  const commercialPricing = resolveOrderCommercialPricing({
    tenantSlug: activeTenantSlug,
    offerCode: effectiveOfferCode,
    items: orderItems,
  });

  const totalEur = commercialPricing
    ? commercialPricing.grandTotalFinalPrice.cents / 100
    : allSelectedDishEntries.reduce(
        (sum, item) => sum + Number(item.dish.price ?? 0) * item.qty,
        0,
      );

  // Dishes for current selected day in DayPicker
  const actualMenuDayIndex = deliveryDayIndices[deliveryDay] ?? deliveryDay;
  const offerDishes = weeklyMenu?.days[actualMenuDayIndex]?.dishes ?? [];
  const dayDate = deliveryDates[deliveryDay] ?? weekStart;
  const currentDayQuantities = quantities[dayDate] ?? {};
  const currentDayMealsCount = Object.values(currentDayQuantities).reduce(
    (sum, qty) => sum + (qty > 0 ? qty : 0),
    0,
  );

  // Meal counts per delivery date for DayPicker badges
  const dayMealCounts: Record<string, number> = {};
  for (const [dDate, dayQtys] of Object.entries(quantities)) {
    const count = Object.values(dayQtys).reduce((sum, q) => sum + (q > 0 ? q : 0), 0);
    if (count > 0) {
      dayMealCounts[dDate] = count;
    }
  }

  // Items grouped by day for summary
  const itemsByDay = new Map<string, typeof allSelectedDishEntries>();
  for (const item of allSelectedDishEntries) {
    const list = itemsByDay.get(item.dayDate) ?? [];
    list.push(item);
    itemsByDay.set(item.dayDate, list);
  }
  const sortedDayDates = [...itemsByDay.keys()].sort();

  // Customer profile & addresses
  const { tenantId } = useAuth();
  const customerQuery = useCurrentCustomerId();
  const customerId = customerQuery.data ?? null;

  const addressesQuery = useQuery({
    queryKey: ["customer-addresses", tenantId, customerId],
    enabled: Boolean(tenantId && customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("id, label, street, city, zip, is_default")
        .eq("tenant_id", tenantId!)
        .eq("customer_id", customerId!)
        .is("deleted_at", null)
        .order("is_default", { ascending: false })
        .order("label", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        label: string | null;
        street: string;
        city: string | null;
        zip: string | null;
        is_default: boolean;
      }>;
    },
  });

  const addresses = addressesQuery.data ?? [];
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Welcome modal safety net
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [forcedStep, setForcedStep] = useState<OnboardingStep>("welcome");

  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const def = addresses.find((a) => a.is_default) ?? addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

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

  const isTenantOrderCreationFrozen = isEatCleanOrderCreationFrozen({
    tenantSlug: activeTenantSlug,
    tenantId,
  });

  async function onProgramDraft() {
    if (orderItems.length === 0 || programDraft.isPending || confirmOrder.isPending) return;

    // Safety net: check profile and address before firing mutation
    if (!customerId) {
      setForcedStep("identity");
      setWelcomeOpen(true);
      return;
    }
    if (addresses.length === 0) {
      setForcedStep("address");
      setWelcomeOpen(true);
      return;
    }

    try {
      const result = await programDraft.mutateAsync({
        weekStart,
        items: orderItems,
        offerCode: effectiveOfferCode,
        deliveryAddressId: selectedAddressId,
      });

      try {
        await confirmOrder.mutateAsync({
          orderId: result.order.id,
          expectedTotal: result.order.total != null ? Number(result.order.total) : undefined,
        });
      } catch (confirmErr) {
        console.warn("Auto-confirm deferred to order detail screen:", confirmErr);
      }

      void navigate({
        to: "/app/orders/$orderId",
        params: { orderId: result.order.id },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("EXPLICIT_ONBOARDING_REQUIRED") || msg.includes("PERMISSION_DENIED")) {
        setForcedStep("identity");
        setWelcomeOpen(true);
        toast.info("Para confirmar tu pedido necesitamos configurar tus datos de entrega.");
        return;
      }
      toast.error(msg);
    }
  }

  return (
    <div className="flex-1 flex flex-col pb-24">
      <ScreenHeader
        backTo={step === 1 ? "/app" : undefined}
        onBack={step > 1 ? () => setStep(1) : undefined}
        overline={t("customer:scheduleFlow")}
        title={stepTitles[step - 1]}
      />

      {isTenantOrderCreationFrozen && (
        <div className="mx-6 mb-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs">
          <p className="font-bold mb-1">{EATCLEAN_PARTIAL_LAUNCH_CONFIG.frozenMessage}</p>
          <p className="text-[11px] opacity-90">
            La creación de nuevos pedidos se encuentra pausada temporalmente mientras se completa la
            activación comercial. Puedes explorar los menús semanales y platos disponibles.
          </p>
        </div>
      )}

      {/* 2-Step Progress Indicator */}
      <div className="px-6 flex gap-2 mb-5">
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

      {/* STEP 1: MULTI-DAY BASKET SELECTION */}
      {step === 1 ? (
        <div className="px-6 space-y-6">
          {/* Week Navigator */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-muted-foreground">
                {t("customer:scheduleWeekTitle", "Semana de entrega")}
              </p>
              {activeWeek.weekOffset > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    activeWeek.resetToDefaultWeek();
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
                disabled={!activeWeek.canGoPrev}
                onClick={() => {
                  activeWeek.setWeekOffset((w) => Math.max(0, w - 1));
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
                    activeWeek.weekOffset === 0
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {activeWeek.weekOffset === 0
                    ? t("customer:currentWeekLabel", "Esta semana")
                    : activeWeek.weekOffset === 1
                      ? t("customer:nextWeekLabel", "Próxima semana")
                      : `+${activeWeek.weekOffset} semanas`}
                </span>
                <p className="text-sm font-extrabold text-foreground tracking-tight">
                  {activeWeek.weekLabel}
                </p>
              </div>
              <button
                type="button"
                disabled={!activeWeek.canGoNext}
                onClick={() => {
                  activeWeek.setWeekOffset((w) => w + 1);
                  setQuantities({});
                }}
                className="h-11 w-11 rounded-xl border border-border flex items-center justify-center text-foreground hover:bg-secondary disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label={t("customer:nextWeek", "Semana siguiente")}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Sticky DayPicker with Badges */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-3 -mx-6 px-6 border-b border-border/50">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {t("customer:deliveryDay", "Día de entrega")}
            </p>
            <DayPicker
              days={daysShort}
              dates={deliveryDates}
              mealCounts={dayMealCounts}
              activeIndex={deliveryDay}
              onSelect={setDeliveryDay}
              isDayDisabled={isDayDisabled}
            />
          </div>

          {/* Active Day Header */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-lg font-extrabold tracking-tight">{daysFull[deliveryDay]}</p>
              <p className="text-xs text-muted-foreground">
                {formatDeliveryDate(dayDate, i18n.language)}
              </p>
            </div>
            {currentDayMealsCount > 0 && (
              <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                {currentDayMealsCount}{" "}
                {currentDayMealsCount === 1 ? "comida seleccionada" : "comidas seleccionadas"}
              </span>
            )}
          </div>

          {/* Dishes List */}
          <div className="space-y-10 pb-16">
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
                <DishThumb emoji="🍽️" imageSrc={dishPhoto} size="xl" className="!rounded-[1.75rem]" />
                <p className="text-lg font-extrabold">{t("customer:menuEmptyDay")}</p>
              </div>
            ) : null}
          </div>

          {/* Persistent Floating Summary Bar */}
          {totalMealsCount > 0 && (
            <div className="fixed bottom-6 inset-x-0 z-30 px-6 pointer-events-none">
              <div className="mx-auto max-w-lg pointer-events-auto bg-foreground text-background p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-4">
                <div className="min-w-0 pl-1">
                  <p className="text-xs font-bold text-background/80 truncate">
                    {totalMealsCount} {totalMealsCount === 1 ? "comida" : "comidas"} en{" "}
                    {sortedDayDates.length} {sortedDayDates.length === 1 ? "día" : "días"}
                  </p>
                  <p className="text-lg font-extrabold tracking-tight tabular-nums leading-tight">
                    {fmt.currency(totalEur, { currency: "EUR" })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer transition-colors"
                >
                  <span>Ver resumen</span>
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* STEP 2: SUMMARY & CHECKOUT */}
      {step === 2 ? (
        <section className="px-6 space-y-8 pt-1 pb-4">
          {allSelectedDishEntries.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8 space-y-6">
              <DishThumb emoji="🥗" imageSrc={dishPhoto} size="hero" className="!rounded-[1.75rem]" />
              <div className="space-y-2 max-w-[20rem]">
                <p className="text-xl font-extrabold tracking-tight">
                  {t("customer:noDishesSelected")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("customer:noDishesSelectedHint")}
                </p>
              </div>
              <PrimaryCTA className="!h-14 !rounded-2xl w-full max-w-sm" onClick={() => setStep(1)}>
                {t("customer:chooseMeals")}
              </PrimaryCTA>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {/* Grouped Days */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-muted-foreground">
                      {totalMealsCount}{" "}
                      {totalMealsCount === 1 ? "comida seleccionada" : "comidas seleccionadas"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Editar selección
                    </button>
                  </div>

                  {sortedDayDates.map((dDate) => {
                    const dayItems = itemsByDay.get(dDate) ?? [];
                    const dIndex = deliveryDates.indexOf(dDate);
                    const dMeals = dayItems.reduce((s, it) => s + it.qty, 0);
                    const dayLabel = dIndex >= 0 ? daysFull[dIndex] : dDate;
                    const dateFormatted = formatDeliveryDate(dDate, i18n.language);

                    return (
                      <div
                        key={dDate}
                        className="space-y-3 bg-card/60 border border-border/80 rounded-2xl p-4"
                      >
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <p className="font-extrabold text-sm text-foreground">
                            {dayLabel}{" "}
                            <span className="font-normal text-muted-foreground text-xs">
                              ({dateFormatted})
                            </span>
                          </p>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {dMeals} {dMeals === 1 ? "comida" : "comidas"}
                          </span>
                        </div>
                        <ul className="space-y-3 pt-1">
                          {dayItems.map(({ dish, qty }) => (
                            <li
                              key={`${dDate}-${dish.id}`}
                              className="flex items-center justify-between gap-4"
                            >
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
                                    {dish.kcal > 0
                                      ? `${dish.kcal} kcal · ${dish.proteinG}g P`
                                      : "Nutrición no disponible"}
                                  </p>
                                </div>
                              </div>
                              <div className="bg-secondary px-2.5 py-1 rounded-xl font-extrabold text-xs tabular-nums">
                                {qty}x
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border/70" />

                {/* Delivery Address */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-muted-foreground">
                      {t("customer:deliveryAddress")}
                    </p>
                    <Link
                      to="/app/addresses"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {addresses.length === 0
                        ? t("customer:addAddress", "+ Añadir dirección")
                        : t("common:change", "Gestionar")}
                    </Link>
                  </div>

                  {addresses.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setForcedStep("address");
                        setWelcomeOpen(true);
                      }}
                      className="w-full rounded-2xl border border-dashed border-primary/40 p-4 bg-primary/5 flex items-center justify-between text-left cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 text-sm text-foreground">
                        <MapPin className="size-4 text-primary shrink-0" />
                        <span className="font-semibold">Añadir dirección de entrega</span>
                      </div>
                      <Plus className="size-4 text-primary" />
                    </button>
                  ) : addresses.length === 1 ? (
                    <div className="rounded-2xl border border-border bg-card p-3.5 flex items-start gap-3">
                      <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm">
                          {addresses[0].label || t("customer:addressHomeDefault")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {addresses[0].street}
                          {addresses[0].city ? `, ${addresses[0].city}` : ""}
                          {addresses[0].zip ? ` · ${addresses[0].zip}` : ""}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {addresses.map((a) => {
                        const isSelected = selectedAddressId === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setSelectedAddressId(a.id)}
                            className={cn(
                              "w-full text-left rounded-2xl border p-3 flex items-start gap-3 transition-all cursor-pointer",
                              isSelected
                                ? "border-primary bg-primary/5 shadow-2xs"
                                : "border-border bg-card hover:border-border/80",
                            )}
                          >
                            <MapPin
                              className={cn(
                                "size-4 shrink-0 mt-0.5",
                                isSelected ? "text-primary" : "text-muted-foreground",
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-sm truncate">
                                  {a.label || t("customer:addressHomeDefault")}
                                </p>
                                {a.is_default && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 rounded px-1 py-0.2">
                                    {t("common:default")}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {a.street}
                                {a.city ? `, ${a.city}` : ""}
                                {a.zip ? ` · ${a.zip}` : ""}
                              </p>
                            </div>
                            {isSelected && (
                              <span className="size-5 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0">
                                <Check className="size-3 stroke-[3]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-border/70" />

                {/* Total */}
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {t("customer:total")}
                  </p>
                  <p className="text-3xl font-extrabold tracking-tight mt-1 tabular-nums">
                    {fmt.currency(totalEur, { currency: "EUR" })}
                  </p>
                </div>
              </div>

              {/* Confirm Order CTA */}
              <div className="pt-4">
                <PrimaryCTA
                  disabled={
                    programDraft.isPending || confirmOrder.isPending || isTenantOrderCreationFrozen
                  }
                  onClick={() => {
                    if (isTenantOrderCreationFrozen) return;
                    void onProgramDraft();
                  }}
                >
                  {isTenantOrderCreationFrozen
                    ? EATCLEAN_PARTIAL_LAUNCH_CONFIG.frozenMessage
                    : programDraft.isPending || confirmOrder.isPending
                      ? "Confirmando pedido..."
                      : t("customer:confirmOrder")}
                </PrimaryCTA>
              </div>
            </>
          )}
        </section>
      ) : null}

      {/* Safety Net Onboarding Modal */}
      <CustomerWelcomeModal
        open={welcomeOpen}
        onOpenChange={setWelcomeOpen}
        forcedStep={forcedStep}
        onCompleted={() => {
          setWelcomeOpen(false);
          void addressesQuery.refetch();
        }}
      />
    </div>
  );
}

function formatDeliveryDate(isoDate: string, locale: string): string {
  if (!isoDate || !isoDate.includes("-")) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(locale || "es", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}
