import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, CalendarClock, Sparkles, Truck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFmt } from "@/i18n/localization-provider";
import {
  DishCard,
  OrderCard,
  ScreenHeader,
  SectionHeader,
  PrimaryCTA,
  EmptyState,
} from "@/components/consumer";
import { MOCK_DISHES, MOCK_ORDERS } from "@/lib/mock-catalog";

/**
 * Screen: Customer · Home Dashboard
 * - Objetivo operacional: momento «Antes de empezar la semana» — anticipar la programación.
 * - Capability: orders.schedule + weekly-menu.browse (consumidoras del OM)
 * - Core Object(s): Order · WeeklyMenu · Delivery
 * Ver docs/15-product/PRODUCT_RULES.md y CUSTOMER_APP_SCREEN_MAP.md
 */
export const Route = createFileRoute("/_authenticated/app/")({
  component: CustomerHome,
});

function CustomerHome() {
  const { t } = useTranslation(["customer", "common"]);
  const { user } = useAuth();
  const fmt = useFmt();
  const name =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "";

  const nextOrder = MOCK_ORDERS.find((o) => o.status !== "delivered");
  const featured = MOCK_DISHES.slice(0, 3);

  const tagLabels = {
    vegan: t("customer:tagVegan"),
    vegetarian: t("customer:tagVegetarian"),
    glutenFree: t("customer:tagGlutenFree"),
    lactoseFree: t("customer:tagLactoseFree"),
    spicy: t("customer:tagSpicy"),
  };

  return (
    <div className="flex-1 flex flex-col">
      <ScreenHeader
        overline={t("common:tenant")}
        title={`${t("customer:greeting")}, ${name}`}
        subtitle={t("customer:assistantHint")}
      />

      <section className="px-6 space-y-4">
        {/* Momento de decisión: programar la semana */}
        <Link
          to="/app/schedule"
          className="block relative overflow-hidden bg-primary text-primary-foreground rounded-3xl p-5"
        >
          <div className="flex items-start gap-3">
            <div className="grid place-items-center size-11 rounded-xl bg-primary-foreground/15 shrink-0">
              <Sparkles className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                {t("customer:momentTitle")}
              </p>
              <p className="font-bold text-lg leading-snug mt-1">
                {t("customer:scheduleTitle")}
              </p>
              <p className="text-xs opacity-80 mt-1">
                {t("customer:scheduleHint")}
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 bg-primary-foreground text-primary text-xs font-bold uppercase tracking-widest py-2.5 px-4 rounded-lg">
            {t("customer:scheduleCta")}
          </div>
        </Link>

        {/* Próxima entrega */}
        {nextOrder ? (
          <Link
            to="/app/orders/$orderId"
            params={{ orderId: nextOrder.id }}
            className="block bg-card border border-border rounded-2xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="grid place-items-center size-10 rounded-xl bg-secondary shrink-0">
                <Truck className="size-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="meta-label">{t("customer:nextDelivery")}</p>
                <p className="font-bold mt-1">
                  {fmt.dateTime(nextOrder.deliveryDateIso)}
                </p>
              </div>
              <span className="font-mono text-sm font-extrabold tabular-nums">
                {nextOrder.meals} {t("customer:meals")}
              </span>
            </div>
          </Link>
        ) : (
          <EmptyState
            icon={<CalendarClock className="size-6" />}
            title={t("customer:noOrdersTitle")}
            hint={t("customer:noOrdersHint")}
          />
        )}

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-3">
          <Stat label={t("customer:mealsOrdered")} value={String(nextOrder?.meals ?? 0)} />
          <Stat
            label={t("customer:daysCovered")}
            value={String(Math.ceil((nextOrder?.meals ?? 0) / 2))}
          />
        </div>
      </section>

      <SectionHeader
        title={t("customer:featuredDishes")}
        action={
          <Link to="/app/menu" className="font-bold text-primary">
            {t("customer:seeAll")}
          </Link>
        }
      />
      <div className="px-6 space-y-3 pb-8">
        {featured.map((d) => (
          <DishCard key={d.id} dish={d} tagLabels={tagLabels} />
        ))}
      </div>

      <SectionHeader title={t("customer:recentOrders")} />
      <div className="px-6 space-y-3 pb-6">
        {MOCK_ORDERS.slice(0, 2).map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            mealsLabel={t("customer:meals")}
            statusLabels={{
              pending: t("customer:statusPending"),
              preparing: t("customer:statusPreparing"),
              dispatched: t("customer:statusDispatched"),
              delivered: t("customer:statusDelivered"),
              cancelled: t("customer:statusCancelled"),
            }}
          />
        ))}
      </div>

      <div className="px-6 pb-4">
        <Link to="/app/schedule" className="block">
          <PrimaryCTA>{t("customer:scheduleCta")}</PrimaryCTA>
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="meta-label">{label}</p>
      <p className="text-2xl font-extrabold tracking-tight mt-2 font-mono tabular-nums">
        {value}
      </p>
    </div>
  );
}
