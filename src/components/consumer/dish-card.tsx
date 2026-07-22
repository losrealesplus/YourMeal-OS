import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { MockDish } from "@/lib/mock-catalog";
import { DishThumb } from "./dish-thumb";
import { TagChip } from "./tag-chip";

/**
 * DishCard — vista de tarjeta del plato en el menú semanal.
 * Toca todo el card → detalle. Sin CTAs secundarios (mobile-first, un solo toque).
 */
export function DishCard({
  dish,
  tagLabels,
}: {
  dish: MockDish;
  tagLabels: Record<string, string>;
}) {
  return (
    <Link
      to="/app/menu/$dishId"
      params={{ dishId: dish.id }}
      className="group flex gap-4 bg-card border border-border rounded-2xl p-3 pr-4 hover:border-primary/40 transition-colors"
    >
      <DishThumb emoji={dish.emoji} size="md" />
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div className="min-w-0">
          <p className="font-bold truncate">{dish.name}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {dish.tagline}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
            {dish.kcal} kcal
          </span>
          <div className="flex gap-1 overflow-hidden">
            {dish.tags.slice(0, 2).map((t) => (
              <TagChip key={t}>{tagLabels[t] ?? t}</TagChip>
            ))}
          </div>
        </div>
      </div>
      <ChevronRight className="self-center size-5 text-muted-foreground group-hover:text-primary" />
    </Link>
  );
}
