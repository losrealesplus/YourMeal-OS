/**
 * Dish domain types (no I/O).
 * @see docs/12-domain-model/UBIQUITOUS_LANGUAGE.md
 */

/** Official lifecycle — DB enum still uses `active` for published (see STATE_MACHINES). */
export type DishLifecycleState = "draft" | "published" | "archived";

export type DishId = string;
export type TenantId = string;

export type Dish = {
  id: DishId;
  tenantId: TenantId;
  name: string;
  description: string | null;
  photoUrl: string | null;
  kcal: number | null;
  /** Canonical grams */
  weightG: number | null;
  macros: Record<string, unknown>;
  cost: number;
  price: number;
  prepMinutes: number | null;
  prepInstructions: string | null;
  allergens: string[];
  /** Persistence may still say `active` ≡ published */
  status: "draft" | "active" | "archived";
  deletedAt: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export function isDishPublished(status: Dish["status"]): boolean {
  return status === "active";
}
