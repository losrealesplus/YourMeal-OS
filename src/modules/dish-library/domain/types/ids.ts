import { invalidState } from "@/domain/errors";

/**
 * Opaque identity helpers for Dish aggregate.
 * @see docs/12-domain-model/ENTITY_GUIDELINES.md
 */

function requireId(label: string, value: string | null | undefined): string {
  if (value == null || value.trim().length === 0) {
    throw invalidState(`${label} is required`);
  }
  return value.trim();
}

export class DishId {
  private constructor(private readonly value: string) {}

  static create(value: string): DishId {
    return new DishId(requireId("DishId", value));
  }

  toString(): string {
    return this.value;
  }

  equals(other: DishId): boolean {
    return this.value === other.value;
  }
}

export class TenantId {
  private constructor(private readonly value: string) {}

  static create(value: string): TenantId {
    return new TenantId(requireId("TenantId", value));
  }

  toString(): string {
    return this.value;
  }

  equals(other: TenantId): boolean {
    return this.value === other.value;
  }
}

/** Reference to Category — Category aggregate not modeled yet. */
export class CategoryId {
  private constructor(private readonly value: string) {}

  static create(value: string): CategoryId {
    return new CategoryId(requireId("CategoryId", value));
  }

  toString(): string {
    return this.value;
  }

  equals(other: CategoryId): boolean {
    return this.value === other.value;
  }
}

/** Reference to Recipe — Recipe aggregate not modeled yet. */
export class RecipeId {
  private constructor(private readonly value: string) {}

  static create(value: string): RecipeId {
    return new RecipeId(requireId("RecipeId", value));
  }

  toString(): string {
    return this.value;
  }

  equals(other: RecipeId): boolean {
    return this.value === other.value;
  }
}
