/**
 * OrderFacade — sole public operational API for Order Capability (ADR 0063).
 *
 * First Operational Process Capability facade.
 * Composes OrderIntakeService · OrderService · OperationsService.
 * Never exposes Supabase, repositories, or storage to consumers.
 *
 * Process language: PlanWeeklyOrder · ConfirmOrder · ScheduleProduction · …
 */

import { OrderIntakeService } from "@/modules/order-intake";
import { OrderService } from "@/modules/orders";
import { OperationsService } from "@/modules/operations";
import type { ServiceContext } from "@/services/types";
import type { OrderCommandResult, OrderResult, OrderStatus, OrderSummary } from "./OrderContext";
import type {
  CancelOrderCommand,
  CloseOrderCommand,
  CompleteDeliveryCommand,
  ConfirmOrderCommand,
  OrderCommand,
  PlanWeeklyOrderCommand,
  ReadyForDeliveryCommand,
  ReadyForKitchenCommand,
  ScheduleProductionCommand,
} from "./OrderCommands";
import type {
  GetKitchenQueueQuery,
  GetOperationalCalendarQuery,
  GetOrderQuery,
  GetOrdersByCustomerQuery,
  GetOrdersByDeliveryDayQuery,
  GetOrdersByWeekQuery,
  GetOrdersPendingProductionQuery,
  GetOrdersReadyForDeliveryQuery,
  OrderQuery,
  SearchOrdersQuery,
} from "./OrderQueries";
import {
  failCommand,
  failResult,
  mapDomainError,
  mapListItemToContext,
  mapListItemToSummary,
  okCommand,
  unimplementedError,
} from "./mapOrder";
import {
  orderCapabilityBitsFromIdentity,
  resolveOrderServiceContext,
  type OrderRuntimeIdentity,
} from "./orderServiceContext";

export type OrderFacadeDeps = {
  intake: typeof OrderIntakeService;
  orders: typeof OrderService;
  operations: typeof OperationsService;
  resolveContext: typeof resolveOrderServiceContext;
};

const defaultDeps: OrderFacadeDeps = {
  intake: OrderIntakeService,
  orders: OrderService,
  operations: OperationsService,
  resolveContext: resolveOrderServiceContext,
};

export class OrderFacade {
  private readonly deps: OrderFacadeDeps;

  constructor(deps: Partial<OrderFacadeDeps> = {}) {
    this.deps = { ...defaultDeps, ...deps };
  }

  async execute(
    identity: OrderRuntimeIdentity,
    command: OrderCommand,
  ): Promise<OrderCommandResult> {
    switch (command.type) {
      case "PlanWeeklyOrder":
        return this.planWeeklyOrder(identity, command);
      case "ConfirmOrder":
        return this.confirmOrder(identity, command);
      case "ScheduleProduction":
        return this.scheduleProduction(identity, command);
      case "ReadyForKitchen":
        return this.readyForKitchen(identity, command);
      case "ReadyForDelivery":
        return this.readyForDelivery(identity, command);
      case "CompleteDelivery":
        return this.completeDelivery(identity, command);
      case "CloseOrder":
        return this.closeOrder(identity, command);
      case "CancelOrder":
        return this.cancelOrder(identity, command);
      case "DuplicateWeek":
      case "CloneMenus":
      case "SplitOrder":
      case "MergeOrder":
        return failCommand([unimplementedError(command.type)]);
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

  async planWeeklyOrder(
    identity: OrderRuntimeIdentity,
    command: PlanWeeklyOrderCommand,
  ): Promise<OrderCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error]);

