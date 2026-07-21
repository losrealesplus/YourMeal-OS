import { DishNameRequired, DishNameTooLong } from "../errors";

/** @see docs/12-domain-model/module-01/Dish.md */
export const DISH_NAME_MAX_LENGTH = 120;

/**
 * Canonical dish display name. All validation lives here — never in entities or UI.
 */
export class DishName {
  private constructor(private readonly value: string) {}

  static create(raw: string | null | undefined): DishName {
    if (raw == null || raw.trim().length === 0) {
      throw new DishNameRequired();
    }

    const trimmed = raw.trim();
    if (trimmed.length > DISH_NAME_MAX_LENGTH) {
      throw new DishNameTooLong(DISH_NAME_MAX_LENGTH);
    }

    return new DishName(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: DishName): boolean {
    return this.value === other.value;
  }
}
