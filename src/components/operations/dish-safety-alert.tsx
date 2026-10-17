import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AllergenSnapshotState } from "@/modules/orders/domain/order-item-read-model";

export interface DishSafetyAlertProps {
  /** Whether the preparation is custom / free intake */
  isCustom?: boolean;
  /** Snapshot allergen state ("DECLARED" | "UNKNOWN" | "HISTORICAL_UNAVAILABLE") */
  allergenState?: AllergenSnapshotState | null;
  /** Declared allergens on the dish/line */
  allergens?: readonly string[] | null;
  /** Customer's profile dietary allergens */
  customerAllergens?: readonly string[] | null;
  /** Optional pre-computed matching critical allergens */
  matchingCritical?: readonly string[] | null;
  /** Whether to render the 'Custom' badge */
  showCustomBadge?: boolean;
  /** Compact text sizing (e.g. for dense packaging cards) */
  compact?: boolean;
  className?: string;
}

/** Pure helper to extract allergens that match customer declared allergies (case-insensitive) */
export function getCriticalAllergens(
  dishAllergens: readonly string[] | null | undefined,
  customerAllergens: readonly string[] | null | undefined,
): string[] {
  if (!dishAllergens || !customerAllergens || dishAllergens.length === 0 || customerAllergens.length === 0) {
    return [];
  }
  const customerSet = new Set(customerAllergens.map((a) => a.toLowerCase().trim()));
  return dishAllergens.filter((a) => customerSet.has(a.toLowerCase().trim()));
}

/**
 * OP-08 Dish Safety Alert Component
 * Renders uniform food-safety presentations across Kitchen and Packaging dialogs:
 * 1. Critical allergy matching badge (🔴 ALERTA: ...)
 * 2. Unlinked recipe warning for UNKNOWN or custom preparations (⚠️ Alérgenos sin declarar · Receta no vinculada)
 * 3. Historical unavailable notice (Declaración histórica no disponible)
 * 4. Declared allergen list (Alérgenos: ...)
 */
export function DishSafetyAlert({
  isCustom = false,
  allergenState,
  allergens,
  customerAllergens,
  matchingCritical: explicitCritical,
  showCustomBadge = false,
  compact = false,
  className,
}: DishSafetyAlertProps) {
  const critical =
    explicitCritical ?? getCriticalAllergens(allergens, customerAllergens);
  const textSize = compact ? "text-[11px]" : "text-xs";

  return (
    <div className={cn("space-y-0.5 leading-tight", className)}>
      {showCustomBadge && isCustom && (
        <Badge
          variant="outline"
          className="text-[10px] uppercase font-semibold text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800"
        >
          Custom
        </Badge>
      )}

      {critical.length > 0 && (
        <Badge variant="destructive" className="h-4 px-1 text-[10px] font-bold">
          🔴 ALERTA: {critical.join(", ").toUpperCase()}
        </Badge>
      )}

      {isCustom || allergenState === "UNKNOWN" ? (
        <span className={cn("block font-medium text-amber-700 dark:text-amber-400", textSize)}>
          ⚠️ Alérgenos sin declarar · Receta no vinculada
        </span>
      ) : allergenState === "HISTORICAL_UNAVAILABLE" ? (
        <span className={cn("block text-muted-foreground italic", textSize)}>
          Declaración histórica no disponible
        </span>
      ) : allergens && allergens.length > 0 ? (
        <span className={cn("block text-muted-foreground", textSize)}>
          Alérgenos: {allergens.join(", ")}
        </span>
      ) : null}
    </div>
  );
}
