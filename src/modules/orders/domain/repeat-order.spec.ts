import { describe, expect, it } from "vitest";
import {
  addUtcDays,
  buildRepeatOrderPlan,
  canRepeatPlan,
  resolveTargetDay,
  weekdayOffset,
} from "./repeat-order";

describe("repeat order planning", () => {
  it("maps weekday offsets within the source week", () => {
    expect(weekdayOffset("2026-07-20", "2026-07-20")).toBe(0);
    expect(weekdayOffset("2026-07-20", "2026-07-22")).toBe(2);
  });

  it("prefers the same weekday when the dish is offered", () => {
    expect(
      resolveTargetDay("2026-07-28", ["2026-07-27", "2026-07-28", "2026-07-29"]),
    ).toBe("2026-07-28");
  });

  it("falls back to earliest offered day when weekday is missing", () => {
    expect(resolveTargetDay("2026-07-28", ["2026-07-29", "2026-07-30"])).toBe(
      "2026-07-29",
    );
  });

  it("marks dishes missing from the menu as unavailable", () => {
    const plan = buildRepeatOrderPlan({
      sourceWeekStart: "2026-07-13",
      targetWeekStart: "2026-07-20",
      sourceLines: [
        {
          dishId: "a",
          dishName: "Bowl",
          qty: 2,
          dayDate: "2026-07-14",
        },
        {
          dishId: "b",
          dishName: "Pasta",
          qty: 1,
          dayDate: "2026-07-15",
        },
      ],
      offerByDish: new Map([["a", ["2026-07-21"]]]),
    });

    expect(plan.available).toEqual([
      {
        dishId: "a",
        dishName: "Bowl",
        qty: 2,
        sourceDayDate: "2026-07-14",
        targetDayDate: "2026-07-21",
      },
    ]);
    expect(plan.unavailable).toEqual([
      {
        dishId: "b",
        dishName: "Pasta",
        qty: 1,
        sourceDayDate: "2026-07-15",
        reason: "not_on_menu",
      },
    ]);
    expect(canRepeatPlan(plan)).toBe(true);
  });

  it("cannot repeat when nothing is available", () => {
    const plan = buildRepeatOrderPlan({
      sourceWeekStart: "2026-07-13",
      targetWeekStart: "2026-07-20",
      sourceLines: [
        {
          dishId: "gone",
          dishName: "Old dish",
          qty: 1,
          dayDate: "2026-07-13",
        },
      ],
      offerByDish: new Map(),
    });
    expect(canRepeatPlan(plan)).toBe(false);
    expect(addUtcDays("2026-07-20", 2)).toBe("2026-07-22");
  });
});
