import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Heart, Plus, UtensilsCrossed } from "lucide-react";
import {
  DishThumb,
  EmptyState,
  PrimaryCTA,
  ScreenHeader,
} from "@/components/consumer";
import {
  useCustomerPreferences,
  useToggleFavorite,
} from "@/hooks/use-customer-preferences";
import type { PreferenceDishView } from "@/modules/customer-preferences";
import { cn } from "@/lib/utils";

/**
 * EP-002A.3 · Favoritos / Customer Preferences
 * Explicit hearts + frequency suggestions (never auto-marked).
 */
export const Route = createFileRoute("/_authenticated/app/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { t } = useTranslation(["customer", "common"]);
  const { data, isLoading } = useCustomerPreferences();
  const toggle = useToggleFavorite();

  const favorites = data?.favorites ?? [];
  const suggestions = data?.suggestions ?? [];
  const empty = !isLoading && favorites.length === 0 && suggestions.length === 0;

  return (
    <div className="flex-1 flex flex-col pb-6">
      <ScreenHeader
        overline={t("common:tenant")}
        title={t("customer:favoritesTitle")}
        subtitle={t("customer:favoritesHint")}
      />

      <div className="px-6 space-y-8">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-28 rounded-3xl bg-muted/40 animate-pulse" />
            <div className="h-28 rounded-3xl bg-muted/40 animate-pulse" />
          </div>
        ) : empty ? (
          <EmptyState
            icon={<Heart className="size-6" />}
            title={t("customer:favoritesEmptyTitle")}
            hint={t("customer:favoritesEmptyHint")}
          />
        ) : (
          <>
            {favorites.length > 0 ? (
              <section>
                <p className="meta-label mb-3">{t("customer:favoritesExplicit")}</p>
                <div className="space-y-3">
                  {favorites.map((item) => (
                    <PreferenceCard
                      key={item.dishId}
                      item={item}
                      busy={toggle.isPending}
                      onToggle={() =>
                        toggle.mutate({ dishId: item.dishId, favorite: false })
                      }
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {suggestions.length > 0 ? (
              <section>
                <p className="meta-label mb-1">{t("customer:favoritesSuggested")}</p>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("customer:favoritesSuggestedHint")}
                </p>
                <div className="space-y-3">
                  {suggestions.map((item) => (
                    <PreferenceCard
                      key={item.dishId}
                      item={item}
                      busy={toggle.isPending}
                      onToggle={() =>
                        toggle.mutate({ dishId: item.dishId, favorite: true })
                      }
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        <Link to="/app/menu" className="block">
          <PrimaryCTA variant="outline" trailingIcon={false}>
            {t("customer:homeViewMenuCta")}
          </PrimaryCTA>
        </Link>
      </div>
    </div>
  );
}

function PreferenceCard({
  item,
  busy,
  onToggle,
}: {
  item: PreferenceDishView;
  busy: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation("customer");
  const dish = item.dish;
  if (!dish) return null;

  const canAdd = item.actions.includes("add_to_order");
  const isExplicit = item.source === "explicit";

  return (
    <div className="surface-raised border border-border/60 rounded-3xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <DishThumb emoji={dish.emoji} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold leading-tight truncate">{dish.name}</p>
              {item.orderCount != null ? (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("favoriteOrderedTimes", { count: item.orderCount })}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={onToggle}
              aria-label={
                isExplicit ? t("favoriteRemove") : t("favoriteAdd")
              }
              className={cn(
                "grid place-items-center size-10 rounded-xl shrink-0 transition-colors",
                isExplicit
                  ? "bg-primary/12 text-primary"
                  : "bg-secondary text-muted-foreground hover:text-primary",
              )}
            >
              <Heart
                className="size-5"
                fill={isExplicit ? "currentColor" : "none"}
                strokeWidth={2}
              />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 font-semibold",
                item.availableThisWeek
                  ? "bg-primary/12 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {item.availableThisWeek
                ? t("favoriteAvailableThisWeek")
                : t("favoriteUnavailableThisWeek")}
            </span>
            <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold tabular-nums">
              {dish.kcal} kcal
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/app/menu/$dishId"
          params={{ dishId: item.dishId }}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-border text-sm font-bold"
        >
          <UtensilsCrossed className="size-4" />
          {t("favoriteViewNutrition")}
        </Link>
        {canAdd ? (
          <Link
            to="/app/schedule"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground text-sm font-bold"
          >
            <Plus className="size-4" />
            {t("addToOrder")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
