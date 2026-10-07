import {
  createLifecycleAttempt,
  executeLifecycleAttempt,
  type LifecycleAction,
  type LifecycleAttempt,
} from "../infrastructure/canonical-lifecycle";
import type { OrderRow } from "../infrastructure/order-repository";
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

async function canonical(
  ctx: ServiceContext,
  order: OrderRow,
  action: LifecycleAction,
  reason?: string,
  attempt?: LifecycleAttempt,
) {
  if (!Number.isInteger(order.revision))
    throw new DomainError("INVALID_STATE", "Missing canonical revision");
  const input =
    attempt ??
    createLifecycleAttempt(
      { id: order.id, status: order.status, revision: order.revision! },
      action,
      reason === undefined ? {} : { reason },
    );
  const result = await executeLifecycleAttempt(ctx.supabase, ctx.tenantId, input);
  return { ...order, status: result.toState, revision: result.committedRevision };
}

export const OrderLifecycleService = {
  /** Confirm a draft order */
  async confirmOrder(
    ctx: ServiceContext,
    repo: OrderRepository,
    orderId: string,
    attempt?: LifecycleAttempt,
  ) {
    requireCapability(ctx.roles, "orders.write");
    const current = await repo.findByIdWithItems(orderId);
    if (!current) throw new DomainError("NOT_FOUND", `Order ${orderId} not found`);
    if (current.order.write_contract_version === 2)
      return canonical(ctx, current.order, "confirm", undefined, attempt);
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
  async advanceKitchen(ctx: ServiceContext, repo: OrderRepository, orderId: string) {
    requireCapability(ctx.roles, "orders.write");
    const current = await repo.findByIdWithItems(orderId);
    if (!current) throw new DomainError("NOT_FOUND", `Order ${orderId} not found`);

    const next = nextKitchenStatuses(current.order.status as OperationalOrderStatus)[0];
    if (!next)
      throw new DomainError("INVALID_STATE", `No kitchen transition from ${current.order.status}`);

    if (current.order.write_contract_version === 2) {
      const action: LifecycleAction =
        next === "in_production"
          ? "start_production"
          : next === "prepared"
            ? "complete_production"
            : "assign_delivery";
      return canonical(ctx, current.order, action);
    }
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
  async advanceDelivery(ctx: ServiceContext, repo: OrderRepository, orderId: string) {
    requireCapability(ctx.roles, "orders.write");
    const current = await repo.findByIdWithItems(orderId);
    if (!current) throw new DomainError("NOT_FOUND", `Order ${orderId} not found`);

    const next = nextDeliveryStatuses(current.order.status as OperationalOrderStatus)[0];
    if (!next)
      throw new DomainError("INVALID_STATE", `No delivery transition from ${current.order.status}`);

    if (current.order.write_contract_version === 2)
      return canonical(
        ctx,
        current.order,
        current.order.status === "delivery_issue"
          ? "retry_delivery"
          : next === "out_for_delivery"
            ? "dispatch"
            : "complete_delivery",
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
    attempt?: LifecycleAttempt,
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
    if (current.order.write_contract_version === 2)
      return canonical(ctx, current.order, "cancel", reason, attempt);
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

    // CR-OPS-08 (R-05): Cascade cancellation to delivery_services
    if (typeof ctx.supabase?.from === "function") {
      try {
        const { createOperationsRepository } =
          await import("@/modules/operations/infrastructure/operations-repository");
        const opsRepo = createOperationsRepository(ctx.supabase, ctx.tenantId);
        await opsRepo.cancelDeliveryServicesForOrder(orderId, reason);
      } catch (deliveryErr) {
        console.warn(
          "[CR-OPS-08] Cascade cancellation of delivery_services deferred:",
          deliveryErr,
        );
      }
    }

    return updated;
  },
};
