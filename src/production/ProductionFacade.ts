/**
 * ProductionFacade — sole public planning API for Production Capability (ADR 0067).
 *
 * First Operational Execution Capability facade.
 * Composes ProductionReportService · KitchenExecutionService · OrderFacade (calendar).
 * Never exposes Supabase, repositories, or storage to consumers.
 *
 * Work language: GenerateProductionPlan · RecalculateLoad · MarkBatchReady · …
 * Production never manipulates Orders directly — it manipulates Work.
 */

import { ProductionReportService } from "@/modules/operations";
import { KitchenExecutionService } from "@/modules/operations";
import { getOrderFacade, type OrderFacade } from "@/order/OrderFacade";
import type {
  ProductionBatch,
  ProductionCommandResult,
  ProductionLoad,
  ProductionResult,
} from "./ProductionContext";
import type {
  AssignBatchCommand,
  CloseBatchCommand,
  GenerateProductionBatchCommand,
  GenerateProductionPlanCommand,
  MarkBatchReadyCommand,
  ProductionCommand,
  RecalculateLoadCommand,
  RescheduleBatchCommand,
} from "./ProductionCommands";
import type {
  GetOpenBatchesQuery,
  GetProductionCalendarQuery,
  GetProductionCapacityQuery,
  GetProductionLoadQuery,
  GetProductionPlanQuery,
  GetProductionQueueQuery,
  GetReadyBatchesQuery,
  ProductionQuery,
} from "./ProductionQueries";
import {
  batchIdFor,
  failCommand,
  failResult,
  mapDomainError,
  mapKitchenStatus,
  mapReportToContext,
  mapReportToLoad,
  okCommand,
  planIdForDay,
  unimplementedError,
} from "./mapProduction";
import {
  productionCapabilityBitsFromIdentity,
  resolveProductionServiceContext,
  type ProductionRuntimeIdentity,
} from "./productionServiceContext";

export type ProductionFacadeDeps = {
  reports: typeof ProductionReportService;
  kitchen: typeof KitchenExecutionService;
  orders: OrderFacade;
  resolveContext: typeof resolveProductionServiceContext;
};

const defaultDeps = (): ProductionFacadeDeps => ({
  reports: ProductionReportService,
  kitchen: KitchenExecutionService,
  orders: getOrderFacade(),
  resolveContext: resolveProductionServiceContext,
});

export class ProductionFacade {
  private readonly deps: ProductionFacadeDeps;

  constructor(deps: Partial<ProductionFacadeDeps> = {}) {
    this.deps = { ...defaultDeps(), ...deps };
  }

  async execute(
    identity: ProductionRuntimeIdentity,
    command: ProductionCommand,
  ): Promise<ProductionCommandResult> {
    switch (command.type) {
      case "GenerateProductionPlan":
        return this.generateProductionPlan(identity, command);
      case "GenerateProductionBatch":
        return this.generateProductionBatch(identity, command);
      case "RecalculateLoad":
        return this.recalculateLoad(identity, command);
      case "AssignBatch":
        return this.assignBatch(identity, command);
      case "RescheduleBatch":
        return this.rescheduleBatch(identity, command);
      case "MarkBatchReady":
        return this.markBatchReady(identity, command);
      case "CloseBatch":
        return this.closeBatch(identity, command);
      case "OptimizePlan":
      case "BalanceWorkload":
      case "GenerateKitchenQueue":
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

  /**
   * Build the day's production plan from operational commitments (via report compose).
   * Returns Work (batches · load) — not an Order list.
   */
  async generateProductionPlan(
    identity: ProductionRuntimeIdentity,
    command: GenerateProductionPlanCommand,
  ): Promise<ProductionCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error]);

