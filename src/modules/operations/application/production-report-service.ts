/**
 * EP-002B — ProductionReportService
 * Builds the daily Hoja de Producción from real kitchen-queue orders.
 */
import type { ServiceContext } from "@/services/types";
import { requireCapability } from "@/permissions";
import {
  createOperationsRepository,
  type OperationalOrderFilters,
} from "../infrastructure/operations-repository";
import { KITCHEN_QUEUE_STATUSES } from "../domain/operational-status";
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

    const [dishMetaById, recipeLines] = await Promise.all([
      loadDishMeta(ctx, dishIds),
      loadRecipeLines(ctx, dishIds),
    ]);

    return buildProductionReport({
      deliveryDate: query.deliveryDate,
      lines,
      dishMetaById,
      recipeLines,
    });
  },
};
