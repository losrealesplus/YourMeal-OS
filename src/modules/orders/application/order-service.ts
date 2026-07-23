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
 * CAP-004 — program a Draft order (first mutation pattern).
 * Does not confirm (CAP-006). Audit is part of the flow.
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
};
