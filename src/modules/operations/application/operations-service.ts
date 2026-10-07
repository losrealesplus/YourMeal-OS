import {
  createLifecycleAttempt,
  executeLifecycleAttempt,
  type LifecycleAction,
} from "@/modules/orders/infrastructure/canonical-lifecycle";
import type { ServiceContext } from "@/services/types";
import { AuditService } from "@/services/audit-service";
import { DomainError } from "@/domain/errors";
import { canAny, requireCapability } from "@/permissions";
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
import type { DeliveryServiceModel, DeliveryServiceStatus } from "../domain/delivery-service";
import { canOperateDelivery, canOperateKitchen } from "@/modules/bootstrap-integrity";
import {
  assertFlow01Prefix,
  beginFlow01Pipeline,
  hasFlow01Step,
  logFlow01Step,
  stopFlow01,
} from "./flow01-evidence";
import { beginFlow02Pipeline, hasFlow02Step, logFlow02Step, stopFlow02 } from "./flow02-evidence";
import {
  completePackagingBatch,
  getPackagingBatch,
  startPackagingBatch,
  type PackagingBatch,
} from "../domain/packaging-batch";
import {
  assignDeliveryOrder,
  getDeliveryAssignment,
  type DeliveryAssignment,
} from "../domain/delivery-assignment";

async function canonicalOperation(ctx: ServiceContext, orderId: string, action: LifecycleAction) {
  const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
  const order = await repo.getOrder(orderId);
  if (order?.writeContractVersion !== 2) return null;
  return executeLifecycleAttempt(
    ctx.supabase,
    ctx.tenantId,
    createLifecycleAttempt(
      { id: order.id, status: order.status, revision: order.revision! },
      action,
    ),
  );
}

