import type { ReactNode } from "react";
import type { MockDish } from "@/lib/mock-catalog";
import { DishThumb } from "./dish-thumb";
import { cn } from "@/lib/utils";

/**
 * Instagram-style dish post — photo dominates, name is hero, macros secondary.
 * Presentation only: used by Menú semanal and Schedule step 2.
 */
export function MenuDishPost({
  dish,
  cta,
  macrosLabel,
  imageSrc,
  className,
}: {
  dish: MockDish;
  /** Primary action under the dish (Añadir / Seleccionar / link). */
  cta: ReactNode;
  /** e.g. "Proteínas · Carbohidratos · Grasas" with values. */
  macrosLabel: string;
  /** Tenant product photo when available. */
  imageSrc?: string;
  className?: string;
}) {
  return (
    <article className={cn("space-y-4", className)}>
      <DishThumb
        emoji={dish.emoji}
        imageSrc={imageSrc}
        size="hero"
        className="!rounded-[1.75rem] border-0 shadow-sm"
      />
      <div className="space-y-2 px-0.5">
        <h2 className="text-[1.35rem] font-extrabold tracking-tight leading-tight text-balance">
          {dish.name}
        </h2>
        {dish.tagline ? (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {dish.tagline}
          </p>
        ) : null}
        <p className="font-mono text-sm font-bold tabular-nums text-foreground/80 pt-1">
          {dish.kcal} kcal
        </p>
        <p className="text-xs text-muted-foreground tracking-wide">{macrosLabel}</p>
      </div>
      <div className="pt-1">{cta}</div>
    </article>
  );
}

export function dishMacrosLine(
  dish: MockDish,
  labels: { protein: string; carbs: string; fat: string },
): string {
  return `${dish.proteinG}g ${labels.protein} · ${dish.carbsG}g ${labels.carbs} · ${dish.fatG}g ${labels.fat}`;
}
