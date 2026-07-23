import { AuditService } from "@/services/audit-service";
import { FeatureFlagService } from "@/services/feature-flag-service";
import type { ServiceContext } from "@/services/types";
import { requireCapability, hasStaffAccess } from "@/permissions";
import { DomainError } from "@/domain/errors";
import { createDishRepository } from "@/modules/dish-library/infrastructure/dish-repository";
import { createWeeklyMenuRepository } from "@/modules/weekly-menu/infrastructure/weekly-menu-repository";
import {
  createOrderRepository,
  type OrderItemRow,
  type OrderRow,
  type ProgramOrderItemInput,
} from "../infrastructure/order-repository";

export type ProgramDraftOrderCommand = {
  weekStart: string;
  dayDate: string;
  /** Candidate dish ids from UI — validated against published offer; never trusted for price. */
  dishIds: string[];
  notes?: string | null;
};

export type ProgramDraftOrderResult = {
  order: OrderRow;
  items: OrderItemRow[];
};

/**
 * CAP-004 programDraft · CAP-006 confirm — Mutation Pattern.
 * Audit is part of every write flow.
 */
export const OrderService = {
  async programDraft(
    ctx: ServiceContext,
    command: ProgramDraftOrderCommand,
  ): Promise<ProgramDraftOrderResult> {
    requireCapability(ctx.roles, "orders.write");

    if (!(await FeatureFlagService.isEnabled(ctx, "order_programming"))) {
      throw new DomainError("UNIMPLEMENTED", "Order programming is disabled by feature flag");
    }

    if (!command.dishIds.length) {
      throw new DomainError("INVALID_STATE", "Order programming requires at least one dish");
    }
    if (!command.weekStart || !command.dayDate) {
      throw new DomainError("INVALID_STATE", "weekStart and dayDate are required");
    }

    const uniqueDishIds = [...new Set(command.dishIds)];
    const menuRepo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
    const menu = await menuRepo.findPublishedByWeekStart(command.weekStart);
    if (!menu) {
      throw new DomainError("MENU_LOCKED", "No published weekly menu for this week");
    }

    const slots = await menuRepo.listSlotsWithDishes(menu.id);
    const offeredIds = new Set(
      slots
        .filter((s) => s.day_date === command.dayDate && s.dishes && !s.dishes.deleted_at)
        .map((s) => s.dish_id),
    );

    for (const dishId of uniqueDishIds) {
      if (!offeredIds.has(dishId)) {
        throw new DomainError(
          "INVALID_STATE",
          `Dish ${dishId} is not on the published offer for ${command.dayDate}`,
        );
      }
    }

    const dishRepo = createDishRepository(ctx.supabase, ctx.tenantId);
    const dishes = await dishRepo.listCatalogByIds(uniqueDishIds);
    if (dishes.length !== uniqueDishIds.length) {
      throw new DomainError("DISH_NOT_FOUND", "One or more dishes are unavailable");
    }

    const priceById = new Map(dishes.map((d) => [d.id, Number(d.price)]));
    let total = 0;
    const items: ProgramOrderItemInput[] = command.dishIds.map((dishId) => {
      const price = priceById.get(dishId);
      if (price == null || Number.isNaN(price)) {
        throw new DomainError("INVALID_STATE", `Missing price for dish ${dishId}`);
      }
      total += price;
      return { dishId, dayDate: command.dayDate, qty: 1 };
    });
    // Persist with 2 decimal places (orders.total numeric(12,2))
    total = Math.round(total * 100) / 100;

    const repo = createOrderRepository(ctx.supabase, ctx.tenantId);
    let customerId = await repo.findCustomerIdForUser(ctx.userId);
    if (!customerId) {
      // Structural correction ADR 0015 — provision Individual Customer without breaking CJ-001.
      const { CompanyAccountService } = await import(
        "@/modules/company-account/application/company-account-service"
      );
      customerId = await CompanyAccountService.ensureIndividualCustomer(ctx);
    }

    const { CompanyAccountService } = await import(
      "@/modules/company-account/application/company-account-service"
    );
    const demand = await CompanyAccountService.resolveOrderDemandContext(
      ctx,
      customerId,
    );

    const result = await repo.insertDraft({
      customerId,
      weekStart: command.weekStart,
      total,
      notes: command.notes ?? null,
      items,
      demandChannel: demand.demandChannel,
      companyId: demand.companyId,
      siteId: demand.siteId,
      organizationalUnitId: demand.organizationalUnitId,
      deliveryGroupId: demand.deliveryGroupId,
    });

    try {
      await AuditService.write(ctx, {
        entityType: "order",
        entityId: result.order.id,
        action: "create",
        newData: {
          order: result.order,
          items: result.items,
        } as unknown as Record<string, unknown>,
      });
    } catch (e) {
      // Persist succeeded; surface audit failure so Connected→Operational invariant is visible.
      const message = e instanceof Error ? e.message : "Audit write failed after draft persist";
      throw new DomainError("INVALID_STATE", message);
    }

    return result;
  },

  /**
   * CAP-006 — OM: Draft → Confirmed.
   * @see docs/17-operational-model/04-lifecycles/spine-transitions.md
   */
  async confirm(ctx: ServiceContext, orderId: string): Promise<OrderRow> {
    requireCapability(ctx.roles, "orders.write");

    if (!(await FeatureFlagService.isEnabled(ctx, "order_confirmation"))) {
      throw new DomainError("UNIMPLEMENTED", "Order confirmation is disabled by feature flag");
    }

    if (!orderId) {
      throw new DomainError("INVALID_STATE", "orderId is required");
    }

    const repo = createOrderRepository(ctx.supabase, ctx.tenantId);
    const current = await repo.findByIdWithItems(orderId);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Order not found: ${orderId}`);
    }

    // INC-03 — app-layer ownership for customers (staff keep tenant-scoped write).
    if (!hasStaffAccess(ctx.roles)) {
      const customerId = await repo.findCustomerIdForUser(ctx.userId);
      if (!customerId || current.order.customer_id !== customerId) {
        throw new DomainError("PERMISSION_DENIED", "Cannot confirm an order you do not own");
      }
    }

    let result: { old: OrderRow; order: OrderRow };
    try {
      result = await repo.confirmDraft(orderId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Confirm failed";
      if (message.includes("not found")) {
        throw new DomainError("NOT_FOUND", message);
      }
      throw new DomainError("INVALID_STATE", message);
    }

    try {
      await AuditService.write(ctx, {
        entityType: "order",
        entityId: result.order.id,
        action: "status_change",
        oldData: { status: result.old.status } as Record<string, unknown>,
        newData: { status: result.order.status } as Record<string, unknown>,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Audit write failed after confirm";
      throw new DomainError("INVALID_STATE", message);
    }

    return result.order;
  },
};
