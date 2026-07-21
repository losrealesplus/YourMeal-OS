import { invalidState } from "@/domain/errors";

/**
 * Canonical energy value in kilocalories.
 * @see docs/12-domain-model/module-01/Dish.md
 */
export class Calories {
  private constructor(private readonly kcal: number) {}

  static create(kcal: number | null | undefined): Calories {
    if (kcal == null || !Number.isFinite(kcal) || kcal < 0) {
      throw invalidState("Calories must be a non-negative finite number");
    }

    return new Calories(kcal);
  }

  toKcal(): number {
    return this.kcal;
  }

  equals(other: Calories): boolean {
    return this.kcal === other.kcal;
  }
}
