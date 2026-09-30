import { AuditService } from "@/services/audit-service";
import type { ServiceContext } from "@/services/types";
import {
  type OperationalOrderStatus,
  nextKitchenStatuses,
  nextDeliveryStatuses,
} from "@/modules/operations";
import type { OrderRepository } from "@/modules/orders/infrastructure/order-repository";
import { requireCapability } from "@/permissions";
import { DomainError } from "@/domain/errors";

export const OrderLifecycleService = {
  /** Confirm a draft order */
  async confirmOrder(
    ctx: ServiceContext,
    repo: OrderRepository,
    orderId: string,
  ) {
    requireCapability(ctx.roles, "orders.write");
    const current = await repo.findByIdWithItems(orderId);
    if (!current) throw new DomainError("NOT_FOUND", `Order ${orderId} not found`);
    if (current.order.status !== "draft")
      throw new DomainError("INVALID_STATE", `Order ${orderId} is not a draft`);

    const { data: updated, error } = await ctx.supabase
      .from("orders")
      .update({ status: "confirmed" })
      .eq("tenant_id", ctx.tenantId)
      .eq("id", orderId)
      .eq("status", "draft")
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) throw error;

    await AuditService.write(ctx, {
      entityType: "order",
      entityId: orderId,
      action: "status_change",
      oldData: { status: current.order.status },
      newData: { status: updated.status },
    });

    return updated;
  },

  /** Advance to the next kitchen status */
  async advanceKitchen(
    ctx: ServiceContext,
    repo: OrderRepository,
    orderId: string,
  ) {
    requireCapability(ctx.roles, "orders.write");
    const current = await repo.findByIdWithItems(orderId);
    if (!current) throw new DomainError("NOT_FOUND", `Order ${orderId} not found`);

    const next = nextKitchenStatuses(current.order.status as OperationalOrderStatus)[0];
    if (!next)
      throw new DomainError(
        "INVALID_STATE",
        `No kitchen transition from ${current.order.status}`,
      );

    const { data: updated, error } = await ctx.supabase
      .from("orders")
      .update({ status: next })
      .eq("tenant_id", ctx.tenantId)
      .eq("id", orderId)
      .eq("status", current.order.status)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) throw error;

    await AuditService.write(ctx, {
      entityType: "order",
      entityId: orderId,
      action: "status_change",
      oldData: { status: current.order.status },
      newData: { status: updated.status },
    });

    return updated;
  },

  /** Advance to the next delivery status */
  async advanceDelivery(
    ctx: ServiceContext,
    repo: OrderRepository,
    orderId: string,
  ) {
    requireCapability(ctx.roles, "orders.write");
    const current = await repo.findByIdWithItems(orderId);
    if (!current) throw new DomainError("NOT_FOUND", `Order ${orderId} not found`);

    const next = nextDeliveryStatuses(current.order.status as OperationalOrderStatus)[0];
    if (!next)
      throw new DomainError(
        "INVALID_STATE",
        `No delivery transition from ${current.order.status}`,
      );

    const { data: updated, error } = await ctx.supabase
      .from("orders")
      .update({ status: next })
      .eq("tenant_id", ctx.tenantId)
      .eq("id", orderId)
      .eq("status", current.order.status)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) throw error;

    await AuditService.write(ctx, {
      entityType: "order",
      entityId: orderId,
      action: "status_change",
      oldData: { status: current.order.status },
      newData: { status: updated.status },
    });

    return updated;
  },

  /** Cancel an order in a cancel-able state */
  async cancelOrder(
    ctx: ServiceContext,
    repo: OrderRepository,
    orderId: string,
    reason: string,
  ) {
    requireCapability(ctx.roles, "orders.write");
    if (!reason?.trim()) {
      throw new DomainError("INVALID_STATE", "Cancellation reason is required");
    }

    const cancelable = new Set<string>([
      "draft",
      "confirmed",
      "in_production",
      "prepared",
      "ready_for_delivery",
    ]);

    const current = await repo.findByIdWithItems(orderId);
    if (!current) throw new DomainError("NOT_FOUND", `Order ${orderId} not found`);
    if (!cancelable.has(current.order.status)) {
      throw new DomainError(
        "INVALID_STATE",
        `Order ${orderId} cannot be cancelled from status ${current.order.status}`,
      );
    }

    const { data: updated, error } = await ctx.supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("tenant_id", ctx.tenantId)
      .eq("id", orderId)
      .eq("status", current.order.status)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) throw error;

    await AuditService.write(ctx, {
      entityType: "order",
      entityId: orderId,
      action: "status_change",
      oldData: { status: current.order.status },
      newData: { status: updated.status, cancelReason: reason },
    });

    return updated;
  },
};
