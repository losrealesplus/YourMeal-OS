/** Phase 1: an array is a declaration, never a certification of absence. */
export type AllergenDeclarationStatus = "UNKNOWN" | "DECLARED";

export function getAllergenDeclarationStatus(
  allergens: readonly string[] | null | undefined,
): AllergenDeclarationStatus {
  return allergens && allergens.length > 0 ? "DECLARED" : "UNKNOWN";
}
