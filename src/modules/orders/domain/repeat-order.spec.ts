import { describe, expect, it } from "vitest";
import { readOrderItem } from "./order-item-read-model";
import {
  addUtcDays,
  buildRepeatOrderPlan,
  canRepeatPlan,
  resolveTargetDay,
  weekdayOffset,
} from "./repeat-order";

describe("repeat order planning", () => {
  it("preserves every homonymous custom proposal without menu lookup or carrying its price", () => {
    const offerByDish = new Map<string, string[]>();
    const line = readOrderItem({
      id: "custom-1",
      dish_id: null,
      item_kind: "custom",
      name_snapshot: "Sopa",
      description_snapshot: "Sin datos de receta",
      allergen_state: "UNKNOWN",
      allergens_snapshot: [],
      snapshot_captured_at: "2026-10-05T12:00:00Z",
    });
    if (line.kind !== "custom") throw new Error("Expected custom fixture");
    const plan = buildRepeatOrderPlan({
      sourceWeekStart: "2026-10-05",
      targetWeekStart: "2026-10-12",
      offerByDish,
      sourceLines: [
        line,
        { ...line, orderItemId: "custom-2", identity: "custom:custom-2" as const },
      ].map((line) => ({ line, dishId: null, dishName: line.name, qty: 2, dayDate: "2026-10-06" })),
    });
    expect(plan.customProposals).toHaveLength(2);
    expect(plan.customProposals.map((p) => p.sourceOrderItemId)).toEqual(["custom-1", "custom-2"]);
    expect(plan.customProposals[0]).toMatchObject({
      name: "Sopa",
      description: "Sin datos de receta",
      allergenState: "UNKNOWN",
      allergensSnapshot: [],
      availabilityConfirmation: "PENDING",
      priceConfirmation: "PENDING",
      unitPrice: null,
      targetDayDate: "2026-10-13",
    });
    expect(plan.available).toEqual([]);
    expect(canRepeatPlan(plan)).toBe(false);
    expect(() =>
      buildRepeatOrderPlan({
        sourceWeekStart: "2026-10-05",
        targetWeekStart: "2026-10-12",
        offerByDish,
        sourceLines: [{ dishId: null, dishName: "Sopa", qty: 1, dayDate: "2026-10-05" }],
      }),
    ).toThrow("Missing typed repeat source identity");
  });
  it("maps weekday offsets within the source week", () => {
    expect(weekdayOffset("2026-07-20", "2026-07-20")).toBe(0);
    expect(weekdayOffset("2026-07-20", "2026-07-22")).toBe(2);
  });

  it("prefers the same weekday when the dish is offered", () => {
    expect(resolveTargetDay("2026-07-28", ["2026-07-27", "2026-07-28", "2026-07-29"])).toBe(
      "2026-07-28",
    );
  });

  it("falls back to earliest offered day when weekday is missing", () => {
    expect(resolveTargetDay("2026-07-28", ["2026-07-29", "2026-07-30"])).toBe("2026-07-29");
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
