import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Heart, Leaf } from "lucide-react";
import {
  AllergenBadge,
  DishThumb,
  MacroPill,
  PrimaryCTA,
  ScreenHeader,
  TagChip,
} from "@/components/consumer";
import { useDish } from "@/hooks/use-dishes";
import {
  useIsFavorite,
  useToggleFavorite,
} from "@/hooks/use-customer-preferences";
import { useWeeklyMenu } from "@/hooks/use-weekly-menu";
import { utcWeekStartMonday } from "@/modules/weekly-menu/application/week-dates";
import { cn } from "@/lib/utils";

/**
 * Screen: Customer · Dish Detail
 * - CAP-002: useDish() real catalog read
 * - EP-002A.3: favorite toggle + availability-gated add CTA
 */
export const Route = createFileRoute("/_authenticated/app/menu/$dishId")({
  component: DishDetail,
});

function DishDetail() {
  const { t } = useTranslation(["customer", "common"]);
  const { dishId } = Route.useParams();
  const { data: dish, isPending, isFetched } = useDish(dishId);
  const { data: isFavorite } = useIsFavorite(dishId);
  const toggle = useToggleFavorite();
  const weekStart = utcWeekStartMonday();
  const { data: weeklyMenu } = useWeeklyMenu(weekStart);

  if (isPending) {
    return <div className="flex-1 flex flex-col" aria-busy="true" />;
  }

  if (isFetched && !dish) {
    throw notFound();
  }

  if (!dish) {
    return <div className="flex-1 flex flex-col" aria-busy="true" />;
  }

  const tagLabels: Record<string, string> = {
    vegan: t("customer:tagVegan"),
    vegetarian: t("customer:tagVegetarian"),
    glutenFree: t("customer:tagGlutenFree"),
    lactoseFree: t("customer:tagLactoseFree"),
    spicy: t("customer:tagSpicy"),
  };

  const availableThisWeek = Boolean(
    weeklyMenu?.days.some((d) => d.dishes.some((x) => x.id === dishId)),
  );

  return (
    <div className="flex-1 flex flex-col pb-4">
      <ScreenHeader
        backTo="/app/menu"
        overline={t("customer:dishDetail")}
        title={dish.name}
        subtitle={dish.tagline}
        trailing={
          <button
            type="button"
            disabled={toggle.isPending}
            onClick={() =>
              toggle.mutate({
                dishId,
                favorite: !isFavorite,
              })
            }
            aria-label={
              isFavorite
                ? t("customer:favoriteRemove")
                : t("customer:favoriteAdd")
            }
            className={cn(
              "grid place-items-center size-10 rounded-xl transition-colors",
              isFavorite
                ? "bg-primary/12 text-primary"
                : "bg-secondary text-muted-foreground",
            )}
          >
            <Heart
              className="size-5"
              fill={isFavorite ? "currentColor" : "none"}
              strokeWidth={2}
            />
          </button>
        }
      />

      <div className="px-6">
        <DishThumb emoji={dish.emoji} size="xl" />
      </div>

      <div className="px-6 mt-5 flex flex-wrap gap-1.5">
        {dish.tags.map((tg: string) => (
          <TagChip key={tg}>
            <Leaf className="size-3" />
            {tagLabels[tg]}
          </TagChip>
        ))}
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            availableThisWeek
              ? "bg-primary/12 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {availableThisWeek
            ? t("customer:favoriteAvailableThisWeek")
            : t("customer:favoriteUnavailableThisWeek")}
        </span>
      </div>

      <section className="px-6 mt-6">
        <p className="meta-label mb-2">{t("customer:macros")}</p>
        <div className="grid grid-cols-4 gap-2">
          <MacroPill kind="kcal" value={dish.kcal} />
          <MacroPill kind="protein" value={dish.proteinG} />
          <MacroPill kind="carbs" value={dish.carbsG} />
          <MacroPill kind="fat" value={dish.fatG} />
        </div>
      </section>

      {dish.ingredients.length > 0 ? (
        <section className="px-6 mt-6">
          <p className="meta-label mb-2">{t("customer:ingredients")}</p>
          <div className="bg-card border border-border rounded-2xl p-4">
            <ul className="text-sm space-y-1.5">
              {dish.ingredients.map((ing: string) => (
                <li key={ing} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span className="capitalize">{ing}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {dish.allergens.length > 0 ? (
        <section className="px-6 mt-6">
          <p className="meta-label mb-2">{t("customer:allergens")}</p>
          <div className="flex flex-wrap gap-2">
            {dish.allergens.map((a: string) => (
              <AllergenBadge key={a} label={a} />
            ))}
          </div>
        </section>
      ) : null}

      {availableThisWeek ? (
        <div className="px-6 mt-8">
          <Link to="/app/schedule" className="block">
            <PrimaryCTA>{t("customer:addToOrder")}</PrimaryCTA>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
