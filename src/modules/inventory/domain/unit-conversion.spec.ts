import { describe, expect, it } from "vitest";
import { convertUnits } from "./unit-conversion";

describe("Unit Conversion (FLOW-04 UI & Database Alignment)", () => {
  it("handles identical units with factor 1", () => {
    const res = convertUnits(5, "kg", 2, "kg");
    expect(res.compatible).toBe(true);
    if (res.compatible) {
      expect(res.availableInLineUnit).toBe(5);
      expect(res.stockToLineFactor).toBe(1);
    }
  });

  it("handles case-insensitive unit equality", () => {
    const res = convertUnits(10, "KG", 10, "kg");
    expect(res.compatible).toBe(true);
    if (res.compatible) {
      expect(res.availableInLineUnit).toBe(10);
    }
  });

  it("converts stock in kg to line in g correctly", () => {
    // 2.5 kg stock, line needs 500 g
    const res = convertUnits(2.5, "kg", 500, "g");
    expect(res.compatible).toBe(true);
    if (res.compatible) {
      expect(res.availableInLineUnit).toBe(2500); // 2.5 * 1000 = 2500 g
      expect(res.availableInLineUnit >= 500).toBe(true);
    }
  });

  it("converts stock in g to line in kg correctly", () => {
    // 500 g stock, line needs 1 kg
    const res = convertUnits(500, "g", 1, "kg");
    expect(res.compatible).toBe(true);
    if (res.compatible) {
      expect(res.availableInLineUnit).toBe(0.5); // 500 / 1000 = 0.5 kg
      expect(res.availableInLineUnit < 1).toBe(true);
    }
  });

  it("converts stock in l to line in ml correctly", () => {
    // 1.5 l stock, line needs 250 ml
    const res = convertUnits(1.5, "l", 250, "ml");
    expect(res.compatible).toBe(true);
    if (res.compatible) {
      expect(res.availableInLineUnit).toBe(1500);
    }
  });

  it("converts stock in ml to line in l correctly", () => {
    // 750 ml stock, line needs 1 l
    const res = convertUnits(750, "ml", 1, "l");
    expect(res.compatible).toBe(true);
    if (res.compatible) {
      expect(res.availableInLineUnit).toBe(0.75);
    }
  });

  it("flags incompatible units as not compatible", () => {
    const res1 = convertUnits(5, "kg", 2, "l");
    expect(res1.compatible).toBe(false);

    const res2 = convertUnits(10, "unidades", 2, "kg");
    expect(res2.compatible).toBe(false);

    const res3 = convertUnits(10, "", 2, "kg");
    expect(res3.compatible).toBe(false);
  });
});