export const OperationsService = {
  /**
   * FLOW-01 T1 · Spec `startProduction`
   * Kitchen → Production: confirmed → in_production
   * Emits FLOW01_T1_STARTED / FLOW01_T1_COMPLETED exactly once on success.
   */
  async startProduction(ctx: ServiceContext, orderId: string): Promise<OperationalOrderStatus> {
    return this.transitionKitchen(ctx, orderId, "in_production");
  },

  /**
   * FLOW-01 T2 · Spec `completeProduction`
   * Production complete: in_production → prepared
   * Emits FLOW01_T2_STARTED (T2_COMPLETED follows startPackaging).
   */
  async completeProduction(ctx: ServiceContext, orderId: string): Promise<OperationalOrderStatus> {
    if (!canAny(ctx.roles, ["kitchen.operate", "production.operate"]))
      throw new DomainError("PERMISSION_DENIED", "No tienes permiso para completar producción.");
    const canonical = await canonicalOperation(ctx, orderId, "complete_production");
    if (canonical) return canonical.toState;
    return this.transitionKitchen(ctx, orderId, "prepared");
  },

  /**
   * FLOW-01 T2 · Spec `startPackaging`
   * Opens PackagingBatch IN_PROGRESS for a prepared order.
   * Emits FLOW01_T2_COMPLETED. Requires T1 + T2_STARTED.
   */
  async startPackaging(
    ctx: ServiceContext,
    orderId: string,
  ): Promise<{ status: OperationalOrderStatus; batch: PackagingBatch }> {
    requireCapability(ctx.roles, "kitchen.operate");
    const canonical = await canonicalOperation(ctx, orderId, "start_packing");
    if (canonical)
      return {
        status: canonical.toState,
        batch: { id: `pkg-${orderId}`, tenantId: ctx.tenantId, orderId, status: "IN_PROGRESS" },
      };
    if (!orderId) {
      throw new DomainError("INVALID_STATE", "orderId required");
    }

    try {
      assertFlow01Prefix(["FLOW01_T1_STARTED", "FLOW01_T1_COMPLETED"]);
    } catch {
      throw new DomainError("INVALID_STATE", "FLOW01-002 requires T1 COMPLETED before packaging");
    }

    if (!hasFlow01Step("FLOW01_T2_STARTED")) {
      throw new DomainError(
        "INVALID_STATE",
        "FLOW01-002 requires completeProduction (T2_STARTED) before startPackaging",
      );
    }

    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    const current = await repo.getOrder(orderId);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Order not found: ${orderId}`);
    }
    if (current.status !== "prepared") {
      throw new DomainError(
        "INVALID_STATE",
        `startPackaging requires prepared · got ${current.status}`,
      );
    }

    let batch: PackagingBatch;
    try {
      batch = startPackagingBatch({
        tenantId: ctx.tenantId,
        orderId,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "packaging failed";
      stopFlow01("T2_PACKAGING_FAILED", { orderId, message });
      throw new DomainError("INVALID_STATE", message);
    }

    logFlow01Step("FLOW01_T2_COMPLETED", {
      orderId,
      orderStatus: current.status,
      packagingBatchId: batch.id,
      packagingBatchStatus: batch.status,
    });

    return { status: current.status, batch };
  },

  /** Read-only helper for tests / evidence. */
  getPackagingBatchForOrder(ctx: ServiceContext, orderId: string): PackagingBatch | null {
    return getPackagingBatch(ctx.tenantId, orderId);
  },

  /**
   * FLOW-01 T3 · Spec `completePackaging`
   * PackagingBatch IN_PROGRESS → READY → CLOSED. Emits FLOW01_T3_STARTED.
   * (T3_COMPLETED follows assignDelivery — Spec: handoff to Delivery.)
   */
  async completePackaging(ctx: ServiceContext, orderId: string): Promise<PackagingBatch> {
    requireCapability(ctx.roles, "kitchen.operate");
    const canonical = await canonicalOperation(ctx, orderId, "complete_packing");
    if (canonical)
      return { id: `pkg-${orderId}`, tenantId: ctx.tenantId, orderId, status: "CLOSED" };
    if (!orderId) {
      throw new DomainError("INVALID_STATE", "orderId required");
    }

    try {
      assertFlow01Prefix([
        "FLOW01_T1_STARTED",
        "FLOW01_T1_COMPLETED",
        "FLOW01_T2_STARTED",
        "FLOW01_T2_COMPLETED",
      ]);
    } catch {
      throw new DomainError(
        "INVALID_STATE",
        "FLOW01-003 requires T2 COMPLETED before completePackaging",
      );
    }

    logFlow01Step("FLOW01_T3_STARTED", { orderId, tenantId: ctx.tenantId });

    try {
      const batch = completePackagingBatch({
        tenantId: ctx.tenantId,
        orderId,
      });
      if (batch.status !== "CLOSED") {
        throw new Error(`expected CLOSED · got ${batch.status}`);
      }
      return batch;
    } catch (e) {
      const message = e instanceof Error ? e.message : "completePackaging failed";
      stopFlow01("T3_PACKAGING_FAILED", { orderId, message });
      throw new DomainError("INVALID_STATE", message);
    }
  },

  /**
   * FLOW-01 T3 · Spec `assignDelivery`
   * prepared → ready_for_delivery + DeliveryAssignment.
   * Emits FLOW01_T3_COMPLETED. Does NOT emit out_for_delivery (that is T4).
   */
  async assignDelivery(
    ctx: ServiceContext,
    orderId: string,
  ): Promise<{
    status: OperationalOrderStatus;
    assignment: DeliveryAssignment;
    batch: PackagingBatch;
  }> {
    requireCapability(ctx.roles, "kitchen.operate");
    const canonical = await canonicalOperation(ctx, orderId, "assign_delivery");
    if (canonical)
      return {
        status: canonical.toState,
        batch: { id: `pkg-${orderId}`, tenantId: ctx.tenantId, orderId, status: "CLOSED" },
        assignment: { id: `asgn-${orderId}`, tenantId: ctx.tenantId, orderId, status: "ASSIGNED" },
      };
    if (!orderId) {
      throw new DomainError("INVALID_STATE", "orderId required");
    }

    if (!hasFlow01Step("FLOW01_T3_STARTED")) {
      throw new DomainError(
        "INVALID_STATE",
        "FLOW01-003 requires completePackaging (T3_STARTED) before assignDelivery",
      );
    }

    const batch = getPackagingBatch(ctx.tenantId, orderId);
    if (!batch || batch.status !== "CLOSED") {
      throw new DomainError("INVALID_STATE", "assignDelivery requires PackagingBatch CLOSED");
    }

    const status = await this.transitionKitchen(ctx, orderId, "ready_for_delivery");

    const assignment = assignDeliveryOrder({
      tenantId: ctx.tenantId,
      orderId,
    });

    logFlow01Step("FLOW01_T3_COMPLETED", {
      orderId,
      orderStatus: status,
      packagingBatchStatus: batch.status,
      assignmentId: assignment.id,
    });

    return { status, assignment, batch };
  },

  getDeliveryAssignmentForOrder(ctx: ServiceContext, orderId: string): DeliveryAssignment | null {
    return getDeliveryAssignment(ctx.tenantId, orderId);
  },

  /**
   * FLOW-01 T4 · Spec start of delivery
   * ready_for_delivery → out_for_delivery. Emits FLOW01_T4_STARTED.
   */
  async startOutForDelivery(ctx: ServiceContext, orderId: string): Promise<OperationalOrderStatus> {
    requireCapability(ctx.roles, "logistics.operate");
    const canonical = await canonicalOperation(ctx, orderId, "dispatch");
    if (canonical) return canonical.toState;
    if (!orderId) {
      throw new DomainError("INVALID_STATE", "orderId required");
    }

    try {
      assertFlow01Prefix([
        "FLOW01_T1_STARTED",
        "FLOW01_T1_COMPLETED",
        "FLOW01_T2_STARTED",
        "FLOW01_T2_COMPLETED",
        "FLOW01_T3_STARTED",
        "FLOW01_T3_COMPLETED",
      ]);
    } catch {
      throw new DomainError(
        "INVALID_STATE",
        "FLOW01-004 requires T3 COMPLETED before out_for_delivery",
      );
    }

    if (!getDeliveryAssignment(ctx.tenantId, orderId)) {
      throw new DomainError(
        "INVALID_STATE",
        "FLOW01-004 requires DeliveryAssignment before out_for_delivery",
      );
    }

    logFlow01Step("FLOW01_T4_STARTED", {
      orderId,
      from: "ready_for_delivery",
      to: "out_for_delivery",
    });

    try {
      return await this.transitionDelivery(ctx, orderId, "out_for_delivery");
    } catch (e) {
      stopFlow01("T4_START_FAILED", {
        orderId,
        message: e instanceof Error ? e.message : "transition failed",
      });
      throw e;
    }
  },

  /**
   * FLOW-01 T4 · Spec `completeDelivery`
   * out_for_delivery → delivered. Emits FLOW01_T4_COMPLETED.
   * Success criterion: orders.status = delivered.
   */
  async completeDelivery(ctx: ServiceContext, orderId: string): Promise<OperationalOrderStatus> {
    requireCapability(ctx.roles, "logistics.operate");
    if (!orderId) {
      throw new DomainError("INVALID_STATE", "orderId required");
    }

    if (!hasFlow01Step("FLOW01_T4_STARTED")) {
      throw new DomainError(
        "INVALID_STATE",
        "FLOW01-004 requires startOutForDelivery (T4_STARTED) before completeDelivery",
      );
    }

    try {
      const status = await this.transitionDelivery(ctx, orderId, "delivered");
      if (status !== "delivered") {
        throw new DomainError(
          "INVALID_STATE",
          `completeDelivery expected delivered · got ${status}`,
        );
      }
      logFlow01Step("FLOW01_T4_COMPLETED", {
        orderId,
        status,
      });
      return status;
    } catch (e) {
      if (!(e instanceof DomainError && String(e.message).includes("T4_STARTED"))) {
        stopFlow01("T4_COMPLETE_FAILED", {
          orderId,
          message: e instanceof Error ? e.message : "transition failed",
        });
      }
      throw e;
    }
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

  async listDeliveryServices(
    ctx: ServiceContext,
    filters: {
      deliveryDate?: string | null;
      status?: DeliveryServiceStatus | DeliveryServiceStatus[];
      orderId?: string | null;
      customerId?: string | null;
    } = {},
  ): Promise<DeliveryServiceModel[]> {
    requireCapability(ctx.roles, "logistics.operate");
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    return repo.listDeliveryServices(filters);
  },

  async getDeliveryService(
    ctx: ServiceContext,
    serviceId: string,
  ): Promise<DeliveryServiceModel | null> {
    requireCapability(ctx.roles, "logistics.operate");
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    return repo.getDeliveryService(serviceId);
  },

  async getDeliveryServiceByOrderDay(
    ctx: ServiceContext,
    orderId: string,
    deliveryDate: string,
  ): Promise<DeliveryServiceModel | null> {
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    return repo.getDeliveryServiceByOrderDay(orderId, deliveryDate);
  },

  async transitionDeliveryService(
    ctx: ServiceContext,
    serviceId: string,
    toStatus: DeliveryServiceStatus,
    notes?: string,
  ): Promise<DeliveryServiceModel> {
    requireCapability(ctx.roles, "logistics.operate");
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    const updated = await repo.transitionDeliveryService(serviceId, toStatus, ctx.userId, notes);
    const parent = await repo.getOrder(updated.orderId);
    if (parent?.writeContractVersion === 2) return updated;
    await AuditService.write(ctx, {
      entityType: "delivery_service",
      entityId: serviceId,
      action: "status_change",
      newData: { status: toStatus, notes },
    });
    return updated;
  },

  async ensureDeliveryServicesForOrder(
    ctx: ServiceContext,
    orderId: string,
  ): Promise<DeliveryServiceModel[]> {
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    return repo.createDeliveryServicesForOrder(orderId);
  },

  /**
   * CR-OPS-06 Handoff: Marks a customer bag packed for a delivery date.
   * Atomically transitions the day's delivery_service to ready_for_delivery.
   */
  async packOrderDay(
    ctx: ServiceContext,
    orderId: string,
    deliveryDate: string,
  ): Promise<DeliveryServiceModel> {
    requireCapability(ctx.roles, "kitchen.operate");
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);

    // 1. Ensure service exists
    let service = await repo.getDeliveryServiceByOrderDay(orderId, deliveryDate);
    if (!service) {
      await repo.createDeliveryServicesForOrder(orderId);
      service = await repo.getDeliveryServiceByOrderDay(orderId, deliveryDate);
    }

    if (!service) {
      throw new DomainError(
        "NOT_FOUND",
        `Delivery service not found for order ${orderId} on date ${deliveryDate}`,
      );
    }

    // 2. Transition service to ready_for_delivery
    const updated = await repo.transitionDeliveryService(
      service.id,
      "ready_for_delivery",
      ctx.userId,
    );

    // 3. Keep kitchen macro-order state consistent with in_production/prepared
    const currentOrder = await repo.getOrder(orderId);
    if (currentOrder?.writeContractVersion === 2) return updated;
    if (
      currentOrder &&
      (currentOrder.status === "confirmed" || currentOrder.status === "in_production")
    ) {
      try {
        await repo.transitionStatus(orderId, "prepared");
      } catch {
        // Best-effort macro status sync if order already advanced
      }
    }

    await AuditService.write(ctx, {
      entityType: "delivery_service",
      entityId: service.id,
      action: "status_change",
      newData: { status: "ready_for_delivery", deliveryDate },
    });

    return updated;
  },

  async kitchenPendingCount(ctx: ServiceContext, deliveryDate?: string | null): Promise<number> {
    requireCapability(ctx.roles, "orders.read");
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    return repo.countByStatuses(KITCHEN_QUEUE_STATUSES, deliveryDate);
  },

  async deliveryPendingCount(ctx: ServiceContext, deliveryDate?: string | null): Promise<number> {
    requireCapability(ctx.roles, "orders.read");
    const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
    return repo.countByStatuses(["ready_for_delivery", "out_for_delivery"], deliveryDate);
  },

  async getOrder(ctx: ServiceContext, orderId: string): Promise<OperationalOrderListItem | null> {
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

    if (current.writeContractVersion === 2) return repo.transitionStatus(orderId, toStatus);

    const isFlow01T1 =
      workspace === "kitchen" && current.status === "confirmed" && toStatus === "in_production";

    const isFlow01T2Start =
      workspace === "kitchen" && current.status === "in_production" && toStatus === "prepared";

    /** FLOW-02 T1 · out_for_delivery → delivery_issue */
    const isFlow02T1 =
      workspace === "delivery" &&
      current.status === "out_for_delivery" &&
      toStatus === "delivery_issue";

    /** FLOW-02 T2 · delivery_issue → out_for_delivery (retry) */
    const isFlow02T2 =
      workspace === "delivery" &&
      current.status === "delivery_issue" &&
      toStatus === "out_for_delivery";

    /** FLOW-02 T3 · out_for_delivery (post-retry) → delivered (requires T2) */
    const isFlow02T3 =
      workspace === "delivery" &&
      current.status === "out_for_delivery" &&
      toStatus === "delivered" &&
      hasFlow02Step("FLOW02_T2_COMPLETED");

    if (isFlow01T1) {
      beginFlow01Pipeline({ orderId, tenantId: ctx.tenantId });
      logFlow01Step("FLOW01_T1_STARTED", {
        orderId,
        from: current.status,
        to: toStatus,
      });
    }

    if (isFlow01T2Start) {
      logFlow01Step("FLOW01_T2_STARTED", {
        orderId,
        from: current.status,
        to: toStatus,
      });
    }

    if (isFlow02T1) {
      beginFlow02Pipeline({ orderId, tenantId: ctx.tenantId });
      logFlow02Step("FLOW02_T1_STARTED", {
        orderId,
        from: current.status,
        to: toStatus,
      });
    }

    if (isFlow02T2) {
      logFlow02Step("FLOW02_T2_STARTED", {
        orderId,
        from: current.status,
        to: toStatus,
      });
    }

    if (isFlow02T3) {
      logFlow02Step("FLOW02_T3_STARTED", {
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
      if (isFlow02T1) {
        logFlow02Step("FLOW02_T1_COMPLETED", {
          orderId,
          status: next,
        });
      }
      if (isFlow02T2) {
        logFlow02Step("FLOW02_T2_COMPLETED", {
          orderId,
          status: next,
        });
      }
      if (isFlow02T3) {
        logFlow02Step("FLOW02_T3_COMPLETED", {
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
      } else if (isFlow01T2Start) {
        stopFlow01("T2_FAILED", {
          orderId,
          message: e instanceof Error ? e.message : "transition failed",
        });
      } else if (isFlow02T1) {
        stopFlow02("T1_FAILED", {
          orderId,
          message: e instanceof Error ? e.message : "transition failed",
        });
      } else if (isFlow02T2) {
        stopFlow02("T2_FAILED", {
          orderId,
          message: e instanceof Error ? e.message : "transition failed",
        });
      } else if (isFlow02T3) {
        stopFlow02("T3_FAILED", {
          orderId,
          message: e instanceof Error ? e.message : "transition failed",
        });
      }
      throw e;
    }
  },
};
