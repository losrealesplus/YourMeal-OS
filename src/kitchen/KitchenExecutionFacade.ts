/**
 * KitchenExecutionFacade — sole public execution API for Kitchen Capability (ADR 0071).
 *
 * First Operational Execution Capability facade.
 * Consumes ProductionFacade only. Never plans. Never mutates Orders. Never touches storage.
 *
 * Execution language: StartExecution · PauseExecution · CompleteExecution · GetExecutionQueue · …
 * LAW 006: answers exactly one question — ¿Qué trabajo debe ejecutarse ahora?
 */

import {
  getProductionFacade,
  type ProductionFacade,
} from "@/production/ProductionFacade";
import type { ProductionBatch } from "@/production/ProductionContext";
import type {
  ExecutionOperator,
  ExecutionProgress,
  ExecutionUnit,
  KitchenCommandResult,
  KitchenContext,
  KitchenResult,
} from "./KitchenContext";
import type {
  AssignOperatorCommand,
  BlockExecutionCommand,
  CompleteExecutionCommand,
  KitchenCommand,
  MarkExecutionReadyCommand,
  PauseExecutionCommand,
  ReassignOperatorCommand,
  ResumeExecutionCommand,
  StartExecutionCommand,
} from "./KitchenCommands";
import type {
  GetBlockedExecutionQuery,
  GetCompletedExecutionQuery,
  GetExecutionProgressQuery,
  GetExecutionQueueQuery,
  GetExecutionUnitsQuery,
  GetOperatorAssignmentsQuery,
  KitchenQuery,
} from "./KitchenQueries";
import type { KitchenRuntimeIdentity } from "./kitchenServiceContext";
import {
  buildKitchenContext,
  failCommand,
  failResult,
  mapProductionError,
  okCommand,
  okResult,
  parseUnitId,
  progressForUnit,
  requireSession,
  unimplementedError,
} from "./mapKitchen";

export type KitchenExecutionFacadeDeps = {
  production: ProductionFacade;
};

const defaultDeps = (): KitchenExecutionFacadeDeps => ({
  production: getProductionFacade(),
});

export class KitchenExecutionFacade {
  private readonly deps: KitchenExecutionFacadeDeps;

  constructor(deps: Partial<KitchenExecutionFacadeDeps> = {}) {
    this.deps = { ...defaultDeps(), ...deps };
  }

  async execute(
    identity: KitchenRuntimeIdentity,
    command: KitchenCommand,
  ): Promise<KitchenCommandResult> {
    switch (command.type) {
      case "StartExecution":
        return this.startExecution(identity, command);
      case "PauseExecution":
        return this.pauseExecution(identity, command);
      case "ResumeExecution":
        return this.resumeExecution(identity, command);
      case "CompleteExecution":
        return this.completeExecution(identity, command);
      case "BlockExecution":
        return this.blockExecution(identity, command);
      case "AssignOperator":
        return this.assignOperator(identity, command);
      case "ReassignOperator":
        return this.reassignOperator(identity, command);
      case "MarkExecutionReady":
        return this.markExecutionReady(identity, command);
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
   * Mark ExecutionUnit ready from Production release.
   * Composes ProductionFacade.markBatchReady — never invents the plan.
   */
  async markExecutionReady(
    identity: KitchenRuntimeIdentity,
    command: MarkExecutionReadyCommand,
  ): Promise<KitchenCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate], command.unitId);

    const parsed = parseUnitId(command.unitId);
    if (!parsed) {
      return failCommand(
        [
          {
            code: "NOT_FOUND",
            message: `Invalid ExecutionUnit id: ${command.unitId}`,
            recoverable: false,
          },
        ],
        command.unitId,
      );
    }

    const dayDate = command.dayDate || parsed.dayDate;
    const marked = await this.deps.production.markBatchReady(identity, {
      type: "MarkBatchReady",
      dayDate,
      dishId: parsed.dishId,
    });

    if (!marked.ok) {
      return failCommand(
        marked.errors.map(mapProductionError),
        command.unitId,
      );
    }

