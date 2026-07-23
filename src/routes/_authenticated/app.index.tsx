import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import {
  ChevronRight,
  Heart,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  PrimaryCTA,
  DashboardSkeleton,
  DashboardError,
  OfflineBanner,
  DashboardStateSwitcher,
  dashboardStateIds,
  isDashboardState,
  type DashboardStateId,
} from "@/components/consumer";
import { brandConfig } from "@/tenant/brand-config";

/**
 * SCR-005 · Home — CJ-001
 * Food app, not dashboard. Dominant question + one CTA.
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

  const stateOptions = dashboardStateIds.map((id) => ({
    id,
    label: t(`customer:state${id.charAt(0).toUpperCase()}${id.slice(1)}` as const),
  }));

  return (
    <div className="flex-1 flex flex-col">
      {isStaff ? (
        <div className="opacity-40 hover:opacity-100 transition-opacity">
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
        </div>
      ) : null}
      <HomeBody name={name} state={state} />
    </div>
  );
}

function HomeBody({
  name,
  state,
}: {
  name: string;
  state: DashboardStateId;
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
        onRetry={() => navigate({ search: () => ({ state: undefined }) })}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-8 pb-8">
      {state === "offline" ? (
        <div className="mb-4">
          <OfflineBanner title={t("offlineTitle")} hint={t("offlineHint")} />
        </div>
      ) : null}

      {/* Brand mark */}
      <p className="text-center text-sm font-extrabold tracking-[0.2em] uppercase text-primary">
        {brandConfig.name}
      </p>

      {/* Hero — one question dominates */}
      <div className="mt-10 text-center">
        <h1 className="text-[1.75rem] font-extrabold tracking-tight text-balance">
          {t("greeting")}, {name}
        </h1>
        <p className="mt-4 text-xl font-semibold leading-snug text-foreground/90 text-pretty max-w-[18rem] mx-auto">
          {t("homeHeroQuestion")}
        </p>
      </div>

      <div className="mt-8">
        <Link to="/app/schedule" className="block">
          <PrimaryCTA className="!h-16 !text-base !rounded-[1.25rem]">
            {t("scheduleCta")}
          </PrimaryCTA>
        </Link>
      </div>

      {/* Quiet shortcuts — food app, not KPIs */}
      <div className="mt-12 space-y-1 border-t border-border/60 pt-6">
        <QuietLink
          to="/app/menu"
          icon={<Heart className="size-5" strokeWidth={2} />}
          label={t("homeFavorites")}
        />
        <QuietLink
          to="/app/menu"
          icon={<UtensilsCrossed className="size-5" strokeWidth={2} />}
          label={t("homeThisWeekMenu")}
        />
        <QuietLink
          to="/app/orders"
          icon={<Truck className="size-5" strokeWidth={2} />}
          label={t("nextDelivery")}
        />
      </div>
    </div>
  );
}

function QuietLink({
  to,
  icon,
  label,
}: {
  to: "/app/menu" | "/app/orders";
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 py-4 border-b border-border/50 last:border-0 active:opacity-70"
    >
      <span className="text-primary">{icon}</span>
      <span className="flex-1 text-[15px] font-semibold">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground/70" />
    </Link>
  );
}
