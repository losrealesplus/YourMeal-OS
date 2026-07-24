import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { ChevronRight, Heart, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  PrimaryCTA,
  DashboardSkeleton,
  DashboardError,
  OfflineBanner,
  DashboardStateSwitcher,
  UpcomingDeliveryCard,
  dashboardStateIds,
  isDashboardState,
  type DashboardStateId,
  MenuDishPost,
  dishMacrosLine,
} from "@/components/consumer";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { BrandLeafMark } from "@/components/tenant/brand-leaf-mark";
import { PoweredByLine } from "@/components/tenant/tenant-brand-scope";
import { useWeeklyMenu } from "@/hooks/use-weekly-menu";
import { useUpcomingDelivery } from "@/hooks/use-upcoming-delivery";
import { utcWeekStartMonday } from "@/modules/weekly-menu/application/week-dates";
import dishPhoto from "@/assets/eatclean-hero.jpg";

/**
 * SCR-005 · Home — CJ-001 + EP-002A.1 Próxima entrega
 * Customer Weekly Cycle: next delivery is the information center.
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
  const weekStart = utcWeekStartMonday();
  const { data: weeklyMenu } = useWeeklyMenu(weekStart);
  const { data: upcoming, isLoading: upcomingLoading } = useUpcomingDelivery();

  const featured =
    weeklyMenu?.days.flatMap((d) => d.dishes).find(Boolean) ?? null;
  const hasUpcoming = upcoming?.kind === "upcoming";

  const macroLabels = {
    protein: t("macroProtein"),
    carbs: t("macroCarbs"),
    fat: t("macroFat"),
  };

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
    <div className="flex-1 flex flex-col px-6 pt-8 pb-10">
      {state === "offline" ? (
        <div className="mb-4">
          <OfflineBanner title={t("offlineTitle")} hint={t("offlineHint")} />
        </div>
      ) : null}

      <div className="flex justify-center">
        <TenantLogo height={44} />
      </div>

      <div className="mt-10 text-center space-y-3">
        <h1 className="text-[1.75rem] font-extrabold tracking-tight text-balance">
          {t("greeting")}
          {name ? ` ${name}` : ""}
        </h1>
        <p className="text-lg font-semibold leading-snug text-foreground/90 text-pretty max-w-[20rem] mx-auto">
          {hasUpcoming ? t("assistantHint") : t("homeMenuReady")}
        </p>
      </div>

      {/* EP-002A.1 — information center */}
      <div className="mt-8">
        <UpcomingDeliveryCard result={upcoming} isLoading={upcomingLoading} />
      </div>

      {!hasUpcoming ? (
        <div className="mt-4">
          <Link to="/app/menu" className="block">
            <PrimaryCTA className="!h-14 !text-base !rounded-[1.25rem]" variant="outline">
              {t("homeViewMenuCta")}
            </PrimaryCTA>
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <Link
            to="/app/menu"
            className="flex h-12 items-center justify-center rounded-2xl border border-border text-sm font-bold"
          >
            {t("homeViewMenuCta")}
          </Link>
        </div>
      )}

      {featured && !hasUpcoming ? (
        <div className="mt-12 space-y-5">
          <p className="text-sm font-semibold text-muted-foreground tracking-wide">
            {t("homeFeatured")}
          </p>
          <MenuDishPost
            dish={featured}
            imageSrc={dishPhoto}
            macrosLabel={dishMacrosLine(featured, macroLabels)}
            cta={
              <Link
                to="/app/menu"
                className="flex h-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-[15px] font-bold"
              >
                {t("homeViewMenuCta")}
              </Link>
            }
          />
        </div>
      ) : null}

      <div className="mt-12 space-y-1 border-t border-border/60 pt-6">
        <QuietLink
          to="/app/schedule"
          icon={<UtensilsCrossed className="size-5" strokeWidth={2} />}
          label={t("scheduleCta")}
        />
        <QuietLink
          to="/app/favorites"
          icon={<Heart className="size-5" strokeWidth={2} />}
          label={t("homeFavorites")}
        />
      </div>

      {/* EP-002A.1.1 — secure Ops Center entry (checks staff session) */}
      <div className="mt-10 flex flex-col items-center gap-3 pb-2">
        <BrandLeafMark />
        <PoweredByLine />
      </div>
    </div>
  );
}

function QuietLink({
  to,
  icon,
  label,
}: {
  to: "/app/menu" | "/app/schedule" | "/app/favorites";
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
