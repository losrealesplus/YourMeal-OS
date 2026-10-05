import { describe, expect, it } from "vitest";
import { readOrderItem, requireDishReader } from "./order-item-read-model";

const legacy = { id: "item-1", dish_id: "dish-1" };
const custom = {
  id: "custom-1",
  dish_id: null,
  item_kind: "custom",
  name_snapshot: "Sopa personalizada",
  allergen_state: "UNKNOWN",
  allergens_snapshot: [],
  snapshot_captured_at: "2026-10-05T12:00:00Z",
};

describe("CR-ORDER expanded read foundation", () => {
  it("reads pre-expand legacy without inventing a snapshot or a zero price", () => {
    expect(readOrderItem(legacy, { name: "Catalogue today" })).toMatchObject({
      kind: "dish",
      identity: "dish:dish-1",
      metadataSource: "current_catalogue",
      allergenState: "HISTORICAL_UNAVAILABLE",
      allergensSnapshot: null,
      snapshotCapturedAt: null,
    });
    expect(readOrderItem(legacy).name).toBeNull();
  });
  it("snapshot wins after catalogue changes and never merges homonymous custom items", () => {
    const first = readOrderItem(custom, { name: "Wrong catalogue" });
    const second = readOrderItem({ ...custom, id: "custom-2" });
    expect(first).toMatchObject({
      name: "Sopa personalizada",
      metadataSource: "snapshot",
      dishId: null,
      recipeState: "NOT_AVAILABLE",
      allergenState: "UNKNOWN",
      allergensSnapshot: [],
    });
    expect(first.identity).not.toBe(second.identity);
    expect(first.identity).toBe("custom:custom-1");
  });
  it("never feeds future custom into dish-only downstream during foundation", () => {
    expect(() => requireDishReader(readOrderItem(custom))).toThrow(
      "Custom downstream reader is not enabled",
    );
  });
  it.each([
    { ...legacy, dish_id: null },
    { ...custom, dish_id: "dish-1" },
    { ...custom, name_snapshot: " " },
    { ...custom, snapshot_captured_at: null },
    { ...custom, allergens_snapshot: ["gluten"] },
    { ...custom, allergen_state: "DECLARED" },
    { ...legacy, item_kind: "other" },
    { ...legacy, allergen_state: "DECLARED", allergens_snapshot: [] },
  ])("rejects contradictory read shape %#", (row) => {
    expect(() => readOrderItem(row)).toThrow("Invalid order item read shape");
  });
});
