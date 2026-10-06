import { describe, expect, it } from "vitest";
import written from "../../../../supabase/tests/cr-order-a4a/written-fixture.json";
import { readOrderItem } from "@/modules/orders/domain/order-item-read-model";
import { mapOrderToSummaryView } from "@/modules/orders/application/order-summary-mapper";
import type {
  OrderItemReadProjection,
  OrderRow,
} from "@/modules/orders/infrastructure/order-repository";
import { buildRepeatOrderPlan, canRepeatPlan } from "@/modules/orders/domain/repeat-order";
import { buildProductionReport } from "../domain/production-report";
import { normalizeOperationalOrders } from "../domain/operational-date-resolver";
import { buildKitchenProductionSheet } from "../domain/production-kitchen-engine";
import { buildPackingHierarchySheet } from "../domain/packing-hierarchy-engine";
import { generateVersionMetadata } from "../domain/operational-version-manager";
import {
  buildFlatAnalyticMatrix,
  buildThermalLabels,
  exportToCSV,
} from "../domain/operational-sheet-exporter";
import { mapReportToBatches } from "@/production/mapProduction";
import { mapBatchToExecutionUnit, parseUnitId } from "@/kitchen/mapKitchen";
import type { OperationalOrderListItem } from "../infrastructure/operations-repository";

// Exported from the actual local PostgreSQL canonical commit by the A4a runner.
// Do not fabricate custom snapshots or change order status to make readers accept them.
const items = written.items as OrderItemReadProjection[];
const order = written.order as OrderRow;
const date = items[0]!.day_date;
const portions = items.reduce((sum, item) => sum + item.qty, 0);
const customItems = items.filter((item) => item.item_kind === "custom");
const customIdentities = customItems.map((item) => `custom:${item.id}`);
const operational = {
  id: order.id,
  tenantId: order.tenant_id,
  status: order.status,
  customerId: order.customer_id,
  customerName: written.customer.display_name,
  customerEmail: written.customer.email,
  weekStart: order.week_start,
  createdAt: order.created_at,
  total: order.total,
  demandChannel: order.demand_channel,
  notes: order.notes,
  companyId: order.company_id,
  companyName: null,
  siteId: order.site_id,
  siteName: null,
  siteAddress: null,
  organizationalUnitId: order.organizational_unit_id,
  organizationalUnitName: null,
  deliveryGroupId: order.delivery_group_id,
  deliveryGroupName: null,
  dietarySnapshot: order.dietary_snapshot,
  deliveryDates: written.deliveries.map((delivery) => delivery.delivery_date),
  items: items.map((item) => ({
    id: item.id,
    dishId: item.dish_id,
    dishName: item.name_snapshot ?? null,
    dayDate: item.day_date,
    qty: item.qty,
    unitPrice: item.unit_price,
    notes: item.comment,
    line: readOrderItem(item),
  })),
} as unknown as OperationalOrderListItem;

function productionReport() {
  return buildProductionReport({
    deliveryDate: date,
    lines: items.map((item) => ({
      orderId: order.id,
      orderStatus: order.status,
      customerId: order.customer_id,
      customerName: written.customer.display_name,
      orderItemId: item.id,
      dishId: item.dish_id,
      dishName: item.name_snapshot ?? null,
      qty: item.qty,
      dayDate: item.day_date,
      comment: item.comment,
      line: readOrderItem(item),
    })),
  });
}

