import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import {
  DishCard,
  DayPicker,
  PrimaryCTA,
  ScreenHeader,
  SectionHeader,
} from "@/components/consumer";
import { useFmt } from "@/i18n/localization-provider";
import { useWeeklyMenu } from "@/hooks/use-weekly-menu";
import { useProgramDraftOrder } from "@/hooks/use-program-draft-order";
import { utcWeekDates, utcWeekStartMonday } from "@/modules/weekly-menu/application/week-dates";
import { cn } from "@/lib/utils";

/**
 * Screen: Customer · Schedule Weekly Order (3-step flow)
 * - Objetivo operacional: cerrar el pedido semanal antes del corte.
 * - Capability: orders.write (program Draft — CAP-004)
 * - Core Object(s): Order · WeeklyMenu · Delivery
 * - CAP-003: step 2 offers dishes from published menu day
 * - CAP-004: step 3 persists Draft order + audit_log (no Confirm — CAP-006)
 */
export const Route = createFileRoute("/_authenticated/app/schedule")({
  component: ScheduleFlow,
});

type Step = 1 | 2 | 3;

function ScheduleFlow() {
  const { t } = useTranslation(["customer", "common"]);
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [mealsPerDay, setMealsPerDay] = useState(2);
  const [deliveryDay, setDeliveryDay] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const fmt = useFmt();
  const weekStart = utcWeekStartMonday();
  const { data: weeklyMenu } = useWeeklyMenu(weekStart);
  const programDraft = useProgramDraftOrder();

  const days = [
    t("customer:dayMon"), t("customer:dayTue"), t("customer:dayWed"),
    t("customer:dayThu"), t("customer:dayFri"), t("customer:daySat"),
    t("customer:daySun"),
  ];
  const tagLabels = {
    vegan: t("customer:tagVegan"),
    vegetarian: t("customer:tagVegetarian"),
    glutenFree: t("customer:tagGlutenFree"),
    lactoseFree: t("customer:tagLactoseFree"),
    spicy: t("customer:tagSpicy"),
  };

  const stepTitles = [
    t("customer:scheduleStep1"),
    t("customer:scheduleStep2"),
    t("customer:scheduleStep3"),
  ];

  const offerDishes = weeklyMenu?.days[deliveryDay]?.dishes ?? [];
  const dayDate = utcWeekDates(weekStart)[deliveryDay] ?? weekStart;
  // Display-only scaffold estimate — authoritative total is computed server-side (INC-01).
  const totalCents = selected.length * 990;
  const totalEur = totalCents / 100;

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

  return (
    <div className="flex-1 flex flex-col pb-4">
      <ScreenHeader
        backTo="/app"
        overline={t("customer:scheduleFlow")}
        title={stepTitles[step - 1]}
      />

      {/* Stepper */}
      <div className="px-6 flex gap-2 mb-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={cn(
              "flex-1 h-1.5 rounded-full",
              step >= n ? "bg-primary" : "bg-secondary",
            )}
          />
        ))}
      </div>

      {step === 1 ? (
        <section className="px-6 space-y-6">
          <div>
            <p className="meta-label mb-2">{t("customer:mealsPerDay")}</p>
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
            <p className="meta-label mb-2">{t("customer:deliveryDay")}</p>
            <DayPicker days={days} activeIndex={deliveryDay} onSelect={setDeliveryDay} />
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <>
          <SectionHeader title={t("customer:chooseMeals")} />
          <div className="px-6 space-y-3">
            {offerDishes.map((d) => {
              const active = selected.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() =>
                    setSelected((s) =>
                      s.includes(d.id) ? s.filter((x) => x !== d.id) : [...s, d.id],
                    )
                  }
                  className={cn(
                    "w-full text-left rounded-2xl transition-all",
                    active ? "ring-2 ring-primary" : "",
                  )}
                >
                  <div className="relative">
                    <DishCard dish={d} tagLabels={tagLabels} />
                    {active ? (
                      <div className="absolute top-3 right-10 grid place-items-center size-7 rounded-full bg-primary text-primary-foreground">
                        <Check className="size-4" />
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <section className="px-6 space-y-4">
          <div className="rounded-3xl border border-border/70 bg-card p-6 space-y-4 shadow-sm">
            <p className="meta-label text-primary">{t("customer:orderSummary")}</p>
            <h2 className="text-xl font-extrabold tracking-tight">
              {t("customer:summaryReadyTitle")}
            </h2>
            <Row label={t("customer:mealsPerDay")} value={String(mealsPerDay)} />
            <Row label={t("customer:deliveryDay")} value={days[deliveryDay]} />
            <Row
              label={t("customer:mealsSelected")}
              value={`${selected.length} ${t("customer:meals")}`}
            />
          </div>
          <div className="rounded-3xl border border-border/70 bg-card p-6 space-y-3 shadow-sm">
            <Row
              label={t("customer:subtotal")}
              value={fmt.currency(totalEur, { currency: "EUR" })}
            />
            <Row
              label={t("customer:deliveryFee")}
              value={fmt.currency(0, { currency: "EUR" })}
            />
            <div className="border-t border-border pt-3 mt-1">
              <Row
                label={t("customer:total")}
                value={fmt.currency(totalEur, { currency: "EUR" })}
                emphasis
              />
            </div>
          </div>
          {programDraft.isError ? (
            <p className="text-sm text-destructive" role="alert">
              {(programDraft.error as Error)?.message ?? "Error"}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="px-6 mt-auto pt-8 space-y-3">
        {step < 3 ? (
          <PrimaryCTA onClick={() => setStep(((step + 1) as Step))}>
            {t("common:continue")}
          </PrimaryCTA>
        ) : (
          <PrimaryCTA
            disabled={selected.length === 0 || programDraft.isPending}
            onClick={() => {
              void onProgramDraft();
            }}
          >
            {t("customer:confirmOrder")}
          </PrimaryCTA>
        )}
      </div>
    </div>
  );
}

function Row({
  label, value, emphasis,
}: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "text-sm",
          emphasis ? "font-bold text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-mono tabular-nums text-sm",
          emphasis ? "text-lg font-extrabold" : "font-semibold",
        )}
      >
        {value}
      </span>
    </div>
  );
}
