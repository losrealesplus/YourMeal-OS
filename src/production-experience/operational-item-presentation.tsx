import {
  isCustomOperationalItem,
  operationalItemIdentity,
  type OperationalItem,
} from "./operational-item-identity";
import { DishAllergenDeclaration } from "@/components/operations/dish-allergen-declaration";
import type { AllergenSnapshotState } from "@/modules/orders/domain/order-item-read-model";

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
    return <span className={className}>Declaración histórica no disponible</span>;
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
