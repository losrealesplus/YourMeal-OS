import {
  isCustomOperationalItem,
  operationalItemIdentity,
  type OperationalItem,
} from "./operational-item-identity";
import { DishAllergenDeclaration } from "@/components/operations/dish-allergen-declaration";
import type { AllergenSnapshotState } from "@/modules/orders/domain/order-item-read-model";
import { cn } from "@/lib/utils";

export function OperationalAllergenDeclaration({
  item,
  showDeclared = false,
  className,
}: {
  item: {
    allergens: readonly string[];
    allergenState?: AllergenSnapshotState;
    kind?: "dish" | "custom";
  };
  showDeclared?: boolean;
  className?: string;
}) {
  if (item.kind !== "custom" && item.allergenState === "HISTORICAL_UNAVAILABLE") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-300 mt-1",
          className,
        )}
      >
        ⚠️ Alérgenos no verificados
      </span>
    );
  }
  return (
    <DishAllergenDeclaration
      allergens={item.kind === "custom" || item.allergenState === "UNKNOWN" ? [] : item.allergens}
      showDeclared={showDeclared}
      className={className}
    />
  );
}

/** Recipe/cost/preparation metadata cannot be inferred for native custom items. */
export function CustomOperationalContext({ item }: { item: OperationalItem }) {
  if (!isCustomOperationalItem(item)) return null;
  return (
    <span className="block text-xs font-normal text-muted-foreground">
      PERSONALIZADO · Receta no vinculada
      <span className="block font-mono text-[10px]">{operationalItemIdentity(item)}</span>
    </span>
  );
}
