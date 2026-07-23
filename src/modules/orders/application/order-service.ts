import { AuditService } from "@/services/audit-service";
import type { ServiceContext } from "@/services/types";
import { requireCapability } from "@/permissions";
import { DomainError } from "@/domain/errors";
import {
  createOrderRepository,
  type OrderItemRow,
  type OrderRow,
  type ProgramOrderItemInput,
} from "../infrastructure/order-repository";

export type ProgramDraftOrderCommand = {
  weekStart: string;
  dayDate: string;
  dishIds: string[];
  /** Amount already shown in schedule scaffold (EUR major units). */
  total: number;
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

    if (!command.dishIds.length) {
      throw new DomainError("INVALID_STATE", "Order programming requires at least one dish");
    }
    if (!command.weekStart || !command.dayDate) {
      throw new DomainError("INVALID_STATE", "weekStart and dayDate are required");
    }

    const repo = createOrderRepository(ctx.supabase, ctx.tenantId);
    const customerId = await repo.findCustomerIdForUser(ctx.userId);
    if (!customerId) {
      throw new DomainError(
        "NOT_FOUND",
        "No customer profile linked to this user for the active tenant",
      );
    }

    const items: ProgramOrderItemInput[] = command.dishIds.map((dishId) => ({
      dishId,
      dayDate: command.dayDate,
      qty: 1,
    }));

    const result = await repo.insertDraft({
      customerId,
      weekStart: command.weekStart,
      total: command.total,
      notes: command.notes ?? null,
      items,
    });

    await AuditService.write(ctx, {
      entityType: "order",
      entityId: result.order.id,
      action: "create",
      newData: {
        order: result.order,
        items: result.items,
      } as unknown as Record<string, unknown>,
    });

    return result;
  },

  /**
   * CAP-006 — OM: Draft → Confirmed.
   * @see docs/17-operational-model/04-lifecycles/spine-transitions.md
   */
  async confirm(ctx: ServiceContext, orderId: string): Promise<OrderRow> {
    requireCapability(ctx.roles, "orders.write");
    if (!orderId) {
      throw new DomainError("INVALID_STATE", "orderId is required");
    }

    const repo = createOrderRepository(ctx.supabase, ctx.tenantId);
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

    await AuditService.write(ctx, {
      entityType: "order",
      entityId: result.order.id,
      action: "status_change",
      oldData: { status: result.old.status } as Record<string, unknown>,
      newData: { status: result.order.status } as Record<string, unknown>,
    });

    return result.order;
  },
};
