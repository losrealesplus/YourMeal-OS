/**
 * DeliveryService — real. Órquesta el intento de entrega y las incidencias.
 * Reutiliza OperationsService (order-level status + audit) y RouteService
 * (marca route_stops.delivered_at cuando corresponde). Auditar cada intento.
 * Capability: logistics.operate  ·  Core Objects: Delivery · DeliveryAttempt · Incident
 */
import type { ServiceContext } from "@/services/types";
import { DomainError } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import { AuditService } from "@/services/audit-service";
import {
  OperationsService,
  type OperationalOrderListItem,
} from "@/modules/operations";
import { RouteService } from "./route-service";

export type DeliveryAttemptOutcome = "delivered" | "issue";

export type DeliveryAttemptInput = {
  orderId: string;
  outcome: DeliveryAttemptOutcome;
  note?: string | null;
};

export const DeliveryService = {
  async listDayDeliveries(
    ctx: ServiceContext,
    deliveryDate: string,
  ): Promise<OperationalOrderListItem[]> {
    requireCapability(ctx.roles, "logistics.operate");
    return OperationsService.listDeliveryOrders(ctx, { deliveryDate });
  },

  async listIncidents(
    ctx: ServiceContext,
    deliveryDate: string,
  ): Promise<OperationalOrderListItem[]> {
    requireCapability(ctx.roles, "logistics.operate");
    const rows = await OperationsService.listDeliveryOrders(ctx, { deliveryDate });
    return rows.filter((r) => r.status === "delivery_issue");
  },

  async recordAttempt(
    ctx: ServiceContext,
    input: DeliveryAttemptInput,
  ): Promise<OperationalOrderListItem> {
    requireCapability(ctx.roles, "logistics.operate");
    if (!input.orderId) throw new DomainError("INVALID_STATE", "orderId required");

    const current = await OperationsService.getOrder(ctx, input.orderId);
    if (!current) throw new DomainError("NOT_FOUND", `Order ${input.orderId}`);

    // Ensure the order is out for delivery before recording a terminal outcome.
    if (current.status === "ready_for_delivery") {
      await OperationsService.transitionDelivery(ctx, input.orderId, "out_for_delivery");
    } else if (
      current.status !== "out_for_delivery" &&
      current.status !== "delivery_issue"
    ) {
      throw new DomainError(
        "INVALID_STATE",
        `Cannot record attempt from status ${current.status}`,
      );
    }

    const target = input.outcome === "delivered" ? "delivered" : "delivery_issue";
    await OperationsService.transitionDelivery(ctx, input.orderId, target);

    // Stamp route_stops.delivered_at on success (silently ignore if no stop).
    if (input.outcome === "delivered") {
      await RouteService.markOrderStopsDelivered(ctx, input.orderId);
    }

    // Attempt-level audit (OperationsService already audits status change).
    await AuditService.write(ctx, {
      entityType: "delivery_attempt",
      entityId: input.orderId,
      action: input.outcome === "delivered" ? "delivered" : "incident",
      newData: {
        outcome: input.outcome,
        note: input.note ?? null,
        from_status: current.status,
      },
    });

    const next = await OperationsService.getOrder(ctx, input.orderId);
    if (!next) throw new DomainError("NOT_FOUND", "Order disappeared");
    return next;
  },
};
