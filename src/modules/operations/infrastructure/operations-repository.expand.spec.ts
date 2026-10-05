import { operationalItemIdentity } from "@/modules/orders/domain/order-item-read-model";
import { describe, expect, it } from "vitest";
import { mapOperationalOrderRow } from "./operations-repository";
import { buildKitchenProductionSheet } from "../domain/production-kitchen-engine";
import { buildPackingHierarchySheet } from "../domain/packing-hierarchy-engine";
import {
  buildFlatAnalyticMatrix,
  exportToCSV,
  buildThermalLabels,
} from "../domain/operational-sheet-exporter";
import { generateVersionMetadata, canonicalSerialize } from "../domain/operational-version-manager";
import { normalizeOperationalOrders } from "../domain/operational-date-resolver";

const row = {
  id: "order-1",
  tenant_id: "tenant-1",
  status: "confirmed",
  week_start: "2026-10-05",
  customer_id: "customer-1",
  total: 25,
  created_at: "2026-10-05",
  order_items: [
    {
      id: "item-1",
      dish_id: "dish-1",
      day_date: "2026-10-05",
      qty: 2,
      unit_price: 12.5,
      dishes: { name: "Catalogue today" },
    },
  ],
};

describe("CR-ORDER operational foundation", () => {
  it("legacy dish keeps name, portions, delivery day and financial snapshot", () => {
    const order = mapOperationalOrderRow(row);
    const result = normalizeOperationalOrders({
      orders: [order],
      targetDate: "2026-10-05",
      temporalMode: "present",
    });
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]).toMatchObject({
      dishName: "Catalogue today",
      unitPrice: 12.5,
      allergenSnapshotState: "HISTORICAL_UNAVAILABLE",
      metadataSource: "current_catalogue",
      identity: { orderItemId: "item-1", itemIdentity: "dish:dish-1", portionIndex: 0 },
    });
    expect(result.lines[1].identity.portionIndex).toBe(1);
    expect(order.deliveryDates).toEqual(["2026-10-05"]);
  });
  it("new snapshot name and UNKNOWN beat current catalogue metadata", () => {
    const order = mapOperationalOrderRow({
      ...row,
      order_items: [
        {
          ...row.order_items[0],
          item_kind: "dish",
          name_snapshot: "Name at capture",
          allergen_state: "UNKNOWN",
          allergens_snapshot: [],
          snapshot_captured_at: "2026-10-05T11:00:00Z",
        },
      ],
    });
    const result = normalizeOperationalOrders({
      orders: [order],
      targetDate: "2026-10-05",
      temporalMode: "present",
      dishMetaMap: new Map([["dish-1", { allergens: ["gluten"] }]]),
    });
    expect(result.lines[0]).toMatchObject({
      dishName: "Name at capture",
      dishAllergens: [],
      allergenSnapshotState: "UNKNOWN",
      metadataSource: "snapshot",
    });
  });
  it("excludes archived lines from both delivery dates and portions", () => {
    const order = mapOperationalOrderRow({
      ...row,
      order_items: [{ ...row.order_items[0], deleted_at: "2026-10-05T11:00:00Z" }],
    });
    expect(order.items).toEqual([]);
    expect(order.deliveryDates).toEqual([]);
  });
  it("null dish is rejected rather than stringified or silently dropped", () => {
    expect(() =>
      mapOperationalOrderRow({ ...row, order_items: [{ ...row.order_items[0], dish_id: null }] }),
    ).toThrow("Invalid order item read shape");
  });
});

