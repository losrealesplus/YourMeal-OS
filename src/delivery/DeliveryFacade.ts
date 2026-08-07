/**
 * DeliveryFacade — sole public fulfillment API for Delivery Capability (ADR 0079).
 *
 * Second Operational Execution Capability facade.
 * Consumes OrderFacade (commitment / delivery transitions) and KitchenExecutionFacade
 * (releasable execution facts). Never drives. Never cooks. Never bills. Never touches storage.
 *
 * LAW 006: answers exactly one question —
 * ¿Qué compromisos operativos deben entregarse ahora y cómo confirmamos su ejecución?
 */

import {
  getOrderFacade,
  type OrderFacade,
} from "@/order/OrderFacade";
import {
  getKitchenExecutionFacade,
  type KitchenExecutionFacade,
} from "@/kitchen/KitchenExecutionFacade";
import type {
  DeliveryCommandResult,
  DeliveryConfirmation,
  DeliveryContext,
  DeliveryResult,
} from "./DeliveryContext";
import type {
  AssignDeliveryCommand,
  CloseDeliveryCommand,
  ConfirmDeliveryCommand,
  DeliveryCommand,
  ReportDeliveryExceptionCommand,
  StartDeliveryCommand,
} from "./DeliveryCommands";
import type {
  DeliveryQuery,
  GetCompletedDeliveriesQuery,
  GetDeliveryAssignmentsQuery,
  GetDeliveryContextQuery,
  GetDeliveryRoutesQuery,
  GetDeliveryStopsQuery,
} from "./DeliveryQueries";
import type { DeliveryRuntimeIdentity } from "./deliveryServiceContext";
import {
  assignmentIdForCommitment,
  buildDeliveryContext,
  commitmentRefFromAssignmentId,
  failCommand,
  failResult,
  mapOrderError,
  mapOrderStatusToDelivery,
  okCommand,
  okResult,
  requireSession,
  unimplementedError,
} from "./mapDelivery";

export type DeliveryFacadeDeps = {
  orders: OrderFacade;
  kitchen: KitchenExecutionFacade;
};

const defaultDeps = (): DeliveryFacadeDeps => ({
  orders: getOrderFacade(),
  kitchen: getKitchenExecutionFacade(),
});

export class DeliveryFacade {
  private readonly deps: DeliveryFacadeDeps;

  constructor(deps: Partial<DeliveryFacadeDeps> = {}) {
    this.deps = { ...defaultDeps(), ...deps };
  }

  async execute(
    identity: DeliveryRuntimeIdentity,
    command: DeliveryCommand,
  ): Promise<DeliveryCommandResult> {
    switch (command.type) {
      case "AssignDelivery":
        return this.assignDelivery(identity, command);
      case "StartDelivery":
        return this.startDelivery(identity, command);
      case "ConfirmDelivery":
        return this.confirmDelivery(identity, command);
      case "ReportDeliveryException":
        return this.reportDeliveryException(identity, command);
      case "CloseDelivery":
        return this.closeDelivery(identity, command);
      default: {
        const _exhaustive: never = command;
        return failCommand([
          {
            code: "UNKNOWN",
            message: `Unknown command: ${String(_exhaustive)}`,
            recoverable: false,
          },
        ]);
      }
    }
  }

  /**
   * Bind commitment to actor/window — no assignment substrate on OrderFacade yet.
   */
  async assignDelivery(
    identity: DeliveryRuntimeIdentity,
    command: AssignDeliveryCommand,
  ): Promise<DeliveryCommandResult> {
    const gate = requireSession(identity);
    if (gate) {
      return failCommand(
        [gate],
        assignmentIdForCommitment(command.commitmentRef),
      );
    }
    return failCommand(
      [
        unimplementedError("AssignDelivery", {
          commitmentRef: command.commitmentRef,
          actorId: command.actorId ?? null,
        }),
      ],
      assignmentIdForCommitment(command.commitmentRef),
    );
  }

