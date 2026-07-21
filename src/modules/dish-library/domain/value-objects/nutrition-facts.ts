import { Calories } from "./calories";

/**
 * Minimal nutrition snapshot for a Dish.
 * Advanced nutrition models are out of MVP scope (Dish.md → Futuro).
 * @see docs/12-domain-model/module-01/Dish.md
 */
export class NutritionFacts {
  private constructor(private readonly calories: Calories | null) {}

  static empty(): NutritionFacts {
    return new NutritionFacts(null);
  }

  static create(input?: { calories?: Calories | null }): NutritionFacts {
    return new NutritionFacts(input?.calories ?? null);
  }

  getCalories(): Calories | null {
    return this.calories;
  }

  withCalories(calories: Calories | null): NutritionFacts {
    return new NutritionFacts(calories);
  }

  equals(other: NutritionFacts): boolean {
    if (this.calories == null && other.calories == null) return true;
    if (this.calories == null || other.calories == null) return false;
    return this.calories.equals(other.calories);
  }
}