    const tenantId = identity.tenant!.id;
    const batches: ProductionBatch[] =
      marked.context?.queue.batches ??
      (
        await this.deps.production.getProductionPlan(identity, {
          type: "GetProductionPlan",
          dayDate,
        })
      ).context?.queue.batches ??
      [];
    const context = buildKitchenContext(tenantId, dayDate, batches, identity);
    const unit = context.queue.units.find((u) => u.id === command.unitId);
    const status = unit?.status ?? "READY";
    return okCommand({
      unitId: command.unitId,
      status,
      context,
      progress: progressForUnit(
        unit ?? {
          id: command.unitId,
          productionBatchId: command.unitId,
          dayDate,
          dishId: parsed.dishId,
          label: parsed.dishId,
          portionCount: 0,
          status,
        },
      ),
    });
  }

  /**
   * Start execution (READY → IN_PROGRESS).
   * Substrate gap: ProductionFacade exposes release/close, not mid-execution progress.
   */
  async startExecution(
    identity: KitchenRuntimeIdentity,
    command: StartExecutionCommand,
  ): Promise<KitchenCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate], command.unitId);
    return failCommand(
      [
        unimplementedError("StartExecution", {
          dayDate: command.dayDate,
          unitId: command.unitId,
          note: "Compose ProductionFacade only — mid-execution transition pending",
        }),
      ],
      command.unitId,
    );
  }

  async pauseExecution(
    identity: KitchenRuntimeIdentity,
    command: PauseExecutionCommand,
  ): Promise<KitchenCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate], command.unitId);
    return failCommand(
      [unimplementedError("PauseExecution", { unitId: command.unitId })],
      command.unitId,
    );
  }

  async resumeExecution(
    identity: KitchenRuntimeIdentity,
    command: ResumeExecutionCommand,
  ): Promise<KitchenCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate], command.unitId);
    return failCommand(
      [unimplementedError("ResumeExecution", { unitId: command.unitId })],
      command.unitId,
    );
  }

  /**
   * Complete execution. Composes ProductionFacade.closeBatch.
   */
  async completeExecution(
    identity: KitchenRuntimeIdentity,
    command: CompleteExecutionCommand,
  ): Promise<KitchenCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate], command.unitId);

    const parsed = parseUnitId(command.unitId);
    if (!parsed) {
      return failCommand(
        [
          {
            code: "NOT_FOUND",
            message: `Invalid ExecutionUnit id: ${command.unitId}`,
            recoverable: false,
          },
        ],
        command.unitId,
      );
    }

    const dayDate = command.dayDate || parsed.dayDate;
    const closed = await this.deps.production.closeBatch(identity, {
      type: "CloseBatch",
      dayDate,
      dishId: parsed.dishId,
    });

    if (!closed.ok) {
      return failCommand(
        closed.errors.map(mapProductionError),
        command.unitId,
      );
    }

    const tenantId = identity.tenant!.id;
    const batches: ProductionBatch[] =
      closed.context?.queue.batches ??
      (
        await this.deps.production.getProductionPlan(identity, {
          type: "GetProductionPlan",
          dayDate,
        })
      ).context?.queue.batches ??
      [];
    const context = buildKitchenContext(tenantId, dayDate, batches, identity);
    const unit = context.queue.units.find((u) => u.id === command.unitId);
    const status = unit?.status ?? "COMPLETED";
    return okCommand({
      unitId: command.unitId,
      status,
      context,
      progress: progressForUnit(
        unit ?? {
          id: command.unitId,
          productionBatchId: command.unitId,
          dayDate,
          dishId: parsed.dishId,
          label: parsed.dishId,
          portionCount: 0,
          status,
        },
      ),
    });
  }

  async blockExecution(
    identity: KitchenRuntimeIdentity,
    command: BlockExecutionCommand,
  ): Promise<KitchenCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate], command.unitId);
    return failCommand(
      [
        unimplementedError("BlockExecution", {
          unitId: command.unitId,
          reason: command.reason,
        }),
      ],
      command.unitId,
    );
  }

  async assignOperator(
    identity: KitchenRuntimeIdentity,
    command: AssignOperatorCommand,
  ): Promise<KitchenCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate], command.unitId);
    return failCommand(
      [
        unimplementedError("AssignOperator", {
          unitId: command.unitId,
          operatorId: command.operatorId,
        }),
      ],
      command.unitId,
    );
  }

  async reassignOperator(
    identity: KitchenRuntimeIdentity,
    command: ReassignOperatorCommand,
  ): Promise<KitchenCommandResult> {
    const gate = requireSession(identity);
    if (gate) return failCommand([gate], command.unitId);
    return failCommand(
      [
        unimplementedError("ReassignOperator", {
          unitId: command.unitId,
          operatorId: command.operatorId,
        }),
      ],
      command.unitId,
    );
  }

  // ── Queries ───────────────────────────────────────────────────────────

  async query(
    identity: KitchenRuntimeIdentity,
    q: KitchenQuery,
  ): Promise<
    | KitchenResult
    | {
        ok: boolean;
        units: ExecutionUnit[];
        errors: KitchenResult["errors"];
      }
    | {
        ok: boolean;
        progress: ExecutionProgress | null;
        errors: KitchenResult["errors"];
      }
    | {
        ok: boolean;
        operators: ExecutionOperator[];
        errors: KitchenResult["errors"];
      }
  > {
    switch (q.type) {
      case "GetExecutionQueue":
        return this.getExecutionQueue(identity, q);
      case "GetExecutionUnits":
        return this.getExecutionUnits(identity, q);
      case "GetExecutionProgress":
        return this.getExecutionProgress(identity, q);
      case "GetOperatorAssignments":
        return this.getOperatorAssignments(identity, q);
      case "GetBlockedExecution":
        return this.getBlockedExecution(identity, q);
      case "GetCompletedExecution":
        return this.getCompletedExecution(identity, q);
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

  /** Canonical answer to LAW 006: what work must be executed now? */
  async getExecutionQueue(
    identity: KitchenRuntimeIdentity,
    q: GetExecutionQueueQuery,
  ): Promise<KitchenResult> {
    return this.loadContext(identity, q.dayDate);
  }

  async getExecutionUnits(
    identity: KitchenRuntimeIdentity,
    q: GetExecutionUnitsQuery,
  ) {
    const loaded = await this.loadContext(identity, q.dayDate);
    if (!loaded.ok || !loaded.context) {
      return { ok: false, units: [] as ExecutionUnit[], errors: loaded.errors };
    }
    let units = loaded.context.queue.units;
    if (q.status) {
      units = units.filter((u) => u.status === q.status);
    }
    return { ok: true, units, errors: [] };
  }

  async getExecutionProgress(
    identity: KitchenRuntimeIdentity,
    q: GetExecutionProgressQuery,
  ) {
    const loaded = await this.loadContext(identity, q.dayDate);
    if (!loaded.ok || !loaded.context) {
      return { ok: false, progress: null, errors: loaded.errors };
    }
    const unit = loaded.context.queue.units.find((u) => u.id === q.unitId);
    if (!unit) {
      return {
        ok: false,
        progress: null,
        errors: [
          {
            code: "NOT_FOUND" as const,
            message: `ExecutionUnit not found: ${q.unitId}`,
            recoverable: false,
          },
        ],
      };
    }
    return { ok: true, progress: progressForUnit(unit), errors: [] };
  }

  async getOperatorAssignments(
    identity: KitchenRuntimeIdentity,
    q: GetOperatorAssignmentsQuery,
  ) {
    const gate = requireSession(identity);
    if (gate) {
      return { ok: false, operators: [] as ExecutionOperator[], errors: [gate] };
    }
    void q;
    return {
      ok: false,
      operators: [] as ExecutionOperator[],
      errors: [unimplementedError("GetOperatorAssignments")],
    };
  }

  async getBlockedExecution(
    identity: KitchenRuntimeIdentity,
    q: GetBlockedExecutionQuery,
  ) {
    return this.getExecutionUnits(identity, {
      type: "GetExecutionUnits",
      dayDate: q.dayDate,
      status: "BLOCKED",
    });
  }

  async getCompletedExecution(
    identity: KitchenRuntimeIdentity,
    q: GetCompletedExecutionQuery,
  ) {
    return this.getExecutionUnits(identity, {
      type: "GetExecutionUnits",
      dayDate: q.dayDate,
      status: "COMPLETED",
    });
  }

  private async loadContext(
    identity: KitchenRuntimeIdentity,
    dayDate: string,
  ): Promise<KitchenResult> {
    const gate = requireSession(identity);
    if (gate) return failResult([gate]);

    const plan = await this.deps.production.getProductionPlan(identity, {
      type: "GetProductionPlan",
      dayDate,
    });

    if (!plan.ok || !plan.context) {
      return failResult(plan.errors.map(mapProductionError));
    }

    const tenantId = identity.tenant!.id;
    const batches: ProductionBatch[] = plan.context.queue.batches;
    const context = buildKitchenContext(tenantId, dayDate, batches, identity);
    return okResult(context);
  }
}

let singleton: KitchenExecutionFacade | null = null;

export function getKitchenExecutionFacade(): KitchenExecutionFacade {
  if (!singleton) singleton = new KitchenExecutionFacade();
  return singleton;
}

export function resetKitchenExecutionFacade(): void {
  singleton = null;
}
