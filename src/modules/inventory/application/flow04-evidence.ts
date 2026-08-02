/**
 * FLOW-04 · Canonical evidence (Inventory Consumption)
 *
 *   console.info("[FLOW-04]", "FLOW04_T1_STARTED", { … })
 *
 * Spec: docs/00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md (FROZEN)
 * Tokens are immutable; once-only per active pipeline.
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

type ActiveFlow04Pipeline = {
  id: string;
  steps: string[];
  closed: boolean;
};

let active: ActiveFlow04Pipeline | null = null;

function newPipelineId(): string {
  return `flow04-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Start a FLOW-04 evidence pipeline (inventory certification). */
export function beginFlow04Pipeline(
  detail?: Record<string, unknown>,
): string {
  active = { id: newPipelineId(), steps: [], closed: false };
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-04]", "PIPELINE_BEGIN", {
      ...(detail ?? {}),
      pipelineId: active.id,
    });
  }
  return active.id;
}

export function getObservedFlow04Steps(): string[] {
  return active ? [...active.steps] : [];
}

export function hasFlow04Step(step: Flow04EvidenceStep | string): boolean {
  return Boolean(active && !active.closed && active.steps.includes(step));
}

export function isFlow04PipelineActive(): boolean {
  return Boolean(active && !active.closed);
}

/** Ensure prior tokens exist before emitting the next transition. */
export function assertFlow04Prefix(
  required: readonly Flow04EvidenceStep[],
): void {
  if (!active || active.closed) {
    throw new Error("FLOW-04 pipeline not active");
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
  detail?: Record<string, unknown>,
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
    });
  }

  if (step === "FLOW04_T3_COMPLETED") {
    active.closed = true;
  }
}

export function stopFlow04(reason: string, detail?: Record<string, unknown>): void {
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-04]", "STOP", {
      reason,
      ...(detail ?? {}),
      ...(active ? { pipelineId: active.id } : {}),
    });
  }
  if (active) active.closed = true;
}

/** @internal vitest */
export function __resetFlow04EvidenceForTests(): void {
  active = null;
}
