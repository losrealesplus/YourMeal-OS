import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CalendarClock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DishCard,
  OrderCard,
  ScreenHeader,
  SectionHeader,
  PrimaryCTA,
  EmptyState,
  DashboardSkeleton,
  DashboardError,
  OfflineBanner,
  ConfirmedOrderHero,
  PendingOrderHero,
  DeliveryHero,
  OnboardingHero,
  DashboardStateSwitcher,
  dashboardStateIds,
  isDashboardState,
  type DashboardStateId,
} from "@/components/consumer";
import { MOCK_DISHES, MOCK_ORDERS, type MockOrder } from "@/lib/mock-catalog";

/**
 * Screen: Customer · Home Dashboard (todos los estados)
 * - Objetivo operacional: momento «Antes de empezar la semana» — anticipar la programación.
 * - Capability: orders.schedule + weekly-menu.browse
 * - Core Object(s): Order · WeeklyMenu · Delivery
 * Estados diseñados: default · empty · withOrders · confirmed · pending · loading · error · offline
 * Ver docs/15-product/PRODUCT_RULES.md y CUSTOMER_APP_SCREEN_MAP.md
 */
export const Route = createFileRoute("/_authenticated/app/")({
  validateSearch: (search: Record<string, unknown>): { state?: DashboardStateId } => ({
    state: isDashboardState(search.state) ? search.state : undefined,
  }),
  component: CustomerHome,
});

function CustomerHome() {
  const { t } = useTranslation(["customer", "common"]);
  const { user } = useAuth();
  const navigate = useNavigate({ from: "/app" });
  const search = Route.useSearch();
  const state: DashboardStateId = search.state ?? "default";

  const name =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "";

  const tagLabels = {
    vegan: t("customer:tagVegan"),
    vegetarian: t("customer:tagVegetarian"),
    glutenFree: t("customer:tagGlutenFree"),
    lactoseFree: t("customer:tagLactoseFree"),
    spicy: t("customer:tagSpicy"),
  };

  const statusLabels = {
    pending: t("customer:statusPending"),
    preparing: t("customer:statusPreparing"),
    dispatched: t("customer:statusDispatched"),
    delivered: t("customer:statusDelivered"),
    cancelled: t("customer:statusCancelled"),
  };

  const stateOptions = dashboardStateIds.map((id) => ({
    id,
    label: t(`customer:state${id.charAt(0).toUpperCase()}${id.slice(1)}` as const),
  }));

  return (
    <div className="flex-1 flex flex-col">
      <ScreenHeader
        overline={t("common:tenant")}
        title={`${t("customer:greeting")}, ${name}`}
        subtitle={t("customer:assistantHint")}
      />

      <DashboardStateSwitcher
        states={stateOptions}
        current={state}
        onSelect={(id) =>
          navigate({
            search: () => ({
              state: id === "default" ? undefined : (id as DashboardStateId),
            }),
          })
        }
        label={t("customer:dashboardState")}
      />

      <DashboardBody state={state} tagLabels={tagLabels} statusLabels={statusLabels} />
    </div>
  );
}

function DashboardBody({
  state,
  tagLabels,
  statusLabels,
}: {
  state: DashboardStateId;
  tagLabels: Record<string, string>;
  statusLabels: Record<string, string>;
}) {
  const { t } = useTranslation("customer");
  const navigate = useNavigate({ from: "/app" });

  if (state === "loading") {
    return <DashboardSkeleton label={t("loadingDashboard")} />;
  }

  if (state === "error") {
    return (
      <DashboardError
        title={t("errorTitle")}
        hint={t("errorHint")}
        retryLabel={t("retry")}
        onRetry={() =>
          navigate({ search: () => ({ state: undefined }) })
        }
      />
    );
  }

  // Data selection per state
  const confirmedOrder: MockOrder = { ...MOCK_ORDERS[0], status: "preparing" };
  const pendingOrder: MockOrder = { ...MOCK_ORDERS[0], status: "pending" };
  const deliveryOrder = MOCK_ORDERS.find((o) => o.status !== "delivered");
  const featured = MOCK_DISHES.slice(0, 3);
  const isEmpty = state === "empty";
  const showOffline = state === "offline";

  return (
    <>
      {showOffline ? (
        <div className="mb-4">
          <OfflineBanner
            title={t("offlineTitle")}
            hint={t("offlineHint")}
          />
        </div>
      ) : null}

      <section className="px-6 space-y-4">
        {state === "confirmed" ? (
          <ConfirmedOrderHero
            order={confirmedOrder}
            overline={t("confirmedOverline")}
            title={t("confirmedTitle")}
            mealsLabel={t("meals")}
            ctaLabel={t("viewDetails")}
          />
        ) : state === "pending" ? (
          <PendingOrderHero
            order={pendingOrder}
            overline={t("pendingOverline")}
            title={t("pendingTitle")}
            hint={t("pendingHint")}
            ctaLabel={t("finishOrder")}
          />
        ) : isEmpty ? (
          <OnboardingHero
            overline={t("onboardingOverline")}
            title={t("onboardingTitle")}
            hint={t("onboardingHint")}
            ctaLabel={t("scheduleCta")}
          />
        ) : (
          <OnboardingHero
            overline={t("momentTitle")}
            title={t("scheduleTitle")}
            hint={t("scheduleHint")}
            ctaLabel={t("scheduleCta")}
          />
        )}

        {isEmpty ? (
          <EmptyState
            icon={<CalendarClock className="size-6" aria-hidden />}
            title={t("emptyTitle")}
            hint={t("emptyHint")}
          />
        ) : deliveryOrder ? (
          <DeliveryHero
            order={deliveryOrder}
            overline={t("nextDelivery")}
            mealsLabel={t("meals")}
          />
        ) : (
          <EmptyState
            icon={<CalendarClock className="size-6" aria-hidden />}
            title={t("noOrdersTitle")}
            hint={t("noOrdersHint")}
          />
        )}

        {!isEmpty ? (
          <div className="grid grid-cols-2 gap-3">
            <Stat label={t("mealsOrdered")} value={String(deliveryOrder?.meals ?? 0)} />
            <Stat
              label={t("daysCovered")}
              value={String(Math.ceil((deliveryOrder?.meals ?? 0) / 2))}
            />
          </div>
        ) : null}
      </section>

      {!isEmpty ? (
        <>
          <SectionHeader
            title={t("featuredDishes")}
            action={
              <Link to="/app/menu" className="font-bold text-primary focus-visible:outline-none focus-visible:underline">
                {t("seeAll")}
              </Link>
            }
          />
          <div className="px-6 space-y-3 pb-8">
            {featured.map((d) => (
              <DishCard key={d.id} dish={d} tagLabels={tagLabels} />
            ))}
          </div>

          <SectionHeader title={t("recentOrders")} />
          <div className="px-6 space-y-3 pb-6">
            {(state === "withOrders" ? MOCK_ORDERS : MOCK_ORDERS.slice(0, 2)).map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                mealsLabel={t("meals")}
                statusLabels={statusLabels}
              />
            ))}
          </div>
        </>
      ) : null}

      <div className="px-6 pb-4">
        <Link to="/app/schedule" className="block">
          <PrimaryCTA>{t("scheduleCta")}</PrimaryCTA>
        </Link>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-raised border border-border/60 rounded-2xl p-4">
      <p className="meta-label">{label}</p>
      <p className="text-3xl font-extrabold tracking-tight mt-2 font-mono tabular-nums leading-none">
        {value}
      </p>
    </div>
  );
}
