import { resolveAllergenLabels } from "@/types/dietary";
import { getAllergenDeclarationStatus } from "@/modules/dish-library/domain/policies/allergen-declaration";
import { cn } from "@/lib/utils";

/** Dish composition only. Customer dietary restrictions have a separate contract. */
export function DishAllergenDeclaration({
  allergens,
  showDeclared = false,
  className,
}: {
  allergens: readonly string[] | null | undefined;
  /** Existing badges can keep rendering declarations; this supplies their empty state. */
  showDeclared?: boolean;
  className?: string;
}) {
  const status = getAllergenDeclarationStatus(allergens);
  if (status === "DECLARED" && !showDeclared) return null;
  return (
    <span
      data-allergen-declaration={status}
      className={cn(
        "block min-w-0 max-w-full whitespace-normal break-words text-xs text-muted-foreground",
        className,
      )}
    >
      {status === "UNKNOWN"
        ? "Alérgenos sin declarar"
        : `Alérgenos declarados: ${resolveAllergenLabels([...(allergens ?? [])], []).join(", ")}`}
    </span>
  );
}
