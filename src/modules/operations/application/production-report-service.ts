/**
 * EP-002B / CR-OPS-07 — ProductionReportService
 * Builds the comprehensive Operations Engine projections:
 * - Kitchen Consolidated Sheet with Safety Segregation (P1)
 * - 6-Level Collapsible Packing Tree (P2)
 * - Version Manager with Deterministic Fingerprint
 * - Flat 17-column CSV / Excel Matrix
 * - Thermal Label Feed
 */
import type { ServiceContext } from "@/services/types";
import { requireCapability } from "@/permissions";
import {
  createOperationsRepository,
  type OperationalOrderFilters,
} from "../infrastructure/operations-repository";
import { KITCHEN_QUEUE_STATUSES } from "../domain/operational-status";
import { isKitchenBatchStatus, type KitchenBatchStatus } from "../domain/kitchen-batch-status";
import {
  buildProductionReport,
  type DishMeta,
  type ProductionReportModel,
  type ProductionSourceLine,
  type RecipeLine,
} from "../domain/production-report";
import {
  normalizeOperationalOrders,
  resolveTemporalMode,
  HISTORICAL_QUEUE_STATUSES,
  LIVE_QUEUE_STATUSES,
} from "../domain/operational-date-resolver";
import { buildKitchenProductionSheet } from "../domain/production-kitchen-engine";
import { buildPackingHierarchySheet } from "../domain/packing-hierarchy-engine";
import { generateVersionMetadata } from "../domain/operational-version-manager";
import {
  buildFlatAnalyticMatrix,
  exportToCSV,
  buildThermalLabels,
  type FlatAnalyticRow,
  type ThermalLabelModel,
} from "../domain/operational-sheet-exporter";
import type {
  KitchenProductionSheetModel,
  NormalizedOperationalLine,
  PackingSheetModel,
  VersionMetadata,
} from "../domain/operational-engine-types";

export type ProductionReportQuery = {
  deliveryDate: string;
  companyId?: string | null;
  siteId?: string | null;
  deliveryGroupId?: string | null;
  cutoffTimestamp?: string;
};

export interface OperationalSuiteModel {
  deliveryDate: string;
  temporalMode: "historical" | "present" | "future";
  lines: NormalizedOperationalLine[];
  kitchenSheet: KitchenProductionSheetModel;
  packingSheet: PackingSheetModel;
  versionMetadata: VersionMetadata;
  flatMatrix: FlatAnalyticRow[];
  csvExport: string;
  thermalLabels: ThermalLabelModel[];
  legacyModel: ProductionReportModel;
}

async function loadDishMeta(
  ctx: ServiceContext,
  dishIds: string[],
): Promise<Map<string, DishMeta>> {
  const map = new Map<string, DishMeta>();
  if (dishIds.length === 0) return map;

  const db = ctx.supabase;
  const { data, error } = await db
    .from("dishes")
    .select("id, allergens, prep_minutes, weight_g")
    .eq("tenant_id", ctx.tenantId)
    .in("id", dishIds)
    .is("deleted_at", null);
  if (error) throw error;

  for (const row of (data ?? []) as Array<{
    id: string;
    allergens: string[] | null;
    prep_minutes: number | null;
    weight_g: number | null;
  }>) {
    map.set(row.id, {
      allergens: row.allergens ?? [],
      prepMinutes: row.prep_minutes,
      weightG: row.weight_g,
    });
  }
  return map;
}

async function loadRecipeLines(ctx: ServiceContext, dishIds: string[]): Promise<RecipeLine[]> {
  if (dishIds.length === 0) return [];

  const db = ctx.supabase;
  const { data, error } = await db
    .from("dish_ingredients")
    .select("dish_id, ingredient_id, qty, unit, ingredients ( id, name )")
    .eq("tenant_id", ctx.tenantId)
    .in("dish_id", dishIds);
  if (error) throw error;

  return (
    (data ?? []) as Array<{
      dish_id: string;
      ingredient_id: string;
      qty: number;
      unit: string;
      ingredients: { id: string; name: string } | null;
    }>
  )
    .filter((row) => row.ingredients?.name)
    .map((row) => ({
      dishId: row.dish_id,
      ingredientId: row.ingredient_id,
      ingredientName: row.ingredients!.name,
      qty: Number(row.qty),
      unit: row.unit || "g",
    }));
}

async function loadBatchStatuses(
  ctx: ServiceContext,
  deliveryDate: string,
  itemIdentities: string[],
): Promise<Map<string, { status: KitchenBatchStatus; updatedAt: string | null }>> {
  const map = new Map<string, { status: KitchenBatchStatus; updatedAt: string | null }>();
  if (itemIdentities.length === 0) return map;

  const db = ctx.supabase;
  const { data, error } = await db
    .from("kitchen_production_batches")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("delivery_date", deliveryDate);
  if (error) throw error;

  for (const row of (data ?? []) as Array<{
    dish_id: string | null;
    custom_order_item_id?: string | null;
    item_kind?: string;
    status: string;
    updated_at: string | null;
  }>) {
    if (!isKitchenBatchStatus(row.status)) continue;
    const identity =
      row.item_kind === "custom" && row.dish_id === null && row.custom_order_item_id
        ? `custom:${row.custom_order_item_id}`
        : (row.item_kind === undefined || row.item_kind === "dish") && row.dish_id
          ? `dish:${row.dish_id}`
          : null;
    if (!identity || !itemIdentities.includes(identity)) continue;
    map.set(identity, {
      status: row.status,
      updatedAt: row.updated_at,
    });
  }
  return map;
}