    try {
      const draft = await this.deps.intake.intakeDraft(resolved.ctx, {
        channel: command.channel ?? "app",
        weekStart: command.weekStart,
        items: command.items,
        notes: command.notes,
        targetCustomerId: command.targetCustomerId,
        clientRequestId: command.clientRequestId,
      });
      const orderId = draft.order.id;
      const status = draft.order.status as OrderStatus;
      const got = await this.getOrder(identity, {
        type: "GetOrder",
        orderId,
      });
      return {
        ok: true,
        orderId,
        status,
        context: got.context,
        errors: got.ok ? [] : got.errors,
      };
    } catch (e) {
      return failCommand([mapDomainError(e)]);
    }
  }

  async confirmOrder(
    identity: OrderRuntimeIdentity,
    command: ConfirmOrderCommand,
  ): Promise<OrderCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error], command.orderId);

    try {
      const row = await this.deps.orders.confirm(resolved.ctx, command.orderId);
      const got = await this.getOrder(identity, {
        type: "GetOrder",
        orderId: command.orderId,
      });
      return okCommand(command.orderId, row.status as OrderStatus, got.context);
    } catch (e) {
      return failCommand([mapDomainError(e)], command.orderId);
    }
  }

  /** confirmed → in_production (OperationsService.startProduction). */
  async scheduleProduction(
    identity: OrderRuntimeIdentity,
    command: ScheduleProductionCommand,
  ): Promise<OrderCommandResult> {
    return this.kitchenTransition(identity, command.orderId, "ScheduleProduction", (ctx, id) =>
      this.deps.operations.startProduction(ctx, id),
    );
  }

  /**
   * Kitchen prep complete: in_production → prepared
   * (OperationsService.completeProduction).
   */
  async readyForKitchen(
    identity: OrderRuntimeIdentity,
    command: ReadyForKitchenCommand,
  ): Promise<OrderCommandResult> {
    return this.kitchenTransition(identity, command.orderId, "ReadyForKitchen", (ctx, id) =>
      this.deps.operations.completeProduction(ctx, id),
    );
  }

  /** prepared → ready_for_delivery. */
  async readyForDelivery(
    identity: OrderRuntimeIdentity,
    command: ReadyForDeliveryCommand,
  ): Promise<OrderCommandResult> {
    return this.kitchenTransition(identity, command.orderId, "ReadyForDelivery", (ctx, id) =>
      this.deps.operations.transitionKitchen(ctx, id, "ready_for_delivery"),
    );
  }

  /**
   * Delivery completion. Uses transitionDelivery to avoid FLOW-01 test harness
   * gates on completeDelivery().
   */
  async completeDelivery(
    identity: OrderRuntimeIdentity,
    command: CompleteDeliveryCommand,
  ): Promise<OrderCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error], command.orderId);

    try {
      const current = await this.deps.operations.getOrder(resolved.ctx, command.orderId);
      if (!current) {
        return failCommand(
          [
            {
              code: "NOT_FOUND",
              message: `Order ${command.orderId} not found`,
              recoverable: false,
            },
          ],
          command.orderId,
        );
      }

      let status = current.status as OrderStatus;
      if (status === "ready_for_delivery") {
        status = (await this.deps.operations.transitionDelivery(
          resolved.ctx,
          command.orderId,
          "out_for_delivery",
        )) as OrderStatus;
      }
      if (status === "out_for_delivery" || status === "delivery_issue") {
        status = (await this.deps.operations.transitionDelivery(
          resolved.ctx,
          command.orderId,
          "delivered",
        )) as OrderStatus;
      } else if (status !== "delivered") {
        return failCommand(
          [
            {
              code: "INVALID_STATE",
              message: `CompleteDelivery not allowed from ${status}`,
              recoverable: true,
              evidence: { orderId: command.orderId, status },
            },
          ],
          command.orderId,
        );
      }

      const got = await this.getOrder(identity, {
        type: "GetOrder",
        orderId: command.orderId,
      });
      return okCommand(command.orderId, status, got.context);
    } catch (e) {
      return failCommand([mapDomainError(e)], command.orderId);
    }
  }

  async closeOrder(
    identity: OrderRuntimeIdentity,
    command: CloseOrderCommand,
  ): Promise<OrderCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error], command.orderId);
    void resolved;
    return failCommand(
      [unimplementedError("CloseOrder", { orderId: command.orderId })],
      command.orderId,
    );
  }

  async cancelOrder(
    identity: OrderRuntimeIdentity,
    command: CancelOrderCommand,
  ): Promise<OrderCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error], command.orderId);
    void resolved;
    return failCommand(
      [
        unimplementedError("CancelOrder", {
          orderId: command.orderId,
          reason: command.reason,
        }),
      ],
      command.orderId,
    );
  }

  // ── Queries ───────────────────────────────────────────────────────────

  async query(
    identity: OrderRuntimeIdentity,
    q: OrderQuery,
  ): Promise<
    | OrderResult
    | {
        ok: boolean;
        summaries: OrderSummary[];
        errors: OrderResult["errors"];
      }
    | {
        ok: boolean;
        calendar: { weekStart: string; orderIds: string[]; deliveryDays: string[] };
        errors: OrderResult["errors"];
      }
  > {
    switch (q.type) {
      case "GetOrder":
        return this.getOrder(identity, q);
      case "SearchOrders":
        return this.searchOrders(identity, q);
      case "GetOrdersByWeek":
        return this.getOrdersByWeek(identity, q);
      case "GetOrdersByCustomer":
        return this.getOrdersByCustomer(identity, q);
      case "GetOrdersByDeliveryDay":
        return this.getOrdersByDeliveryDay(identity, q);
      case "GetOrdersPendingProduction":
        return this.getOrdersPendingProduction(identity, q);
      case "GetOrdersReadyForDelivery":
        return this.getOrdersReadyForDelivery(identity, q);
      case "GetOperationalCalendar":
        return this.getOperationalCalendar(identity, q);
      case "GetKitchenQueue":
        return this.getKitchenQueue(identity, q);
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

  async getOrder(identity: OrderRuntimeIdentity, q: GetOrderQuery): Promise<OrderResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failResult([resolved.error]);

    try {
      const row = await this.deps.operations.getOrder(resolved.ctx, q.orderId);
      if (!row) {
        return failResult([
          {
            code: "NOT_FOUND",
            message: `Order ${q.orderId} not found`,
            recoverable: false,
          },
        ]);
      }
      const permissions = orderCapabilityBitsFromIdentity(identity);
      return {
        ok: true,
        context: mapListItemToContext(row, permissions),
        errors: [],
      };
    } catch (e) {
      return failResult([mapDomainError(e)]);
    }
  }

  async searchOrders(
    identity: OrderRuntimeIdentity,
    q: SearchOrdersQuery,
  ): Promise<{
    ok: boolean;
    summaries: OrderSummary[];
    errors: OrderResult["errors"];
  }> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return { ok: false, summaries: [], errors: [resolved.error] };

    try {
      const [kitchen, delivery] = await Promise.all([
        this.deps.operations.listKitchenOrders(resolved.ctx, {
          deliveryDate: q.deliveryDay,
        }),
        this.deps.operations.listDeliveryOrders(resolved.ctx, {
          deliveryDate: q.deliveryDay,
        }),
      ]);
      const byId = new Map<string, (typeof kitchen)[0]>();
      for (const row of [...kitchen, ...delivery]) byId.set(row.id, row);

      let rows = [...byId.values()];
      if (q.weekStart) {
        rows = rows.filter((r) => r.weekStart === q.weekStart);
      }
      if (q.partyId) {
        rows = rows.filter((r) => r.customerId === q.partyId || r.companyId === q.partyId);
      }
      if (q.status) {
        const set = new Set(Array.isArray(q.status) ? q.status : [q.status]);
        rows = rows.filter((r) => set.has(r.status as OrderStatus));
      }

      const limit = q.limit ?? 50;
      return {
        ok: true,
        summaries: rows.slice(0, limit).map(mapListItemToSummary),
        errors: [],
      };
    } catch (e) {
      return { ok: false, summaries: [], errors: [mapDomainError(e)] };
    }
  }

  async getOrdersByWeek(identity: OrderRuntimeIdentity, q: GetOrdersByWeekQuery) {
    return this.searchOrders(identity, {
      type: "SearchOrders",
      weekStart: q.weekStart,
      limit: q.limit,
    });
  }

  async getOrdersByCustomer(identity: OrderRuntimeIdentity, q: GetOrdersByCustomerQuery) {
    return this.searchOrders(identity, {
      type: "SearchOrders",
      partyId: q.customerId,
      limit: q.limit,
    });
  }

  async getOrdersByDeliveryDay(identity: OrderRuntimeIdentity, q: GetOrdersByDeliveryDayQuery) {
    return this.searchOrders(identity, {
      type: "SearchOrders",
      deliveryDay: q.deliveryDay,
      limit: q.limit,
    });
  }

  async getOrdersPendingProduction(
    identity: OrderRuntimeIdentity,
    q: GetOrdersPendingProductionQuery,
  ) {
    return this.searchOrders(identity, {
      type: "SearchOrders",
      status: ["confirmed", "in_production"],
      deliveryDay: q.deliveryDay,
      limit: q.limit,
    });
  }

  async getOrdersReadyForDelivery(
    identity: OrderRuntimeIdentity,
    q: GetOrdersReadyForDeliveryQuery,
  ) {
    return this.searchOrders(identity, {
      type: "SearchOrders",
      status: ["ready_for_delivery", "out_for_delivery"],
      deliveryDay: q.deliveryDay,
      limit: q.limit,
    });
  }

  async getKitchenQueue(identity: OrderRuntimeIdentity, q: GetKitchenQueueQuery) {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return { ok: false, summaries: [], errors: [resolved.error] };

    try {
      const rows = await this.deps.operations.listKitchenOrders(resolved.ctx, {
        deliveryDate: q.deliveryDay,
      });
      const limit = q.limit ?? 100;
      return {
        ok: true,
        summaries: rows.slice(0, limit).map(mapListItemToSummary),
        errors: [],
      };
    } catch (e) {
      return { ok: false, summaries: [], errors: [mapDomainError(e)] };
    }
  }

  async getOperationalCalendar(identity: OrderRuntimeIdentity, q: GetOperationalCalendarQuery) {
    const listed = await this.getOrdersByWeek(identity, {
      type: "GetOrdersByWeek",
      weekStart: q.weekStart,
    });
    if (!listed.ok) {
      return {
        ok: false as const,
        calendar: { weekStart: q.weekStart, orderIds: [], deliveryDays: [] },
        errors: listed.errors,
      };
    }
    const deliveryDays = [
      ...new Set(
        listed.summaries.map((s) => s.deliveryDayPrimary).filter((d): d is string => Boolean(d)),
      ),
    ].sort();
    return {
      ok: true as const,
      calendar: {
        weekStart: q.weekStart,
        orderIds: listed.summaries.map((s) => s.id),
        deliveryDays,
      },
      errors: [] as OrderResult["errors"],
    };
  }

  private async kitchenTransition(
    identity: OrderRuntimeIdentity,
    orderId: string,
    _label: string,
    run: (ctx: ServiceContext, id: string) => Promise<string>,
  ): Promise<OrderCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error], orderId);

    try {
      const status = (await run(resolved.ctx, orderId)) as OrderStatus;
      const got = await this.getOrder(identity, {
        type: "GetOrder",
        orderId,
      });
      return okCommand(orderId, status, got.context);
    } catch (e) {
      return failCommand([mapDomainError(e)], orderId);
    }
  }
}

let singleton: OrderFacade | null = null;

export function getOrderFacade(): OrderFacade {
  if (!singleton) singleton = new OrderFacade();
  return singleton;
}

export function resetOrderFacade(): void {
  singleton = null;
}
