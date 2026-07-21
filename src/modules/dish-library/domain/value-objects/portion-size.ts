import { invalidState } from "@/domain/errors";

/**
 * Canonical portion size in grams.
 * @see docs/12-domain-model/module-01/Dish.md
 */
export class PortionSize {
  private constructor(private readonly grams: number) {}

  static create(grams: number | null | undefined): PortionSize {
    if (grams == null || !Number.isFinite(grams) || grams <= 0) {
      throw invalidState("Portion size must be a positive number of grams");
    }

    return new PortionSize(grams);
  }

  toGrams(): number {
    return this.grams;
  }

  equals(other: PortionSize): boolean {
    return this.grams === other.grams;
  }
}
