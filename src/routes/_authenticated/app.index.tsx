import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import {
  CalendarClock,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Truck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useDishes } from "@/hooks/use-dishes";
import {
  DishCard,
  PrimaryCTA,
  EmptyState,
  DashboardSkeleton,
  DashboardError,
  OfflineBanner,
  DashboardStateSwitcher,
  dashboardStateIds,
  isDashboardState,
  type DashboardStateId,
} from "@/components/consumer";
import { brandConfig } from "@/tenant/brand-config";
import heroImage from "@/assets/eatclean-hero.jpg";

/**
 * SCR-005 · Home — CJ-001
 * Experience Refactor: food app home, not admin dashboard.
 */
export const Route = createFileRoute("/_authenticated/app/")({
  validateSearch: (search: Record<string, unknown>): { state?: DashboardStateId } => ({
    state: isDashboardState(search.state) ? search.state : undefined,
  }),
  component: CustomerHome,
});

function CustomerHome() {
  const { t } = useTranslation(["customer", "common"]);
  const { user, isStaff } = useAuth();
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

  const stateOptions = dashboardStateIds.map((id) => ({
    id,
    label: t(`customer:state${id.charAt(0).toUpperCase()}${id.slice(1)}` as const),
  }));

  return (
    <div className="flex-1 flex flex-col">
      {isStaff ? (
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
      ) : null}

      <HomeBody name={name} state={state} tagLabels={tagLabels} />
    </div>
  );
}

function HomeBody({
  name,
  state,
  tagLabels,
}: {
  name: string;
  state: DashboardStateId;
  tagLabels: Record<string, string>;
}) {
  const { t } = useTranslation("customer");
  const navigate = useNavigate({ from: "/app" });
  const { data: catalogDishes = [] } = useDishes();
  const featured = catalogDishes.slice(0, 3);

  if (state === "loading") {
    return <DashboardSkeleton label={t("loadingDashboard")} />;
  }

  if (state === "error") {
    return (
      <DashboardError
        title={t("errorTitle")}
        hint={t("errorHint")}
        retryLabel={t("retry")}
        onRetry={() => navigate({ search: () => ({ state: undefined }) })}
      />
    );
  }

  return (
    <>
      {state === "offline" ? (
        <div className="mb-2 px-6">
          <OfflineBanner title={t("offlineTitle")} hint={t("offlineHint")} />
        </div>
      ) : null}

      <section className="px-6 pt-6">
        <p className="meta-label text-primary">{brandConfig.name}</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-balance">
          {t("greeting")}, {name}
        </h1>
      </section>

      <section className="px-6 mt-5">
        <div className="relative rounded-[1.75rem] overflow-hidden shadow-sm">
          <img
            src={heroImage}
            alt=""
            width={1600}
            height={1200}
            className="w-full h-56 object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 35%, rgba(26,46,36,0.75) 100%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">
              {t("scheduleTitle")}
            </p>
            <p className="text-lg font-extrabold tracking-tight mt-1 text-balance">
              {t("onboardingTitle")}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Link to="/app/schedule" className="block">
            <PrimaryCTA>{t("scheduleCta")}</PrimaryCTA>
          </Link>
        </div>
      </section>

      <section className="px-6 mt-8 grid gap-3">
        <HomeCard
          to="/app/orders"
          icon={<Truck className="size-5" />}
          title={t("nextDelivery")}
          hint={t("homeCardDeliveryHint")}
        />
        <HomeCard
          to="/app/orders"
          icon={<CalendarClock className="size-5" />}
          title={t("homeCardCurrentOrder")}
          hint={t("homeCardCurrentHint")}
        />
        <HomeCard
          to="/app/orders"
          icon={<RefreshCw className="size-5" />}
          title={t("homeCardRepeat")}
          hint={t("homeCardRepeatHint")}
        />
        <HomeCard
          to="/app/menu"
          icon={<Sparkles className="size-5" />}
          title={t("promotions")}
          hint={t("homeCardPromoHint")}
        />
      </section>

      {featured.length > 0 ? (
        <>
          <div className="px-6 mt-10 mb-3 flex items-end justify-between">
            <h2 className="text-lg font-extrabold tracking-tight">{t("featuredDishes")}</h2>
            <Link
              to="/app/menu"
              className="text-sm font-bold text-primary focus-visible:outline-none focus-visible:underline"
            >
              {t("seeAll")}
            </Link>
          </div>
          <div className="px-6 space-y-3 pb-10">
            {featured.map((d) => (
              <DishCard key={d.id} dish={d} tagLabels={tagLabels} />
            ))}
          </div>
        </>
      ) : (
        <div className="px-6 py-10">
          <EmptyState
            icon={<CalendarClock className="size-6" aria-hidden />}
            title={t("emptyTitle")}
            hint={t("emptyHint")}
          />
        </div>
      )}
    </>
  );
}

function HomeCard({
  to,
  icon,
  title,
  hint,
}: {
  to: "/app/orders" | "/app/menu";
  icon: ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-3xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.99]"
    >
      <div className="grid place-items-center size-12 rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{hint}</p>
      </div>
      <ChevronRight className="size-5 text-muted-foreground" />
    </Link>
  );
}
