/**
 * EP-002A.2 — RepeatOrderService
 * Load a historical order, validate against the current published menu,
 * and create a new draft with only available dishes.
 */
import type { ServiceContext } from "@/services/types";
import { DomainError } from "@/domain/errors";
import { requireCapability, hasStaffAccess } from "@/permissions";
import { createWeeklyMenuRepository } from "@/modules/weekly-menu/infrastructure/weekly-menu-repository";
import { utcWeekStartMonday } from "@/modules/weekly-menu/application/week-dates";
import { fetchCatalogDishesByIds } from "@/modules/dish-library/application/dish-catalog-queries";
import { createOrderRepository } from "../infrastructure/order-repository";
import { OrderIntakeService } from "@/modules/order-intake";
import type { ProgramDraftOrderResult } from "./order-service";
import {
  buildRepeatOrderPlan,
  canRepeatPlan,
  type RepeatOrderPlan,
  type SourceOrderLine,
} from "../domain/repeat-order";

export type RepeatOrderPreview = RepeatOrderPlan & {
  sourceOrderId: string;
  canRepeat: boolean;
};

export type RepeatOrderResult = {
  preview: RepeatOrderPreview;
  draft: ProgramDraftOrderResult;
};

async function assertOrderOwnership(
  ctx: ServiceContext,
  customerIdOnOrder: string,
): Promise<void> {
  if (hasStaffAccess(ctx.roles)) return;
  const repo = createOrderRepository(ctx.supabase, ctx.tenantId);
  const customerId = await repo.findCustomerIdForUser(ctx.userId);
  if (!customerId || customerId !== customerIdOnOrder) {
    throw new DomainError("PERMISSION_DENIED", "Cannot repeat an order you do not own");
  }
}

async function loadSourceLines(
  ctx: ServiceContext,
  orderId: string,
): Promise<{
  sourceWeekStart: string;
  customerId: string;
  lines: SourceOrderLine[];
}> {
  const repo = createOrderRepository(ctx.supabase, ctx.tenantId);
  const current = await repo.findByIdWithItems(orderId);
  if (!current) {
    throw new DomainError("NOT_FOUND", `Order not found: ${orderId}`);
  }
  if (current.order.status === "cancelled") {
    throw new DomainError("INVALID_STATE", "Cancelled orders cannot be repeated");
  }
  if (!current.items.length) {
    throw new DomainError("INVALID_STATE", "Order has no dishes to repeat");
  }

  await assertOrderOwnership(ctx, current.order.customer_id);

  const dishIds = [...new Set(current.items.map((i) => i.dish_id))];
  const dishesById = await fetchCatalogDishesByIds(ctx.tenantId, dishIds);

  const lines: SourceOrderLine[] = current.items.map((item) => ({
    dishId: item.dish_id,
    dishName: dishesById.get(item.dish_id)?.name ?? null,
    qty: Number(item.qty) || 1,
    dayDate: item.day_date,
  }));

  return {
    sourceWeekStart: current.order.week_start,
    customerId: current.order.customer_id,
    lines,
  };
}

async function buildOfferByDish(
  ctx: ServiceContext,
  targetWeekStart: string,
): Promise<Map<string, string[]>> {
  const menuRepo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
  const menu = await menuRepo.findPublishedByWeekStart(targetWeekStart);
  if (!menu) {
    throw new DomainError("MENU_LOCKED", "No published weekly menu for this week");
  }

  const slots = await menuRepo.listSlotsWithDishes(menu.id);
  const offerByDish = new Map<string, string[]>();
  for (const slot of slots) {
    if (!slot.day_date || !slot.dishes || slot.dishes.deleted_at) continue;
    const days = offerByDish.get(slot.dish_id) ?? [];
    if (!days.includes(slot.day_date)) days.push(slot.day_date);
    offerByDish.set(slot.dish_id, days);
  }
  for (const [dishId, days] of offerByDish) {
    offerByDish.set(dishId, [...days].sort());
  }
  return offerByDish;
}

export const RepeatOrderService = {
  /**
   * Preview which dishes from a historical order can enter the current week.
   */
  async preview(
    ctx: ServiceContext,
    sourceOrderId: string,
    targetWeekStart: string = utcWeekStartMonday(),
  ): Promise<RepeatOrderPreview> {
    requireCapability(ctx.roles, "orders.read");

    const source = await loadSourceLines(ctx, sourceOrderId);
    const offerByDish = await buildOfferByDish(ctx, targetWeekStart);
    const plan = buildRepeatOrderPlan({
      sourceWeekStart: source.sourceWeekStart,
      sourceLines: source.lines,
      targetWeekStart,
      offerByDish,
    });

    return {
      sourceOrderId,
      ...plan,
      canRepeat: canRepeatPlan(plan),
    };
  },

  /**
   * Create a new draft from available dishes only; unavailable dishes are skipped.
   */
  async execute(
    ctx: ServiceContext,
    sourceOrderId: string,
    targetWeekStart: string = utcWeekStartMonday(),
  ): Promise<RepeatOrderResult> {
    requireCapability(ctx.roles, "orders.write");

    const preview = await RepeatOrderService.preview(
      ctx,
      sourceOrderId,
      targetWeekStart,
    );
    if (!preview.canRepeat) {
      throw new DomainError(
        "INVALID_STATE",
        "None of the dishes from this order are on the current menu",
      );
    }

    const draft = await OrderIntakeService.intakeDraft(ctx, {
      channel: "app",
      weekStart: preview.targetWeekStart,
      notes: `repeat:${sourceOrderId}`,
      items: preview.available.map((line) => ({
        dishId: line.dishId,
        dayDate: line.targetDayDate,
        qty: line.qty,
      })),
    });

    return { preview, draft };
  },
};