  /**
   * Planned/Assigned → InTransit. OrderFacade exposes completeDelivery as a
   * combined transition; partial out_for_delivery-only is a visible compose gap.
   */
  async startDelivery(
    identity: DeliveryRuntimeIdentity,
    command: StartDeliveryCommand,
  ): Promise<DeliveryCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate], command.assignmentId);
    return failCommand(
      [unimplementedError("StartDelivery", { assignmentId: command.assignmentId })],
      command.assignmentId,
    );
  }

  /**
   * Confirm fulfillment — composes OrderFacade.completeDelivery
   * (ready_for_delivery → out_for_delivery → delivered).
   */
  async confirmDelivery(
    identity: DeliveryRuntimeIdentity,
    command: ConfirmDeliveryCommand,
  ): Promise<DeliveryCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate], command.assignmentId);

    const orderId = commitmentRefFromAssignmentId(command.assignmentId);
    if (!orderId) {
      return failCommand(
        [
          {
            code: "NOT_FOUND",
            message: `Invalid assignment id: ${command.assignmentId}`,
            recoverable: false,
          },
        ],
        command.assignmentId,
      );
    }

    const completed = await this.deps.orders.completeDelivery(identity, {
      type: "CompleteDelivery",
      orderId,
    });

    if (!completed.ok) {
      return failCommand(
        completed.errors.map(mapOrderError),
        command.assignmentId,
      );
    }

    const ctxResult = await this.loadContext(identity, command.operationalDay);
    if (!ctxResult.ok || !ctxResult.context) {
      return failCommand(ctxResult.errors, command.assignmentId);
    }

    const status = mapOrderStatusToDelivery(
      (completed.status as import("@/order/OrderContext").OrderStatus) ??
        "delivered",
    );
    const confirmation: DeliveryConfirmation = {
      id: `confirmation:${orderId}`,
      tenantId: identity.tenant!.id,
      assignmentId: command.assignmentId,
      stopId: `stop:${orderId}`,
      confirmedAt: new Date().toISOString(),
      confirmedBy: identity.session.userId!,
      outcome: "success",
      note: command.note ?? null,
    };

    return okCommand({
      assignmentId: command.assignmentId,
      status,
      confirmation,
      context: ctxResult.context,
    });
  }

  async reportDeliveryException(
    identity: DeliveryRuntimeIdentity,
    command: ReportDeliveryExceptionCommand,
  ): Promise<DeliveryCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate], command.assignmentId);
    return failCommand(
      [
        unimplementedError("ReportDeliveryException", {
          assignmentId: command.assignmentId,
          code: command.code,
        }),
      ],
      command.assignmentId,
    );
  }

  async closeDelivery(
    identity: DeliveryRuntimeIdentity,
    command: CloseDeliveryCommand,
  ): Promise<DeliveryCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate], command.assignmentId);
    return failCommand(
      [unimplementedError("CloseDelivery", { assignmentId: command.assignmentId })],
      command.assignmentId,
    );
  }

  async query(
    identity: DeliveryRuntimeIdentity,
    q: DeliveryQuery,
  ): Promise<DeliveryResult> {
    switch (q.type) {
      case "GetDeliveryContext":
        return this.getDeliveryContext(identity, q);
      case "GetDeliveryAssignments":
        return this.getDeliveryAssignments(identity, q);
      case "GetDeliveryRoutes":
        return this.getDeliveryRoutes(identity, q);
      case "GetDeliveryStops":
        return this.getDeliveryStops(identity, q);
      case "GetCompletedDeliveries":
        return this.getCompletedDeliveries(identity, q);
      default: {
        const _exhaustive: never = q;
        return failResult([
          {
            code: "UNKNOWN",
            message: `Unknown query: ${String(_exhaustive)}`,
            recoverable: false,
          },
        ]);
      }
    }
  }

  async getDeliveryContext(
    identity: DeliveryRuntimeIdentity,
    q: GetDeliveryContextQuery,
  ): Promise<DeliveryResult> {
    return this.loadContext(identity, q.operationalDay);
  }

  async getDeliveryAssignments(
    identity: DeliveryRuntimeIdentity,
    q: GetDeliveryAssignmentsQuery,
  ): Promise<DeliveryResult> {
    const loaded = await this.loadContext(identity, q.operationalDay);
    if (!loaded.ok || !loaded.context) return loaded;
    if (!q.status) return loaded;
    const filtered = {
      ...loaded.context,
      assignments: loaded.context.assignments.filter((a) => a.status === q.status),
    };
    return okResult(filtered);
  }

  /**
   * Route planning substrate not yet exposed — visible UNIMPLEMENTED gap.
   */
  async getDeliveryRoutes(
    identity: DeliveryRuntimeIdentity,
    q: GetDeliveryRoutesQuery,
  ): Promise<DeliveryResult> {
    const gate = requireSession(identity);
    if (gate) return failResult([gate]);
    void q;
    return failResult([unimplementedError("GetDeliveryRoutes")]);
  }

  async getDeliveryStops(
    identity: DeliveryRuntimeIdentity,
    q: GetDeliveryStopsQuery,
  ): Promise<DeliveryResult> {
    return this.loadContext(identity, q.operationalDay);
  }

  async getCompletedDeliveries(
    identity: DeliveryRuntimeIdentity,
    q: GetCompletedDeliveriesQuery,
  ): Promise<DeliveryResult> {
    const gate = requireSession(identity);
    if (gate) return failResult([gate]);

    const searched = await this.deps.orders.searchOrders(identity, {
      type: "SearchOrders",
      status: ["delivered"],
      deliveryDay: q.operationalDay,
      limit: 100,
    });

    if (!searched.ok) {
      return failResult(searched.errors.map(mapOrderError));
    }

    const tenantId = identity.tenant!.id;
    const context = buildDeliveryContext(
      tenantId,
      q.operationalDay,
      searched.summaries,
      identity,
    );
    // Touch Kitchen so the Execution dependency stays exercised (no inventing).
    await this.deps.kitchen.getCompletedExecution(identity, {
      type: "GetCompletedExecution",
      dayDate: q.operationalDay,
    });
    return okResult(context);
  }

  private async loadContext(
    identity: DeliveryRuntimeIdentity,
    operationalDay: string,
  ): Promise<DeliveryResult> {
    const gate = requireSession(identity);
    if (gate) return failResult([gate]);

    const ready = await this.deps.orders.getOrdersReadyForDelivery(identity, {
      type: "GetOrdersReadyForDelivery",
      deliveryDay: operationalDay,
      limit: 100,
    });

    if (!ready.ok) {
      return failResult(ready.errors.map(mapOrderError));
    }

    const tenantId = identity.tenant!.id;
    const context: DeliveryContext = buildDeliveryContext(
      tenantId,
      operationalDay,
      ready.summaries,
      identity,
    );
    return okResult(context);
  }
}

let singleton: DeliveryFacade | null = null;

export function getDeliveryFacade(): DeliveryFacade {
  if (!singleton) singleton = new DeliveryFacade();
  return singleton;
}

export function resetDeliveryFacade(): void {
  singleton = null;
}
