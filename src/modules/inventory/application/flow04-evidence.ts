/**
 * FLOW-04 · Canonical evidence (Inventory Consumption)
 *
 *   console.info("[FLOW-04]", "FLOW04_T1_STARTED", { … })
 *
 * Spec: docs/00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md (FROZEN)
 * Tokens are immutable; once-only per active pipeline.
 *
 * Concurrency & Isolation Architecture:
 * Each execution holds its own isolated pipeline identity (pipelineId), bound
 * strictly to { tenantId, deliveryDate, consumptionId }.
 * Pipelines from different tenants or dates never overwrite or contaminate each other.
 */

export const FLOW04_EVIDENCE_STEPS = [
  "FLOW04_T1_STARTED",
  "FLOW04_T1_COMPLETED",
  "FLOW04_T2_STARTED",
  "FLOW04_T2_COMPLETED",
  "FLOW04_T3_STARTED",
  "FLOW04_T3_COMPLETED",
] as const;

export type Flow04EvidenceStep = (typeof FLOW04_EVIDENCE_STEPS)[number];

export type Flow04Context = {
  tenantId?: string;
  deliveryDate?: string;
  consumptionId?: string;
};

export type ActiveFlow04Pipeline = {
  id: string;
  context: Flow04Context;
  steps: string[];
  closed: boolean;
};

const pipelines = new Map<string, ActiveFlow04Pipeline>();