describe("A2 native custom downstream", () => {
  const custom = (id: string, day = "2026-10-05") => ({
    id,
    dish_id: null,
    item_kind: "custom",
    name_snapshot: "Same captured name",
    description_snapshot: "Captured description",
    allergen_state: "UNKNOWN",
    allergens_snapshot: [],
    snapshot_captured_at: "2026-10-01T10:00:00Z",
    day_date: day,
    qty: 2,
    unit_price: 0,
    comment: "Sin cebolla",
    dishes: { name: "Never use this" },
  });
  const orders = () => [
    mapOperationalOrderRow({
      ...row,
      order_items: [custom("custom-a"), custom("custom-b"), custom("tomorrow", "2026-10-06")],
    }),
    mapOperationalOrderRow({ ...row, id: "order-2", order_items: [custom("custom-c")] }),
  ];
  it("preserves service days, portions, zero price and UNKNOWN without catalogue metadata", async () => {
    const source = orders();
    expect(source[0].deliveryDates).toEqual(["2026-10-05", "2026-10-06"]);
    const { lines } = normalizeOperationalOrders({
      orders: source,
      targetDate: "2026-10-05",
      temporalMode: "present",
    });
    expect(lines).toHaveLength(6);
    for (const line of lines) {
      expect(line).toMatchObject({
        dishName: "Same captured name",
        unitPrice: 0,
        dishAllergens: [],
        allergenSnapshotState: "UNKNOWN",
        metadataSource: "snapshot",
      });
      expect(line.identity.dishId).toBeNull();
      expect(line.identity.itemIdentity).toMatch(/^custom:custom-/);
    }
    const versionMetadata = await generateVersionMetadata({ lines, targetDate: "2026-10-05" });
    const params = {
      lines,
      targetDate: "2026-10-05",
      temporalMode: "present" as const,
      resolutionStatus: "COMPLETE" as const,
      versionMetadata,
    };
    const kitchen = buildKitchenProductionSheet(params);
    expect(kitchen.dishes).toHaveLength(3);
    expect(kitchen.dishes.map((d) => d.itemIdentity)).toEqual([
      "custom:custom-a",
      "custom:custom-b",
      "custom:custom-c",
    ]);
    for (const block of kitchen.dishes) {
      expect(block).toMatchObject({
        totalQty: 2,
        dishId: null,
        recipeState: "NOT_AVAILABLE",
        prepMinutesEstimated: null,
        totalWeightGramsEstimated: null,
      });
      expect(block.variants[0].variantLabel).toContain("Alérgenos sin declarar");
    }
    const packing = buildPackingHierarchySheet(params);
    const units = packing.municipalities.flatMap((m) => m.b2cIndividuals);
    expect(units).toHaveLength(2);
    expect(units.flatMap((u) => u.items)).toHaveLength(3);
    expect(
      units.flatMap((u) => u.items).every((i) => i.safetyTag?.includes("Alérgenos sin declarar")),
    ).toBe(true);
    const labels = buildThermalLabels(lines);
    expect(new Set(labels.map((l) => l.barcodeKey)).size).toBe(6);
    expect(
      labels.every(
        (l) => l.allergenState === "UNKNOWN" && l.safetyTag?.includes("Alérgenos sin declarar"),
      ),
    ).toBe(true);
    const csv = exportToCSV(buildFlatAnalyticMatrix(lines));
    expect(csv).toContain("custom:custom-a");
    expect(csv).toContain("UNKNOWN");
    expect(csv).not.toContain("dish:null");
    expect(canonicalSerialize(lines)).toContain("custom:custom-b");
  });
  it("declaration grouping never hides UNKNOWN behind another dish snapshot", async () => {
    const source = mapOperationalOrderRow({
      ...row,
      order_items: [
        {
          ...row.order_items[0],
          qty: 1,
          item_kind: "dish",
          name_snapshot: "Captured",
          allergen_state: "DECLARED",
          allergens_snapshot: ["milk"],
          snapshot_captured_at: "2026-10-01",
        },
        {
          ...row.order_items[0],
          id: "dish-unknown",
          qty: 1,
          item_kind: "dish",
          name_snapshot: "Captured",
          allergen_state: "UNKNOWN",
          allergens_snapshot: [],
          snapshot_captured_at: "2026-10-01",
        },
      ],
    });
    const { lines } = normalizeOperationalOrders({
      orders: [source],
      targetDate: "2026-10-05",
      temporalMode: "present",
    });
    const params = {
      lines,
      targetDate: "2026-10-05",
      temporalMode: "present" as const,
      resolutionStatus: "COMPLETE" as const,
      versionMetadata: await generateVersionMetadata({ lines, targetDate: "2026-10-05" }),
    };
    expect(buildKitchenProductionSheet(params).dishes[0]).toMatchObject({
      allergenState: "UNKNOWN",
      catalogAllergens: ["milk"],
    });
    expect(
      buildPackingHierarchySheet(params).municipalities[0].b2cIndividuals[0].items[0].allergenState,
    ).toBe("UNKNOWN");
  });
  it("rejects sentinel identity strings and encodes free text without delimiter collisions", () => {
    expect(() => operationalItemIdentity({ dishId: "null", orderItemId: "item" })).toThrow();
    expect(() =>
      operationalItemIdentity({ dishId: null, orderItemId: "undefined", itemKind: "custom" }),
    ).toThrow();
    const { lines } = normalizeOperationalOrders({
      orders: orders(),
      targetDate: "2026-10-05",
      temporalMode: "present",
    });
    const left = { ...lines[0], dishName: "Name|x", customerAllergens: ["a,b"] };
    const right = { ...lines[0], dishName: "Name", customerAllergens: ["x|a", "b"] };
    expect(canonicalSerialize([left])).not.toBe(canonicalSerialize([right]));
    expect(canonicalSerialize([{ ...left, customerAllergens: ["a", "b"] }])).not.toBe(
      canonicalSerialize([{ ...left, customerAllergens: ["a,b"] }]),
    );
  });
});
