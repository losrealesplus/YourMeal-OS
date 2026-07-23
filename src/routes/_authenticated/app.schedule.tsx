import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { useDishes } from "@/hooks/use-dishes";
import { cn } from "@/lib/utils";

/**
 * Screen: Customer · Schedule Weekly Order (3-step flow)
 * - Objetivo operacional: cerrar el pedido semanal antes del corte.
 * - Capability: orders.schedule (declarada; sin lógica de negocio en UI)
 * - Core Object(s): Order · WeeklyMenu · Delivery
 * - CAP-002: step 2 meal picker uses useDishes() (real catalog; no persist yet)
 * NOTE (scaffold): mantiene estado local; NO persiste. Cuando exista OrderService
 * se conectará por Ports declarados en 14-application.
 */
export const Route = createFileRoute("/_authenticated/app/schedule")({
  component: ScheduleFlow,
});

type Step = 1 | 2 | 3;

function ScheduleFlow() {
  const { t } = useTranslation(["customer", "common"]);
  const [step, setStep] = useState<Step>(1);
  const [mealsPerDay, setMealsPerDay] = useState(2);
  const [deliveryDay, setDeliveryDay] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const fmt = useFmt();
  const { data: catalogDishes = [] } = useDishes();

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

  const total = selected.length * 990; // mock EUR cents

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
            {catalogDishes.map((d) => {
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
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <Row label={t("customer:mealsPerDay")} value={String(mealsPerDay)} />
            <Row label={t("customer:deliveryDay")} value={days[deliveryDay]} />
            <Row
              label={t("customer:mealsSelected")}
              value={`${selected.length} ${t("customer:meals")}`}
            />
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
            <Row
              label={t("customer:subtotal")}
              value={fmt.currency(total / 100, { currency: "EUR" })}
            />
            <Row
              label={t("customer:deliveryFee")}
              value={fmt.currency(0, { currency: "EUR" })}
            />
            <div className="border-t border-border pt-3 mt-1">
              <Row
                label={t("customer:total")}
                value={fmt.currency(total / 100, { currency: "EUR" })}
                emphasis
              />
            </div>
          </div>
        </section>
      ) : null}

      <div className="px-6 mt-auto pt-8 space-y-3">
        {step < 3 ? (
          <PrimaryCTA onClick={() => setStep(((step + 1) as Step))}>
            {t("common:continue")}
          </PrimaryCTA>
        ) : (
          <Link to="/app" className="block">
            <PrimaryCTA disabled={selected.length === 0}>
              {t("customer:confirmOrder")}
            </PrimaryCTA>
          </Link>
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
