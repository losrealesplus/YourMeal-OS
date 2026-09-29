import { describe, expect, it } from "vitest";
import {
  calculateTotalPortions,
  formatCreationDateTimeEs,
  formatMenuWeekEs,
  formatServiceDayEs,
  formatShortDateEs,
} from "./operational-temporal-context";

describe("operational-temporal-context (CR-OPS-09A)", () => {
  it("formats service day date in Spanish with day name and capitalized initial", () => {
    expect(formatServiceDayEs("2026-10-01")).toBe("Jueves · 01 oct 2026");
    expect(formatServiceDayEs("2026-09-28")).toBe("Lunes · 28 sep 2026");
  });

  it("handles null / undefined / empty service day safely", () => {
    expect(formatServiceDayEs(null)).toBe("—");
    expect(formatServiceDayEs(undefined)).toBe("—");
    expect(formatServiceDayEs("")).toBe("—");
  });

  it("formats short date for clean table display (DD/MM/YYYY)", () => {
    expect(formatShortDateEs("2026-10-01")).toBe("01/10/2026");
    expect(formatShortDateEs("2026-09-28")).toBe("28/09/2026");
    expect(formatShortDateEs(null)).toBe("—");
  });

  it("formats creation ISO datetime deterministically", () => {
    expect(formatCreationDateTimeEs("2026-09-29T12:13:00.000Z")).toBe(
      "29 sep 2026, 12:13",
    );
    expect(formatCreationDateTimeEs(null)).toBe("—");
  });

  it("formats menu week origin context", () => {
    expect(formatMenuWeekEs("2026-09-28")).toBe("Semana: 28 sep — 4 oct 2026");
    expect(formatMenuWeekEs(null)).toBe("—");
  });

  it("calculates total portions correctly across items", () => {
    expect(
      calculateTotalPortions([
        { qty: 2 },
        { qty: 5 },
        { qty: 3 },
      ]),
    ).toBe(10);

    expect(calculateTotalPortions([])).toBe(0);
    expect(calculateTotalPortions([{ qty: null }, { qty: 4 }])).toBe(4);
  });
});
