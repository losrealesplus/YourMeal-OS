import { describe, expect, it } from "vitest";
import { MoneyUtil } from "./money";

describe("MoneyUtil — Deterministic integer cents arithmetic", () => {
  it("formats cents to EUR currency correctly", () => {
    expect(MoneyUtil.format(1190, "EUR")).toBe("11,90 €");
    expect(MoneyUtil.format(997, "EUR")).toBe("9,97 €");
    expect(MoneyUtil.format(450, "EUR")).toBe("4,50 €");
    expect(MoneyUtil.format(5355, "EUR")).toBe("53,55 €");
    expect(MoneyUtil.format(0, "EUR")).toBe("0,00 €");
  });

  it("creates Money instance from cents and decimal correctly", () => {
    const fromCents = MoneyUtil.fromCents(1190, "EUR");
    expect(fromCents.cents).toBe(1190);
    expect(fromCents.formatted).toBe("11,90 €");

    const fromDec = MoneyUtil.fromDecimal(11.9, "EUR");
    expect(fromDec.cents).toBe(1190);
    expect(fromDec.formatted).toBe("11,90 €");
  });

  it("performs safe addition and subtraction", () => {
    const m1 = MoneyUtil.fromCents(1000, "EUR");
    const m2 = MoneyUtil.fromCents(250, "EUR");

    const sum = MoneyUtil.add(m1, m2);
    expect(sum.cents).toBe(1250);
    expect(sum.formatted).toBe("12,50 €");

    const diff = MoneyUtil.subtract(m1, m2);
    expect(diff.cents).toBe(750);
    expect(diff.formatted).toBe("7,50 €");

    // Subtraction floors at 0
    const overDiff = MoneyUtil.subtract(m2, m1);
    expect(overDiff.cents).toBe(0);
    expect(overDiff.formatted).toBe("0,00 €");
  });

  it("calculates percentage discounts deterministically with integer rounding", () => {
    // 1190 * 10% = 119 cents
    expect(MoneyUtil.percentageDiscount(1190, 10)).toBe(119);
    // 5950 * 10% = 595 cents
    expect(MoneyUtil.percentageDiscount(5950, 10)).toBe(595);
    // 450 * 30% = 135 cents
    expect(MoneyUtil.percentageDiscount(450, 30)).toBe(135);
    // Edge cases: 0 cents or negative percentage
    expect(MoneyUtil.percentageDiscount(0, 10)).toBe(0);
    expect(MoneyUtil.percentageDiscount(1000, 0)).toBe(0);
  });

  it("calculates savings percentages correctly and avoids divide by zero", () => {
    // 193 savings on 1190 base = 16.218% -> 16%
    expect(MoneyUtil.savingsPercentage(1190, 193)).toBe(16);
    // 595 savings on 5950 base = 10%
    expect(MoneyUtil.savingsPercentage(5950, 595)).toBe(10);
    // Base 0 -> 0%
    expect(MoneyUtil.savingsPercentage(0, 100)).toBe(0);
    expect(MoneyUtil.savingsPercentage(1000, 0)).toBe(0);
  });
});