function flattenOrdersToLines(
  orders: Awaited<ReturnType<ReturnType<typeof createOperationsRepository>["listOrders"]>>,
  deliveryDate: string,
): ProductionSourceLine[] {
  const lines: ProductionSourceLine[] = [];
  for (const order of orders) {
    for (const item of order.items) {
      if (item.dayDate !== deliveryDate) continue;
      lines.push({
        orderId: order.id,
        orderStatus: order.status,
        customerId: order.customerId,
        customerName: order.customerName,
        orderItemId: item.id,
        line: item.line,
        dishId: item.dishId,
        dishName: item.dishName,
        qty: item.qty,
        dayDate: item.dayDate,
        comment: item.notes,
        dietarySnapshot: order.dietarySnapshot ?? null,
      });
    }
  }
  return lines;
}

export const ProductionReportService = {
  /**
   * CR-OPS-07: Build the full operational suite for a delivery day.
   * Resolves past/present/future modes, calculates fingerprints,
   * generates 🔴 safety segregated kitchen and 6-tier packing trees.
   */
  async buildOperationalSuiteForDay(
    ctx: ServiceContext,
    query: ProductionReportQuery,
  ): Promise<OperationalSuiteModel> {
    requireCapability(ctx.roles, "kitchen.operate");

    if (!query.deliveryDate) {
      throw new Error("deliveryDate is required");
    }

    const temporalMode = resolveTemporalMode(query.deliveryDate);
    const statuses =
      temporalMode === "historical"
        ? (HISTORICAL_QUEUE_STATUSES as unknown as OperationalOrderFilters["statuses"])
        : (LIVE_QUEUE_STATUSES as unknown as OperationalOrderFilters["statuses"]);

    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    const filters: OperationalOrderFilters = {
      statuses,
      deliveryDate: query.deliveryDate,
      companyId: query.companyId ?? null,
      siteId: query.siteId ?? null,
      deliveryGroupId: query.deliveryGroupId ?? null,
    };

    const orders = await repo.listOrders(filters);
    const legacyLines = flattenOrdersToLines(orders, query.deliveryDate);
    const dishIds = [
      ...new Set(legacyLines.map((l) => l.dishId).filter((id): id is string => id !== null)),
    ];
    const itemIdentities = legacyLines.map(
      (l) =>
        l.line?.identity ?? (l.dishId === null ? `custom:${l.orderItemId}` : `dish:${l.dishId}`),
    );

    const [dishMetaById, recipeLines, batchStatusByDish] = await Promise.all([
      loadDishMeta(ctx, dishIds),
      loadRecipeLines(ctx, dishIds),
      loadBatchStatuses(ctx, query.deliveryDate, itemIdentities),
    ]);

    // 1. Normalize operational lines
    const { lines, resolutionStatus } = normalizeOperationalOrders({
      orders,
      targetDate: query.deliveryDate,
      temporalMode,
      dishMetaMap: dishMetaById,
    });

    // 2. Generate deterministic version metadata
    const versionMetadata = await generateVersionMetadata({
      targetDate: query.deliveryDate,
      lines,
      cutoffTimestamp: query.cutoffTimestamp,
    });

    // 3. Build Kitchen Production Sheet (P1)
    const kitchenSheet = buildKitchenProductionSheet({
      lines,
      targetDate: query.deliveryDate,
      temporalMode,
      resolutionStatus,
      versionMetadata,
    });

    // 4. Build Packing Hierarchy Sheet (P2)
    const packingSheet = buildPackingHierarchySheet({
      lines,
      targetDate: query.deliveryDate,
      temporalMode,
      resolutionStatus,
      versionMetadata,
    });

    // 5. Exporter models
    const flatMatrix = buildFlatAnalyticMatrix(lines);
    const csvExport = exportToCSV(flatMatrix);
    const thermalLabels = buildThermalLabels(lines);

    // 6. Legacy compatibility model
    const legacyModel = buildProductionReport({
      deliveryDate: query.deliveryDate,
      lines: legacyLines,
      dishMetaById,
      recipeLines,
      batchStatusByDish,
    });

    return {
      deliveryDate: query.deliveryDate,
      temporalMode,
      lines,
      kitchenSheet,
      packingSheet,
      versionMetadata,
      flatMatrix,
      csvExport,
      thermalLabels,
      legacyModel,
    };
  },

  /**
   * Legacy wrapper: Build the operational production sheet for a delivery day.
   */
  async buildForDay(
    ctx: ServiceContext,
    query: ProductionReportQuery,
  ): Promise<ProductionReportModel> {
    const suite = await this.buildOperationalSuiteForDay(ctx, query);
    return suite.legacyModel;
  },
};
