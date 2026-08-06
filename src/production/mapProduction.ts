/**
 * INTERNAL — map EP-002B production report → Production Capability contracts.
 */

import type {
  ProductionReportModel,
  KitchenBatchStatus,
} from "@/modules/operations";
import { DomainError } from "@/domain/errors";
import type {
  ProductionBatch,
  ProductionBatchStatus,
  ProductionCapabilityBits,
  ProductionCommandResult,
  ProductionContext,
  ProductionError,
  ProductionErrorCode,
  ProductionLoad,
  ProductionResult,
  ProductionScope,
  ProductionStatus,
  ProductionSummary,
} from "./ProductionContext";

export function planIdForDay(dayDate: string): string {
  return `plan:${dayDate}`;
}

export function batchIdFor(dayDate: string, dishId: string): string {
  return `batch:${dayDate}:${dishId}`;
}

export function mapKitchenStatus(
  status: KitchenBatchStatus,
): ProductionBatchStatus {
  switch (status) {
    case "pending":
      return "queued";
    case "preparing":
      return "released";
    case "plating":
      return "in_progress";
    case "finished":
      return "done";
    default:
      return "queued";
  }
}

export function mapReportToBatches(
  report: ProductionReportModel,
): ProductionBatch[] {
  const scope: ProductionScope = { dayDate: report.deliveryDate };
  const standard = report.standardDishes.map((d) => {
    const status = mapKitchenStatus(d.batchStatus);
    return {
      id: batchIdFor(report.deliveryDate, d.dishId),
      scope,
      dishId: d.dishId,
      dishName: d.dishName,
      portionCount: d.totalQty,
      status,
      orderIds: [...new Set(d.customers.map((c) => c.orderId))],
      constraints: {
        allergens: d.allergens,
        modifications: [],
        isCustom: false,
      },
      readiness: {
        releasedToKitchen: status !== "queued",
        blockedReason: null,
      },
    } satisfies ProductionBatch;
  });

  // Custom lines as individual custom batches (planning visibility)
  const customs = report.customizations.map((c, i) => {
    const id = `batch:${report.deliveryDate}:custom:${c.dishId}:${i}`;
    return {
      id,
      scope,
      dishId: c.dishId,
      dishName: c.dishName,
      portionCount: c.qty,
      status: "queued" as const,
      orderIds: [c.orderId],
      constraints: {
        allergens: [],
        modifications: [c.observation],
        isCustom: true,
      },
      readiness: {
        releasedToKitchen: false,
        blockedReason: null,
      },
    } satisfies ProductionBatch;
  });

  return [...standard, ...customs];
}

export function mapReportToLoad(report: ProductionReportModel): ProductionLoad {
  const prep = report.standardDishes.reduce(
    (s, d) => s + (d.prepMinutes ?? 0) * d.totalQty,
    0,
  );
  return {
    scope: { dayDate: report.deliveryDate },
    portionCount: report.totals.portionCount,
    batchCount: report.totals.dishCount,
    estimatedPrepMinutes: prep > 0 ? prep : null,
    customLineCount: report.totals.customizationCount,
  };
}

export function derivePlanStatus(
  batches: ProductionBatch[],
): ProductionStatus {
  if (batches.length === 0) return "draft";
  const allDone = batches.every((b) => b.status === "done");
  if (allDone) return "completed";
  const anyProgress = batches.some(
    (b) =>
      b.status === "released" ||
      b.status === "in_progress" ||
      b.status === "done",
  );
  if (anyProgress) return "in_execution";
  const anyReleased = batches.some((b) => b.readiness.releasedToKitchen);
  if (anyReleased) return "ready_for_kitchen";
  return "planned";
}

export function mapReportToContext(
  report: ProductionReportModel,
  tenantId: string,
  permissions: ProductionCapabilityBits,
): ProductionContext {
  const batches = mapReportToBatches(report);
  const load = mapReportToLoad(report);
  const status = derivePlanStatus(batches);
  const orderIds = [...new Set(batches.flatMap((b) => b.orderIds))];
  const summary: ProductionSummary = {
    id: planIdForDay(report.deliveryDate),
    scope: { dayDate: report.deliveryDate },
    status,
    load,
    batchCount: batches.length,
    readiness: status === "ready_for_kitchen" || status === "in_execution",
    tenantId,
  };
  return {
    summary,
    queue: { scope: summary.scope, batches },
    capacity: null,
    schedule: null,
    permissions,
    sourceOrders: { orderIds },
  };
}

export function mapDomainError(err: unknown): ProductionError {
  if (err instanceof DomainError) {
    return {
      code: domainCodeToProduction(err.code),
      message: err.message,
      recoverable:
        err.code === "PERMISSION_DENIED" || err.code === "UNIMPLEMENTED",
      evidence: err.details,
    };
  }
  if (err && typeof err === "object" && "message" in err) {
    return {
      code: "UNKNOWN",
      message: String((err as { message: unknown }).message),
      recoverable: false,
    };
  }
  return { code: "UNKNOWN", message: String(err), recoverable: false };
}

function domainCodeToProduction(
  code: DomainError["code"],
): ProductionErrorCode {
  switch (code) {
    case "PERMISSION_DENIED":
      return "PERMISSION_DENIED";
    case "TENANT_MISMATCH":
      return "TENANT_MISMATCH";
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "INVALID_STATE":
    case "ORDER_CLOSED":
      return "INVALID_STATE";
    case "UNIMPLEMENTED":
      return "UNIMPLEMENTED";
    default:
      return "UNKNOWN";
  }
}

export function unimplementedError(
  command: string,
  evidence?: Record<string, unknown>,
): ProductionError {
  return {
    code: "UNIMPLEMENTED",
    message: `${command} substrate not available yet — facade exposes planning intent only`,
    recoverable: true,
    evidence,
  };
}

export function failCommand(
  errors: ProductionError[],
  planId: string | null = null,
  batchId: string | null = null,
): ProductionCommandResult {
  return {
    ok: false,
    planId,
    batchId,
    status: null,
    context: null,
    load: null,
    errors,
  };
}

export function failResult(errors: ProductionError[]): ProductionResult {
  return { ok: false, context: null, errors };
}

export function okCommand(partial: {
  planId?: string | null;
  batchId?: string | null;
  status?: ProductionStatus | ProductionBatchStatus | null;
  context?: ProductionContext | null;
  load?: ProductionLoad | null;
}): ProductionCommandResult {
  return {
    ok: true,
    planId: partial.planId ?? null,
    batchId: partial.batchId ?? null,
    status: partial.status ?? null,
    context: partial.context ?? null,
    load: partial.load ?? null,
    errors: [],
  };
}
