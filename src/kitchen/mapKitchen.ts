/**
 * INTERNAL — map Production planning facts → Kitchen ExecutionUnits.
 * Kitchen never invents work from Orders.
 */

import type {
  ProductionBatch,
  ProductionBatchStatus,
  ProductionError,
} from "@/production/ProductionContext";
import type {
  ExecutionProgress,
  ExecutionQueue,
  ExecutionStatus,
  ExecutionUnit,
  KitchenCapabilityBits,
  KitchenCommandResult,
  KitchenContext,
  KitchenError,
  KitchenErrorCode,
  KitchenResult,
} from "./KitchenContext";
import type { KitchenRuntimeIdentity } from "./kitchenServiceContext";

export function parseUnitId(
  unitId: string,
): { dayDate: string; dishId: string } | null {
  // Production batch ids: batch:{dayDate}:{dishId}
  const m = /^batch:(\d{4}-\d{2}-\d{2}):(.+)$/.exec(unitId);
  if (!m) return null;
  return { dayDate: m[1], dishId: m[2] };
}

export function mapProductionStatusToExecution(
  status: ProductionBatchStatus,
): ExecutionStatus {
  switch (status) {
    case "queued":
      return "READY";
    case "released":
      return "READY";
    case "in_progress":
      return "IN_PROGRESS";
    case "blocked":
      return "BLOCKED";
    case "done":
      return "COMPLETED";
    case "cancelled":
      return "BLOCKED";
    default:
      return "READY";
  }
}

export function mapBatchToExecutionUnit(batch: ProductionBatch): ExecutionUnit {
  return {
    id: batch.id,
    productionBatchId: batch.id,
    dayDate: batch.scope.dayDate,
    dishId: batch.dishId,
    label: batch.dishName,
    portionCount: batch.portionCount,
    status: mapProductionStatusToExecution(batch.status),
    workstationId: batch.scope.station ?? null,
    assignedOperatorId: null,
    blockedReason: batch.readiness.blockedReason ?? null,
  };
}

export function mapBatchesToQueue(
  dayDate: string,
  batches: ProductionBatch[],
): ExecutionQueue {
  return {
    dayDate,
    units: batches.map(mapBatchToExecutionUnit),
  };
}

export function progressForUnit(unit: ExecutionUnit): ExecutionProgress {
  const percent =
    unit.status === "COMPLETED"
      ? 100
      : unit.status === "IN_PROGRESS"
        ? 50
        : unit.status === "PAUSED" || unit.status === "BLOCKED"
          ? 25
          : 0;
  return {
    unitId: unit.id,
    status: unit.status,
    percent,
    lastEventAt: null,
  };
}

export function kitchenCapabilityBitsFromIdentity(
  identity: KitchenRuntimeIdentity,
): KitchenCapabilityBits {
  const caps = new Set(identity.permissions.capabilities);
  // Canonical RBAC: kitchen.operate only (CAPABILITY_MATRIX).
  // Fine-grained kitchen.*/production.read strings are not Capability literals.
  const operate = caps.has("kitchen.operate");
  return {
    canReadQueue: operate,
    canOperate: operate,
    canAssign: operate,
    canBlock: operate,
  };
}

export function buildKitchenContext(
  tenantId: string,
  dayDate: string,
  batches: ProductionBatch[],
  identity: KitchenRuntimeIdentity,
): KitchenContext {
  return {
    tenantId,
    dayDate,
    queue: mapBatchesToQueue(dayDate, batches),
    permissions: kitchenCapabilityBitsFromIdentity(identity),
  };
}

export function mapProductionError(err: ProductionError): KitchenError {
  const code = productionCodeToKitchen(err.code);
  return {
    code,
    message: err.message,
    recoverable: err.recoverable,
    evidence: err.evidence,
  };
}

function productionCodeToKitchen(
  code: ProductionError["code"],
): KitchenErrorCode {
  switch (code) {
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "TENANT_MISMATCH":
      return "TENANT_MISMATCH";
    case "PERMISSION_DENIED":
      return "PERMISSION_DENIED";
    case "INVALID_STATE":
      return "INVALID_STATE";
    case "UNIMPLEMENTED":
      return "UNIMPLEMENTED";
    default:
      return "UNKNOWN";
  }
}

export function unimplementedError(
  intent: string,
  evidence?: Record<string, unknown>,
): KitchenError {
  return {
    code: "UNIMPLEMENTED",
    message: `${intent} is not implemented yet (Kitchen Execution Facade · compose gap)`,
    recoverable: true,
    evidence: { intent, ...evidence },
  };
}

export function failCommand(
  errors: KitchenError[],
  unitId: string | null = null,
  status: ExecutionStatus | null = null,
): KitchenCommandResult {
  return {
    ok: false,
    unitId,
    status,
    context: null,
    progress: null,
    errors,
  };
}

export function okCommand(input: {
  unitId: string;
  status: ExecutionStatus;
  context: KitchenContext;
  progress: ExecutionProgress;
}): KitchenCommandResult {
  return {
    ok: true,
    unitId: input.unitId,
    status: input.status,
    context: input.context,
    progress: input.progress,
    errors: [],
  };
}

export function failResult(errors: KitchenError[]): KitchenResult {
  return { ok: false, context: null, errors };
}

export function okResult(context: KitchenContext): KitchenResult {
  return { ok: true, context, errors: [] };
}

export function requireSession(
  identity: KitchenRuntimeIdentity,
): KitchenError | null {
  if (!identity.session.present || !identity.session.userId) {
    return {
      code: "PERMISSION_DENIED",
      message: "Authenticated session required for Kitchen Execution",
      recoverable: true,
    };
  }
  if (!identity.tenant?.id) {
    return {
      code: "TENANT_MISMATCH",
      message: "Tenant required for Kitchen Execution",
      recoverable: true,
    };
  }
  return null;
}
