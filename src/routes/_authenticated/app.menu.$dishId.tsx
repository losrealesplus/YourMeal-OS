import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Leaf } from "lucide-react";
import {
  AllergenBadge,
  DishThumb,
  MacroPill,
  PrimaryCTA,
  ScreenHeader,
  TagChip,
} from "@/components/consumer";
import { useDish } from "@/hooks/use-dishes";

/**
 * Screen: Customer · Dish Detail
 * - Objetivo operacional: decidir si un plato encaja (macros, alérgenos, ingredientes).
 * - Capability: weekly-menu.browse · dish-catalog.read
 * - Core Object(s): Dish (+ RecipeSummary vía Dish)
 * - CAP-002: useDish() real catalog read (UI unchanged)
 */
export const Route = createFileRoute("/_authenticated/app/menu/$dishId")({
  component: DishDetail,
});

function DishDetail() {
  const { t } = useTranslation(["customer", "common"]);
  const { dishId } = Route.useParams();
  const { data: dish, isPending, isFetched } = useDish(dishId);

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

  return (
    <div className="flex-1 flex flex-col pb-4">
      <ScreenHeader
        backTo="/app/menu"
        overline={t("customer:dishDetail")}
        title={dish.name}
        subtitle={dish.tagline}
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

      <div className="px-6 mt-8">
        <Link to="/app/schedule" className="block">
          <PrimaryCTA>{t("customer:addToOrder")}</PrimaryCTA>
        </Link>
      </div>
    </div>
  );
}