    try {
      const report = await this.deps.reports.buildForDay(resolved.ctx, {
        deliveryDate: command.dayDate,
        companyId: command.companyId,
        siteId: command.siteId,
        deliveryGroupId: command.deliveryGroupId,
      });
      const permissions = productionCapabilityBitsFromIdentity(identity);
      const context = mapReportToContext(
        report,
        resolved.ctx.tenantId,
        permissions,
      );
      return okCommand({
        planId: context.summary.id,
        status: context.summary.status,
        context,
        load: context.summary.load,
      });
    } catch (e) {
      return failCommand([mapDomainError(e)]);
    }
  }

  async generateProductionBatch(
    identity: ProductionRuntimeIdentity,
    command: GenerateProductionBatchCommand,
  ): Promise<ProductionCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error]);
    void resolved;
    return failCommand(
      [
        unimplementedError("GenerateProductionBatch", {
          dayDate: command.dayDate,
          dishId: command.dishId,
        }),
      ],
      planIdForDay(command.dayDate),
      batchIdFor(command.dayDate, command.dishId),
    );
  }

  /** Re-derive load from current day board (compose report). */
  async recalculateLoad(
    identity: ProductionRuntimeIdentity,
    command: RecalculateLoadCommand,
  ): Promise<ProductionCommandResult> {
    const plan = await this.generateProductionPlan(identity, {
      type: "GenerateProductionPlan",
      dayDate: command.dayDate,
    });
    if (!plan.ok) return plan;
    return okCommand({
      planId: plan.planId,
      status: plan.status,
      context: plan.context,
      load: plan.load,
    });
  }

  async assignBatch(
    identity: ProductionRuntimeIdentity,
    command: AssignBatchCommand,
  ): Promise<ProductionCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error]);
    void resolved;
    return failCommand(
      [
        unimplementedError("AssignBatch", {
          dayDate: command.dayDate,
          dishId: command.dishId,
          station: command.station,
        }),
      ],
      planIdForDay(command.dayDate),
      batchIdFor(command.dayDate, command.dishId),
    );
  }

  async rescheduleBatch(
    identity: ProductionRuntimeIdentity,
    command: RescheduleBatchCommand,
  ): Promise<ProductionCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) return failCommand([resolved.error]);
    void resolved;
    return failCommand(
      [
        unimplementedError("RescheduleBatch", {
          dayDate: command.dayDate,
          targetDayDate: command.targetDayDate,
          dishId: command.dishId,
        }),
      ],
      planIdForDay(command.dayDate),
      batchIdFor(command.dayDate, command.dishId),
    );
  }

  /**
   * Release batch for kitchen work.
   * Composes KitchenExecutionService.transitionBatch → preparing.
   */
  async markBatchReady(
    identity: ProductionRuntimeIdentity,
    command: MarkBatchReadyCommand,
  ): Promise<ProductionCommandResult> {
    return this.batchTransition(identity, command.dayDate, command.dishId, "preparing");
  }

  /**
   * Close batch work unit.
   * Composes KitchenExecutionService.transitionBatch → finished.
   */
  async closeBatch(
    identity: ProductionRuntimeIdentity,
    command: CloseBatchCommand,
  ): Promise<ProductionCommandResult> {
    return this.batchTransition(identity, command.dayDate, command.dishId, "finished");
  }

  // ── Queries ───────────────────────────────────────────────────────────

  async query(
    identity: ProductionRuntimeIdentity,
    q: ProductionQuery,
  ): Promise<
    | ProductionResult
    | { ok: boolean; load: ProductionLoad | null; errors: ProductionResult["errors"] }
    | {
        ok: boolean;
        batches: ProductionBatch[];
        errors: ProductionResult["errors"];
      }
    | {
        ok: boolean;
        capacity: null;
        errors: ProductionResult["errors"];
      }
    | {
        ok: boolean;
        calendar: {
          weekStart: string;
          dayDates: string[];
          planIds: string[];
        };
        errors: ProductionResult["errors"];
      }
  > {
    switch (q.type) {
      case "GetProductionPlan":
        return this.getProductionPlan(identity, q);
      case "GetProductionQueue":
        return this.getProductionQueue(identity, q);
      case "GetProductionLoad":
        return this.getProductionLoad(identity, q);
      case "GetProductionCapacity":
        return this.getProductionCapacity(identity, q);
      case "GetOpenBatches":
        return this.getOpenBatches(identity, q);
      case "GetReadyBatches":
        return this.getReadyBatches(identity, q);
      case "GetProductionCalendar":
        return this.getProductionCalendar(identity, q);
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

  async getProductionPlan(
    identity: ProductionRuntimeIdentity,
    q: GetProductionPlanQuery,
  ): Promise<ProductionResult> {
    const generated = await this.generateProductionPlan(identity, {
      type: "GenerateProductionPlan",
      dayDate: q.dayDate,
      companyId: q.companyId,
      siteId: q.siteId,
      deliveryGroupId: q.deliveryGroupId,
    });
    if (!generated.ok) return failResult(generated.errors);
    return { ok: true, context: generated.context, errors: [] };
  }

  async getProductionQueue(
    identity: ProductionRuntimeIdentity,
    q: GetProductionQueueQuery,
  ): Promise<ProductionResult> {
    return this.getProductionPlan(identity, {
      type: "GetProductionPlan",
      dayDate: q.dayDate,
    });
  }

  async getProductionLoad(
    identity: ProductionRuntimeIdentity,
    q: GetProductionLoadQuery,
  ): Promise<{
    ok: boolean;
    load: ProductionLoad | null;
    errors: ProductionResult["errors"];
  }> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) {
      return { ok: false, load: null, errors: [resolved.error] };
    }
    try {
      const report = await this.deps.reports.buildForDay(resolved.ctx, {
        deliveryDate: q.dayDate,
      });
      return { ok: true, load: mapReportToLoad(report), errors: [] };
    } catch (e) {
      return { ok: false, load: null, errors: [mapDomainError(e)] };
    }
  }

  async getProductionCapacity(
    identity: ProductionRuntimeIdentity,
    q: GetProductionCapacityQuery,
  ) {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) {
      return { ok: false as const, capacity: null, errors: [resolved.error] };
    }
    void q;
    void resolved;
    return {
      ok: false as const,
      capacity: null,
      errors: [unimplementedError("GetProductionCapacity")],
    };
  }

  async getOpenBatches(
    identity: ProductionRuntimeIdentity,
    q: GetOpenBatchesQuery,
  ) {
    const plan = await this.getProductionPlan(identity, {
      type: "GetProductionPlan",
      dayDate: q.dayDate,
    });
    if (!plan.ok || !plan.context) {
      return { ok: false, batches: [] as ProductionBatch[], errors: plan.errors };
    }
    const batches = plan.context.queue.batches.filter((b) => b.status !== "done");
    return { ok: true, batches, errors: [] };
  }

  async getReadyBatches(
    identity: ProductionRuntimeIdentity,
    q: GetReadyBatchesQuery,
  ) {
    const plan = await this.getProductionPlan(identity, {
      type: "GetProductionPlan",
      dayDate: q.dayDate,
    });
    if (!plan.ok || !plan.context) {
      return { ok: false, batches: [] as ProductionBatch[], errors: plan.errors };
    }
    const batches = plan.context.queue.batches.filter(
      (b) => b.status === "released" || b.status === "in_progress",
    );
    return { ok: true, batches, errors: [] };
  }

  /**
   * Calendar of operational days with work — via OrderFacade commitments
   * (Production does not own Order storage).
   */
  async getProductionCalendar(
    identity: ProductionRuntimeIdentity,
    q: GetProductionCalendarQuery,
  ) {
    const calendar = await this.deps.orders.getOperationalCalendar(identity, {
      type: "GetOperationalCalendar",
      weekStart: q.weekStart,
    });
    if (!calendar.ok) {
      return {
        ok: false as const,
        calendar: {
          weekStart: q.weekStart,
          dayDates: [] as string[],
          planIds: [] as string[],
        },
        errors: calendar.errors.map((e) => ({
          code:
            e.code === "PERMISSION_DENIED" ||
            e.code === "TENANT_MISMATCH" ||
            e.code === "NOT_FOUND" ||
            e.code === "UNIMPLEMENTED"
              ? e.code
              : ("UNKNOWN" as const),
          message: e.message,
          recoverable: e.recoverable,
          evidence: e.evidence,
        })),
      };
    }
    const dayDates = calendar.calendar.deliveryDays;
    return {
      ok: true as const,
      calendar: {
        weekStart: q.weekStart,
        dayDates,
        planIds: dayDates.map(planIdForDay),
      },
      errors: [] as ProductionResult["errors"],
    };
  }

  private async batchTransition(
    identity: ProductionRuntimeIdentity,
    dayDate: string,
    dishId: string,
    toStatus: "preparing" | "finished",
  ): Promise<ProductionCommandResult> {
    const resolved = await this.deps.resolveContext(identity);
    if (!resolved.ok) {
      return failCommand(
        [resolved.error],
        planIdForDay(dayDate),
        batchIdFor(dayDate, dishId),
      );
    }

    try {
      const kitchenStatus = await this.deps.kitchen.transitionBatch(
        resolved.ctx,
        { deliveryDate: dayDate, dishId, toStatus },
      );
      const refreshed = await this.generateProductionPlan(identity, {
        type: "GenerateProductionPlan",
        dayDate,
      });
      return okCommand({
        planId: planIdForDay(dayDate),
        batchId: batchIdFor(dayDate, dishId),
        status: mapKitchenStatus(kitchenStatus),
        context: refreshed.context,
        load: refreshed.load,
      });
    } catch (e) {
      return failCommand(
        [mapDomainError(e)],
        planIdForDay(dayDate),
        batchIdFor(dayDate, dishId),
      );
    }
  }
}

let singleton: ProductionFacade | null = null;

export function getProductionFacade(): ProductionFacade {
  if (!singleton) singleton = new ProductionFacade();
  return singleton;
}

export function resetProductionFacade(): void {
  singleton = null;
}