describe("A4a actual written rows → A2 downstream contracts", () => {
  it("proves fixture financial, tenant, snapshot and delivery identity before reading", () => {
    expect(written.provenance.fixture).toContain("actual-role");
    expect(order.write_contract_version).toBe(2);
    expect(order.status).toBe("confirmed");
    expect(customItems.length).toBeGreaterThanOrEqual(2);
    expect(new Set(customItems.map((item) => item.name_snapshot)).size).toBe(1);
    expect(new Set(customIdentities).size).toBe(customItems.length);
    expect(items.some((item) => item.item_kind === "dish")).toBe(true);
    expect(
      items.every((item) => item.order_id === order.id && item.tenant_id === order.tenant_id),
    ).toBe(true);
    expect(Number(order.total)).toBeCloseTo(
      items.reduce((sum, item) => sum + Number(item.unit_price) * item.qty, 0),
      2,
    );
    expect(
      written.deliveries.every(
        (delivery) => delivery.order_id === order.id && delivery.tenant_id === order.tenant_id,
      ),
    ).toBe(true);
    for (const item of customItems) {
      expect(readOrderItem(item)).toMatchObject({
        identity: `custom:${item.id}`,
        kind: "custom",
        dishId: null,
        name: item.name_snapshot,
        allergenState: "UNKNOWN",
        allergensSnapshot: [],
        recipeState: "NOT_AVAILABLE",
      });
    }
  });

  it("summary preserves UUIDs, captured financial prices and UNKNOWN without catalogue", () => {
    const summary = mapOrderToSummaryView(order, items, new Map());
    expect(summary.total).toBe(order.total);
    expect(summary.items).toHaveLength(items.length);
    expect(
      summary.items.filter((item) => item.line.kind === "custom").map((item) => item.line.identity),
    ).toEqual(customIdentities);
    for (const item of summary.items) {
      expect(item.unitPrice).toBe(items.find((source) => source.id === item.id)!.unit_price);
      if (item.line.kind === "custom")
        expect(item).toMatchObject({
          dishId: null,
          dish: null,
          line: { allergenState: "UNKNOWN", recipeState: "NOT_AVAILABLE" },
        });
    }
  });

  it("production, packing, batches and kitchen keep homonyms separate and no recipe invention", () => {
    const report = productionReport();
    expect(report.totals.portionCount).toBe(portions);
    const custom = report.standardDishes.filter((block) => block.kind === "custom");
    expect(custom.map((block) => block.itemIdentity)).toEqual(customIdentities);
    for (const block of custom)
      expect(block).toMatchObject({
        dishId: null,
        allergenState: "UNKNOWN",
        recipeState: "NOT_AVAILABLE",
        allergens: [],
        prepMinutes: null,
        weightG: null,
      });
    expect(report.ingredientSummary).toEqual([]);
    expect(report.packingByDish.map((block) => block.itemIdentity)).toEqual(
      report.standardDishes.map((block) => block.itemIdentity),
    );
    const batches = mapReportToBatches(report).filter((batch) => batch.kind === "custom");
    expect(new Set(batches.map((batch) => batch.id)).size).toBe(customItems.length);
    for (const batch of batches) {
      expect(batch.readiness.releasedToKitchen).toBe(false);
      expect(batch.recipeState).toBe("NOT_AVAILABLE");
      const execution = mapBatchToExecutionUnit(batch);
      expect(execution.allergenState).toBe("UNKNOWN");
      expect(parseUnitId(execution.id)).toBeNull();
    }
  });

  it("normalization, kitchen, packing, labels and export retain unknown knowledge per portion", async () => {
    const normalized = normalizeOperationalOrders({
      orders: [operational],
      targetDate: date,
      temporalMode: "present",
    });
    expect(normalized.lines).toHaveLength(portions);
    const versionMetadata = await generateVersionMetadata({
      targetDate: date,
      lines: normalized.lines,
    });
    const params = {
      ...normalized,
      targetDate: date,
      temporalMode: "present" as const,
      versionMetadata,
    };
    const kitchen = buildKitchenProductionSheet(params);
    expect(
      kitchen.dishes
        .filter((block) => block.itemKind === "custom")
        .map((block) => block.itemIdentity),
    ).toEqual(customIdentities);
    for (const block of kitchen.dishes.filter((block) => block.itemKind === "custom"))
      expect(block).toMatchObject({
        recipeState: "NOT_AVAILABLE",
        allergenState: "UNKNOWN",
        prepMinutesEstimated: null,
        totalWeightGramsEstimated: null,
      });
    const packing = buildPackingHierarchySheet(params);
    expect(packing.totals.grandTotalPortions).toBe(portions);
    const matrix = buildFlatAnalyticMatrix(normalized.lines);
    const customRows = matrix.filter((row) => row.tipoItem === "custom");
    expect(new Set(customRows.map((row) => row.identidadItem))).toEqual(new Set(customIdentities));
    expect(customRows.every((row) => row.estadoAlergenos === "UNKNOWN")).toBe(true);
    const csv = exportToCSV(matrix);
    for (const identity of customIdentities) expect(csv).toContain(identity);
    const labels = buildThermalLabels(normalized.lines);
    expect(labels).toHaveLength(portions);
    for (const label of labels.filter((label) => label.barcodeKey.startsWith("custom:")))
      expect(label.safetyTag).toContain("Alérgenos sin declarar · Receta no vinculada");
  });

  it("repeat exports proposals only and never treats captured price as new authority", () => {
    const plan = buildRepeatOrderPlan({
      sourceWeekStart: order.week_start,
      targetWeekStart: "2026-10-12",
      offerByDish: new Map(),
      sourceLines: items.map((item) => ({
        dishId: item.dish_id,
        dishName: item.name_snapshot ?? null,
        qty: item.qty,
        dayDate: item.day_date,
        line: readOrderItem(item),
      })),
    });
    expect(canRepeatPlan(plan)).toBe(false);
    expect(plan.customProposals.map((proposal) => proposal.sourceItemIdentity)).toEqual(
      customIdentities,
    );
    for (const proposal of plan.customProposals)
      expect(proposal).toMatchObject({
        unitPrice: null,
        availabilityConfirmation: "PENDING",
        priceConfirmation: "PENDING",
        allergenState: "UNKNOWN",
      });
  });
});
