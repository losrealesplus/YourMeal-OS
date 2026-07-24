/**
 * EP-002B — ProductionReportService
 * Builds the daily Hoja de Producción from real kitchen-queue orders.
 * EP-002B.2 attaches kitchen batch status (dish × day lot).
 */
import type { ServiceContext } from "@/services/types";
import { requireCapability } from "@/permissions";
import {
  createOperationsRepository,
  type OperationalOrderFilters,
} from "../infrastructure/operations-repository";
import { KITCHEN_QUEUE_STATUSES } from "../domain/operational-status";
import {
  isKitchenBatchStatus,
  type KitchenBatchStatus,
} from "../domain/kitchen-batch-status";
import {
  buildProductionReport,
  type DishMeta,
  type ProductionReportModel,
  type ProductionSourceLine,
  type RecipeLine,
} from "../domain/production-report";

export type ProductionReportQuery = {
  deliveryDate: string;
  companyId?: string | null;
  siteId?: string | null;
  deliveryGroupId?: string | null;
};

async function loadDishMeta(
  ctx: ServiceContext,
  dishIds: string[],
): Promise<Map<string, DishMeta>> {
  const map = new Map<string, DishMeta>();
  if (dishIds.length === 0) return map;

  const db = ctx.supabase as any;
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

async function loadRecipeLines(
  ctx: ServiceContext,
  dishIds: string[],
): Promise<RecipeLine[]> {
  if (dishIds.length === 0) return [];

  const db = ctx.supabase as any;
  const { data, error } = await db
    .from("dish_ingredients")
    .select("dish_id, ingredient_id, qty, unit, ingredients ( id, name )")
    .eq("tenant_id", ctx.tenantId)
    .in("dish_id", dishIds);
  if (error) throw error;

  return ((data ?? []) as Array<{
    dish_id: string;
    ingredient_id: string;
    qty: number;
    unit: string;
    ingredients: { id: string; name: string } | null;
  }>)
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
  dishIds: string[],
): Promise<Map<string, { status: KitchenBatchStatus; updatedAt: string | null }>> {
  const map = new Map<
    string,
    { status: KitchenBatchStatus; updatedAt: string | null }
  >();
  if (dishIds.length === 0) return map;

  const db = ctx.supabase as any;
  const { data, error } = await db
    .from("kitchen_production_batches")
    .select("dish_id, status, updated_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("delivery_date", deliveryDate)
    .in("dish_id", dishIds);
  if (error) throw error;

  for (const row of (data ?? []) as Array<{
    dish_id: string;
    status: string;
    updated_at: string | null;
  }>) {
    if (!isKitchenBatchStatus(row.status)) continue;
    map.set(row.dish_id, {
      status: row.status,
      updatedAt: row.updated_at,
    });
  }
  return map;
}

function flattenOrdersToLines(
  orders: Awaited<
    ReturnType<ReturnType<typeof createOperationsRepository>["listOrders"]>
  >,
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
        dishId: item.dishId,
        dishName: item.dishName,
        qty: item.qty,
        dayDate: item.dayDate,
        comment: item.notes,
      });
    }
  }
  return lines;
}

export const ProductionReportService = {
  /**
   * Build the operational production sheet for a delivery day.
   * Source = kitchen queue statuses (confirmed → prepared), never mocks.
   * Includes EP-002B.2 batch status per dish lot (default pending).
   */
  async buildForDay(
    ctx: ServiceContext,
    query: ProductionReportQuery,
  ): Promise<ProductionReportModel> {
    requireCapability(ctx.roles, "kitchen.operate");

    if (!query.deliveryDate) {
      throw new Error("deliveryDate is required");
    }

    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    const filters: OperationalOrderFilters = {
      statuses: KITCHEN_QUEUE_STATUSES,
      deliveryDate: query.deliveryDate,
      companyId: query.companyId ?? null,
      siteId: query.siteId ?? null,
      deliveryGroupId: query.deliveryGroupId ?? null,
    };
    const orders = await repo.listOrders(filters);
    const lines = flattenOrdersToLines(orders, query.deliveryDate);
    const dishIds = [...new Set(lines.map((l) => l.dishId))];

    const [dishMetaById, recipeLines, batchStatusByDish] = await Promise.all([
      loadDishMeta(ctx, dishIds),
      loadRecipeLines(ctx, dishIds),
      loadBatchStatuses(ctx, query.deliveryDate, dishIds),
    ]);

    return buildProductionReport({
      deliveryDate: query.deliveryDate,
      lines,
      dishMetaById,
      recipeLines,
      batchStatusByDish,
    });
  },
};
