/**
 * FLOW-04 · Canonical evidence (Inventory Consumption)
 *
 *   console.info("[FLOW-04]", "FLOW04_T1_STARTED", { … })
 *
 * Spec: docs/00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md (FROZEN)
 * Tokens are immutable; once-only per active pipeline.
 * Each pipeline is strictly bound to context: { tenantId, consumptionId, deliveryDate }.
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

type ActiveFlow04Pipeline = {
  id: string;
  context: Flow04Context;
  steps: string[];
  closed: boolean;
};

let active: ActiveFlow04Pipeline | null = null;

function contextsConflict(a: Flow04Context, b?: Flow04Context): boolean {
  if (!b) return false;
  if (a.tenantId && b.tenantId && a.tenantId !== b.tenantId) return true;
  if (a.deliveryDate && b.deliveryDate && a.deliveryDate !== b.deliveryDate) return true;
  if (a.consumptionId && b.consumptionId && a.consumptionId !== b.consumptionId) return true;
  return false;
}

function newPipelineId(): string {
  return `flow04-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Start a FLOW-04 evidence pipeline bound to explicit context. */
export function beginFlow04Pipeline(detail?: Flow04Context & Record<string, unknown>): string {
  const context: Flow04Context = {
    tenantId: detail?.tenantId,
    deliveryDate: detail?.deliveryDate,
    consumptionId: detail?.consumptionId,
  };
  active = {
    id: newPipelineId(),
    context,
    steps: [],
    closed: false,
  };
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-04]", "PIPELINE_BEGIN", {
      ...(detail ?? {}),
      pipelineId: active.id,
      context: active.context,
    });
  }
  return active.id;
}

export function getObservedFlow04Steps(context?: Flow04Context): string[] {
  if (!active) return [];
  if (context && contextsConflict(active.context, context)) return [];
  return [...active.steps];
}

export function getActiveFlow04Context(): Flow04Context | null {
  return active ? { ...active.context } : null;
}

export function hasFlow04Step(step: Flow04EvidenceStep | string, context?: Flow04Context): boolean {
  if (!active || active.closed) return false;
  if (context && contextsConflict(active.context, context)) return false;
  return active.steps.includes(step);
}

export function isFlow04PipelineActive(context?: Flow04Context): boolean {
  if (!active || active.closed) return false;
  if (context && contextsConflict(active.context, context)) return false;
  return true;
}

/**
 * Resume a FLOW-04 pipeline from persisted state (e.g. after UI page reload or recovery).
 * Re-populates prior verified steps for the specific context.
 * If a pipeline is already active for a DIFFERENT context, it is cleanly reset.
 */
export function resumeFlow04Pipeline(
  priorSteps: readonly Flow04EvidenceStep[],
  detail?: Flow04Context & Record<string, unknown>,
): string {
  const incomingContext: Flow04Context = {
    tenantId: detail?.tenantId,
    deliveryDate: detail?.deliveryDate,
    consumptionId: detail?.consumptionId,
  };

  if (!active || active.closed || contextsConflict(active.context, incomingContext)) {
    if (active && !active.closed && contextsConflict(active.context, incomingContext)) {
      if (typeof console !== "undefined" && typeof console.info === "function") {
        console.info("[FLOW-04]", "PIPELINE_CONTEXT_RESET", {
          previousContext: active.context,
          newContext: incomingContext,
        });
      }
    }
    active = {
      id: newPipelineId(),
      context: incomingContext,
      steps: [...priorSteps],
      closed: false,
    };
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[FLOW-04]", "PIPELINE_RESUMED", {
        ...(detail ?? {}),
        pipelineId: active.id,
        context: active.context,
        resumedSteps: active.steps,
      });
    }
  } else {
    // Enrich existing context
    if (!active.context.tenantId && incomingContext.tenantId) {
      active.context.tenantId = incomingContext.tenantId;
    }
    if (!active.context.deliveryDate && incomingContext.deliveryDate) {
      active.context.deliveryDate = incomingContext.deliveryDate;
    }
    if (!active.context.consumptionId && incomingContext.consumptionId) {
      active.context.consumptionId = incomingContext.consumptionId;
    }
    for (const step of priorSteps) {
      if (!active.steps.includes(step)) {
        active.steps.push(step);
      }
    }
  }
  return active.id;
}

/** Ensure prior tokens exist and match expected context before emitting the next transition. */
export function assertFlow04Prefix(
  required: readonly Flow04EvidenceStep[],
  expectedContext?: Flow04Context,
): void {
  if (!active || active.closed) {
    throw new Error("FLOW-04 pipeline not active");
  }
  if (expectedContext && contextsConflict(active.context, expectedContext)) {
    throw new Error(
      `FLOW-04 context mismatch: active pipeline (${JSON.stringify(active.context)}) does not match required context (${JSON.stringify(expectedContext)})`,
    );
  }
  for (const step of required) {
    if (!active.steps.includes(step)) {
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
): void {
  if (!active || active.closed) {
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
    if (contextsConflict(active.context, incomingContext)) {
      if (typeof console !== "undefined" && typeof console.info === "function") {
        console.warn("[FLOW-04]", "STEP_CONTEXT_MISMATCH", {
          step,
          activeContext: active.context,
          incomingContext,
        });
      }
      return;
    }
    if (!active.context.tenantId && incomingContext.tenantId) {
      active.context.tenantId = incomingContext.tenantId;
    }
    if (!active.context.deliveryDate && incomingContext.deliveryDate) {
      active.context.deliveryDate = incomingContext.deliveryDate;
    }
    if (!active.context.consumptionId && incomingContext.consumptionId) {
      active.context.consumptionId = incomingContext.consumptionId;
    }
  }

  if (active.steps.includes(step)) {
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[FLOW-04]", "SKIP_DUPLICATE", {
        step,
        ...(detail ?? {}),
        pipelineId: active.id,
      });
    }
    return;
  }

  active.steps.push(step);
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-04]", step, {
      ...(detail ?? {}),
      pipelineId: active.id,
      context: active.context,
    });
  }

  if (step === "FLOW04_T3_COMPLETED") {
    active.closed = true;
  }
}

export function stopFlow04(reason: string, detail?: Flow04Context & Record<string, unknown>): void {
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-04]", "STOP", {
      reason,
      ...(detail ?? {}),
      ...(active ? { pipelineId: active.id, context: active.context } : {}),
    });
  }
  if (active) active.closed = true;
}

/** @internal vitest */
export function __resetFlow04EvidenceForTests(): void {
  active = null;
}
