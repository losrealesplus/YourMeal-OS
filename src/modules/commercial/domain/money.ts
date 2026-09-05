/**
 * Deterministic Money arithmetic in integer cents.
 * Prevents IEEE 754 floating point inaccuracies in monetary operations.
 */

import type { CurrencyCode, Money } from "./types";

export class MoneyUtil {
  /**
   * Format cents to standardized localized string representation.
   */
  static format(cents: number, currency: CurrencyCode = "EUR", locale: string = "es-ES"): string {
    const safeCents = Math.round(cents);
    const amount = safeCents / 100;
    
    // Standard European currency symbols format or ISO standard fallback
    if (currency === "EUR") {
      return `${amount.toFixed(2).replace(".", ",")} €`;
    }
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`;
    }
    if (currency === "GBP") {
      return `£${amount.toFixed(2)}`;
    }

    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  }

  /**
   * Creates a Money instance with integer cents.
   */
  static fromCents(cents: number, currency: CurrencyCode = "EUR"): Money {
    const safeCents = Math.max(0, Math.round(cents));
    return {
      cents: safeCents,
      currency,
      formatted: MoneyUtil.format(safeCents, currency),
    };
  }

  /**
   * Creates a Money instance from decimal major units (e.g., 11.90 -> 1190 cents).
   */
  static fromDecimal(amount: number, currency: CurrencyCode = "EUR"): Money {
    const cents = Math.round(amount * 100);
    return MoneyUtil.fromCents(cents, currency);
  }

  /**
   * Adds two Money objects.
   */
  static add(a: Money, b: Money): Money {
    if (a.currency !== b.currency) {
      throw new Error(`Currency mismatch in Money addition: ${a.currency} vs ${b.currency}`);
    }
    return MoneyUtil.fromCents(a.cents + b.cents, a.currency);
  }

  /**
   * Subtracts b from a with floor at 0.
   */
  static subtract(a: Money, b: Money): Money {
    if (a.currency !== b.currency) {
      throw new Error(`Currency mismatch in Money subtraction: ${a.currency} vs ${b.currency}`);
    }
    return MoneyUtil.fromCents(Math.max(0, a.cents - b.cents), a.currency);
  }

  /**
   * Multiplies Money by integer quantity.
   */
  static multiply(money: Money, qty: number): Money {
    const safeQty = Math.max(0, Math.round(qty));
    return MoneyUtil.fromCents(money.cents * safeQty, money.currency);
  }

  /**
   * Calculates discount in cents given a percentage.
   * e.g., 1190 cents with 10% -> 119 cents.
   */
  static percentageDiscount(cents: number, percentage: number): number {
    if (cents <= 0 || percentage <= 0) return 0;
    return Math.min(cents, Math.round(cents * (percentage / 100)));
  }

  /**
   * Calculates percentage of savings relative to base price.
   */
  static savingsPercentage(baseCents: number, savingsCents: number): number {
    if (baseCents <= 0 || savingsCents <= 0) return 0;
    return Math.min(100, Math.round((savingsCents / baseCents) * 100));
  }
}