function newPipelineId(): string {
  return `flow04-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function contextsConflict(a: Flow04Context, b?: Flow04Context): boolean {
  if (!b) return false;
  if (a.tenantId && b.tenantId && a.tenantId !== b.tenantId) return true;
  if (a.deliveryDate && b.deliveryDate && a.deliveryDate !== b.deliveryDate) return true;
  if (a.consumptionId && b.consumptionId && a.consumptionId !== b.consumptionId) return true;
  return false;
}

/**
 * Deterministically resolve a pipeline by explicit pipelineId, or strictly by context without wildcards.
 */
function resolvePipeline(detail?: Flow04Context, pipelineId?: string): ActiveFlow04Pipeline | null {
  if (pipelineId) {
    const p = pipelines.get(pipelineId);
    if (p) return p;
  }

  const hasDetail =
    detail &&
    (Boolean(detail.consumptionId) || Boolean(detail.tenantId) || Boolean(detail.deliveryDate));

  if (hasDetail) {
    // 1. Strict match by consumptionId + tenantId (if present)
    if (detail.consumptionId) {
      for (const p of pipelines.values()) {
        if (p.context.consumptionId === detail.consumptionId) {
          if (!detail.tenantId || p.context.tenantId === detail.tenantId) {
            return p;
          }
        }
      }
    }

    // 2. Strict match by tenantId + deliveryDate
    if (detail.tenantId && detail.deliveryDate) {
      for (const p of pipelines.values()) {
        if (
          p.context.tenantId === detail.tenantId &&
          p.context.deliveryDate === detail.deliveryDate
        ) {
          return p;
        }
      }
    }

    // 3. Match exclusively by tenantId if pipeline matches that tenant
    if (detail.tenantId && !detail.deliveryDate) {
      const forTenant = Array.from(pipelines.values()).filter(
        (p) => p.context.tenantId === detail.tenantId,
      );
      const activeForTenant = forTenant.filter((p) => !p.closed);
      if (activeForTenant.length === 1) return activeForTenant[0];
      if (forTenant.length === 1) return forTenant[0];
      if (forTenant.length > 1) return forTenant[forTenant.length - 1];
    }

    // 4. Match exclusively by deliveryDate if pipeline matches that deliveryDate
    if (detail.deliveryDate && !detail.tenantId) {
      const forDate = Array.from(pipelines.values()).filter(
        (p) => p.context.deliveryDate === detail.deliveryDate,
      );
      const activeForDate = forDate.filter((p) => !p.closed);
      if (activeForDate.length === 1) return activeForDate[0];
      if (forDate.length === 1) return forDate[0];
      if (forDate.length > 1) return forDate[forDate.length - 1];
    }

    // 5. Unassigned pipeline fallback (e.g. from seed helper or beginFlow04Pipeline with no context)
    const unassigned = Array.from(pipelines.values()).filter(
      (p) => !p.closed && !p.context.tenantId && !p.context.deliveryDate,
    );
    if (unassigned.length === 1) {
      return unassigned[0];
    }

    return null;
  }

  // Generic / single-pipeline lookup (e.g. getObservedFlow04Steps() in test without context)
  const all = Array.from(pipelines.values());
  const activeList = all.filter((p) => !p.closed);
  if (activeList.length === 1) return activeList[0];
  if (activeList.length > 1) return activeList[activeList.length - 1];
  if (all.length > 0) return all[all.length - 1];

  return null;
}

/**
 * Start a new FLOW-04 evidence pipeline bound to explicit execution context.
 * Returns the unique pipeline token.
 */
export function beginFlow04Pipeline(detail?: Flow04Context & Record<string, unknown>): string {
  const pipelineId = newPipelineId();
  const context: Flow04Context = {
    tenantId: detail?.tenantId,
    deliveryDate: detail?.deliveryDate,
    consumptionId: detail?.consumptionId,
  };
  const pipeline: ActiveFlow04Pipeline = {
    id: pipelineId,
    context,
    steps: [],
    closed: false,
  };
  pipelines.set(pipelineId, pipeline);

  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-04]", "PIPELINE_BEGIN", {
      ...(detail ?? {}),
      pipelineId,
      context,
    });
  }
  return pipelineId;
}

export function getObservedFlow04Steps(context?: Flow04Context, pipelineId?: string): string[] {
  const target = resolvePipeline(context, pipelineId);
  return target ? [...target.steps] : [];
}

export function getActiveFlow04Context(pipelineId?: string): Flow04Context | null {
  const target = resolvePipeline(undefined, pipelineId);
  return target ? { ...target.context } : null;
}

export function hasFlow04Step(
  step: Flow04EvidenceStep | string,
  context?: Flow04Context,
  pipelineId?: string,
): boolean {
  const target = resolvePipeline(context, pipelineId);
  return Boolean(target && !target.closed && target.steps.includes(step));
}

export function isFlow04PipelineActive(context?: Flow04Context, pipelineId?: string): boolean {
  const target = resolvePipeline(context, pipelineId);
  return Boolean(target && !target.closed);
}

/**
 * Resume a FLOW-04 pipeline from persisted state (e.g. after UI page reload or recovery).
 * Returns the pipeline token for subsequent operations.
 */
export function resumeFlow04Pipeline(
  priorSteps: readonly Flow04EvidenceStep[],
  detail?: Flow04Context & Record<string, unknown>,
  pipelineId?: string,
): string {
  const incomingContext: Flow04Context = {
    tenantId: detail?.tenantId,
    deliveryDate: detail?.deliveryDate,
    consumptionId: detail?.consumptionId,
  };

  let target = resolvePipeline(incomingContext, pipelineId);

  if (!target || target.closed) {
    const newId = pipelineId || newPipelineId();
    target = {
      id: newId,
      context: incomingContext,
      steps: [...priorSteps],
      closed: false,
    };
    pipelines.set(newId, target);
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[FLOW-04]", "PIPELINE_RESUMED", {
        ...(detail ?? {}),
        pipelineId: target.id,
        context: target.context,
        resumedSteps: target.steps,
      });
    }
  } else {
    // Enrich existing context
    if (!target.context.tenantId && incomingContext.tenantId) {
      target.context.tenantId = incomingContext.tenantId;
    }
    if (!target.context.deliveryDate && incomingContext.deliveryDate) {
      target.context.deliveryDate = incomingContext.deliveryDate;
    }
    if (!target.context.consumptionId && incomingContext.consumptionId) {
      target.context.consumptionId = incomingContext.consumptionId;
    }
    for (const step of priorSteps) {
      if (!target.steps.includes(step)) {
        target.steps.push(step);
      }
    }
  }
  return target.id;
}

/** Ensure prior tokens exist and match expected context before emitting the next transition. */
export function assertFlow04Prefix(
  required: readonly Flow04EvidenceStep[],
  expectedContext?: Flow04Context,
  pipelineId?: string,
): void {
  const target = resolvePipeline(expectedContext, pipelineId);
  if (!target || target.closed) {
    throw new Error("FLOW-04 pipeline not active");
  }
  if (expectedContext && contextsConflict(target.context, expectedContext)) {
    throw new Error(
      `FLOW-04 context mismatch: active pipeline (${JSON.stringify(target.context)}) does not match required context (${JSON.stringify(expectedContext)})`,
    );
  }
  for (const step of required) {
    if (!target.steps.includes(step)) {
      throw new Error(`FLOW-04 missing prefix step ${step}`);
    }
  }
}

/**
 * Emit a FLOW-04 evidence token exactly once per active pipeline.
 * Duplicates are ignored (still logged as SKIP_DUPLICATE for diagnosis).
 */
export function logFlow04Step(
  step: Flow04EvidenceStep | string,
  detail?: Flow04Context & Record<string, unknown>,
  pipelineId?: string,
): void {
  const target = resolvePipeline(detail, pipelineId);
  if (!target || target.closed) {
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[FLOW-04]", step, {
        ...(detail ?? {}),
        skipped: "NO_ACTIVE_PIPELINE",
      });
    }
    return;
  }

  if (detail) {
    const incomingContext: Flow04Context = {
      tenantId: detail.tenantId,
      deliveryDate: detail.deliveryDate,
      consumptionId: detail.consumptionId,
    };
    if (contextsConflict(target.context, incomingContext)) {
      if (typeof console !== "undefined" && typeof console.info === "function") {
        console.warn("[FLOW-04]", "STEP_CONTEXT_MISMATCH", {
          step,
          activeContext: target.context,
          incomingContext,
          pipelineId: target.id,
        });
      }
      return;
    }
    if (!target.context.tenantId && incomingContext.tenantId) {
      target.context.tenantId = incomingContext.tenantId;
    }
    if (!target.context.deliveryDate && incomingContext.deliveryDate) {
      target.context.deliveryDate = incomingContext.deliveryDate;
    }
    if (!target.context.consumptionId && incomingContext.consumptionId) {
      target.context.consumptionId = incomingContext.consumptionId;
    }
  }

  if (target.steps.includes(step)) {
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[FLOW-04]", "SKIP_DUPLICATE", {
        step,
        ...(detail ?? {}),
        pipelineId: target.id,
      });
    }
    return;
  }

  target.steps.push(step);
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-04]", step, {
      ...(detail ?? {}),
      pipelineId: target.id,
      context: target.context,
    });
  }

  if (step === "FLOW04_T3_COMPLETED") {
    target.closed = true;
  }
}

export function stopFlow04(
  reason: string,
  detail?: Flow04Context & Record<string, unknown>,
  pipelineId?: string,
): void {
  const target = resolvePipeline(detail, pipelineId);
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-04]", "STOP", {
      reason,
      ...(detail ?? {}),
      ...(target ? { pipelineId: target.id, context: target.context } : {}),
    });
  }
  if (target) target.closed = true;
}

/** @internal vitest */
export function __resetFlow04EvidenceForTests(): void {
  pipelines.clear();
}
