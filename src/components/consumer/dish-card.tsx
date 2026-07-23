import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { MockDish } from "@/lib/mock-catalog";
import { DishThumb } from "./dish-thumb";
import { TagChip } from "./tag-chip";

/**
 * DishCard — tarjeta del plato en el menú semanal.
 * Toca todo el card → detalle. Un solo objetivo por tarjeta.
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
      className="group relative flex gap-4 surface-raised border border-border/60 rounded-[1.5rem] p-4 pr-4 items-stretch transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.995]"
    >
      <DishThumb emoji={dish.emoji} size="md" className="!size-28 !text-5xl !rounded-3xl" />
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div className="min-w-0">
          <p className="font-extrabold text-base leading-tight truncate">{dish.name}</p>
          <p className="text-sm text-muted-foreground truncate mt-1.5">
            {dish.tagline}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums text-foreground bg-secondary/80 rounded-lg px-2.5 py-1">
            {dish.kcal}
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              kcal
            </span>
          </span>
          <div className="flex gap-1 overflow-hidden">
            {dish.tags.slice(0, 2).map((t) => (
              <TagChip key={t}>{tagLabels[t] ?? t}</TagChip>
            ))}
          </div>
        </div>
      </div>
      <ChevronRight className="self-center size-5 text-muted-foreground transition-transform duration-200 group-hover:text-primary group-hover:translate-x-0.5" />
    </Link>
  );
}
