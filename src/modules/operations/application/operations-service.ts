import type { ServiceContext } from "@/services/types";
import { AuditService } from "@/services/audit-service";
import { DomainError } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import {
  createOperationsRepository,
  type OperationalOrderFilters,
  type OperationalOrderListItem,
} from "../infrastructure/operations-repository";
import {
  DELIVERY_QUEUE_STATUSES,
  KITCHEN_QUEUE_STATUSES,
  nextDeliveryStatuses,
  nextKitchenStatuses,
  type OperationalOrderStatus,
} from "../domain/operational-status";
import {
  canOperateDelivery,
  canOperateKitchen,
} from "@/modules/bootstrap-integrity";
import {
  beginFlow01Pipeline,
  logFlow01Step,
  stopFlow01,
} from "./flow01-evidence";

export const OperationsService = {
  /**
   * FLOW-01 T1 · Spec `startProduction`
   * Kitchen → Production: confirmed → in_production
   * Emits FLOW01_T1_STARTED / FLOW01_T1_COMPLETED exactly once on success.
   */
  async startProduction(
    ctx: ServiceContext,
    orderId: string,
  ): Promise<OperationalOrderStatus> {
    return this.transitionKitchen(ctx, orderId, "in_production");
  },

  async listKitchenOrders(
    ctx: ServiceContext,
    filters: Omit<OperationalOrderFilters, "statuses"> = {},
  ): Promise<OperationalOrderListItem[]> {
    requireCapability(ctx.roles, "kitchen.operate");
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    return repo.listOrders({
      ...filters,
      statuses: KITCHEN_QUEUE_STATUSES,
    });
  },

  async listDeliveryOrders(
    ctx: ServiceContext,
    filters: Omit<OperationalOrderFilters, "statuses"> = {},
  ): Promise<OperationalOrderListItem[]> {
    requireCapability(ctx.roles, "logistics.operate");
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    return repo.listOrders({
      ...filters,
      statuses: DELIVERY_QUEUE_STATUSES,
    });
  },

  async kitchenPendingCount(
    ctx: ServiceContext,
    deliveryDate?: string | null,
  ): Promise<number> {
    requireCapability(ctx.roles, "orders.read");
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    return repo.countByStatuses(KITCHEN_QUEUE_STATUSES, deliveryDate);
  },

  async deliveryPendingCount(
    ctx: ServiceContext,
    deliveryDate?: string | null,
  ): Promise<number> {
    requireCapability(ctx.roles, "orders.read");
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    return repo.countByStatuses(
      ["ready_for_delivery", "out_for_delivery"],
      deliveryDate,
    );
  },

  async getOrder(
    ctx: ServiceContext,
    orderId: string,
  ): Promise<OperationalOrderListItem | null> {
    requireCapability(ctx.roles, "orders.read");
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    return repo.getOrder(orderId);
  },

  async transitionKitchen(
    ctx: ServiceContext,
    orderId: string,
    toStatus: OperationalOrderStatus,
  ): Promise<OperationalOrderStatus> {
    requireCapability(ctx.roles, "kitchen.operate");
    return this.transition(ctx, orderId, toStatus, "kitchen");
  },

  async transitionDelivery(
    ctx: ServiceContext,
    orderId: string,
    toStatus: OperationalOrderStatus,
  ): Promise<OperationalOrderStatus> {
    requireCapability(ctx.roles, "logistics.operate");
    return this.transition(ctx, orderId, toStatus, "delivery");
  },

  async transition(
    ctx: ServiceContext,
    orderId: string,
    toStatus: OperationalOrderStatus,
    workspace: "kitchen" | "delivery",
  ): Promise<OperationalOrderStatus> {
    if (!orderId) {
      throw new DomainError("INVALID_STATE", "orderId required");
    }
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);

    // OP-001.2 · Service-level integrity (not UI-only).
    if (workspace === "kitchen") {
      const demand = await repo.countByStatuses(KITCHEN_QUEUE_STATUSES);
      const gate = canOperateKitchen({ confirmedOrInKitchenCount: demand });
      if (!gate.ok) {
        throw new DomainError("INVALID_STATE", gate.message, {
          code: gate.code,
        });
      }
    } else {
      const demand = await repo.countByStatuses(DELIVERY_QUEUE_STATUSES);
      const gate = canOperateDelivery({ readyForDeliveryCount: demand });
      if (!gate.ok) {
        throw new DomainError("INVALID_STATE", gate.message, {
          code: gate.code,
        });
      }
    }

    const current = await repo.getOrder(orderId);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Order not found: ${orderId}`);
    }

    const allowed =
      workspace === "kitchen"
        ? nextKitchenStatuses(current.status)
        : nextDeliveryStatuses(current.status);
    if (!allowed.includes(toStatus)) {
      throw new DomainError(
        "INVALID_STATE",
        `Cannot transition ${current.status} → ${toStatus} in ${workspace}`,
      );
    }

    const isFlow01T1 =
      workspace === "kitchen" &&
      current.status === "confirmed" &&
      toStatus === "in_production";

    if (isFlow01T1) {
      beginFlow01Pipeline({ orderId, tenantId: ctx.tenantId });
      logFlow01Step("FLOW01_T1_STARTED", {
        orderId,
        from: current.status,
        to: toStatus,
      });
    }

    try {
      const next = await repo.transitionStatus(orderId, toStatus);
      try {
        await AuditService.write(ctx, {
          entityType: "order",
          entityId: orderId,
          action: "status_change",
          oldData: { status: current.status },
          newData: { status: next, workspace },
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Audit failed";
        throw new DomainError("INVALID_STATE", message);
      }

      if (isFlow01T1) {
        logFlow01Step("FLOW01_T1_COMPLETED", {
          orderId,
          status: next,
        });
      }
      return next;
    } catch (e) {
      if (isFlow01T1) {
        stopFlow01("T1_FAILED", {
          orderId,
          message: e instanceof Error ? e.message : "transition failed",
        });
      }
      throw e;
    }
  },
};
