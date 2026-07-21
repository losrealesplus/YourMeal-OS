import { invalidState } from "@/domain/errors";

/**
 * Canonical monetary amount (decimal, tenant currency resolved at presentation).
 * @see docs/12-domain-model/module-01/Dish.md
 */
export class Money {
  private constructor(private readonly amount: number) {}

  static create(amount: number | null | undefined): Money {
    if (amount == null || !Number.isFinite(amount) || amount < 0) {
      throw invalidState("Money amount must be a non-negative finite number");
    }

    return new Money(amount);
  }

  toAmount(): number {
    return this.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }
}
