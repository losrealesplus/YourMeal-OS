/**
 * FLOW-01 · Canonical evidence (Kitchen → Delivery)
 *
 * Mirrors FCR-008 console contract for domain certification:
 *   console.info("[FLOW-01]", "FLOW01_T1_STARTED", { … })
 *
 * Spec: docs/00-status/FLOW_01_KITCHEN_DELIVERY_SPEC.md (FROZEN)
 * Tokens are immutable; once-only per active pipeline.
 */

export const FLOW01_EVIDENCE_STEPS = [
  "FLOW01_T1_STARTED",
  "FLOW01_T1_COMPLETED",
  "FLOW01_T2_STARTED",
  "FLOW01_T2_COMPLETED",
  "FLOW01_T3_STARTED",
  "FLOW01_T3_COMPLETED",
  "FLOW01_T4_STARTED",
  "FLOW01_T4_COMPLETED",
] as const;

export type Flow01EvidenceStep = (typeof FLOW01_EVIDENCE_STEPS)[number];

type ActiveFlow01Pipeline = {
  id: string;
  steps: string[];
  closed: boolean;
};

let active: ActiveFlow01Pipeline | null = null;

function newPipelineId(): string {
  return `flow01-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Start a FLOW-01 evidence pipeline (happy-path certification). */
export function beginFlow01Pipeline(
  detail?: Record<string, unknown>,
): string {
  active = { id: newPipelineId(), steps: [], closed: false };
  // Do not emit FLOW01_* here — only canonical T* tokens enter the contract.
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-01]", "PIPELINE_BEGIN", {
      ...(detail ?? {}),
      pipelineId: active.id,
    });
  }
  return active.id;
}

export function getObservedFlow01Steps(): string[] {
  return active ? [...active.steps] : [];
}

export function hasFlow01Step(step: Flow01EvidenceStep | string): boolean {
  return Boolean(active && !active.closed && active.steps.includes(step));
}

export function isFlow01PipelineActive(): boolean {
  return Boolean(active && !active.closed);
}

/** Ensure prior tokens exist before emitting the next transition. */
export function assertFlow01Prefix(
  required: readonly Flow01EvidenceStep[],
): void {
  if (!active || active.closed) {
    throw new Error("FLOW-01 pipeline not active");
  }
  for (const step of required) {
    if (!active.steps.includes(step)) {
      throw new Error(`FLOW-01 missing prefix step ${step}`);
    }
  }
}

/**
 * Emit a FLOW-01 evidence token exactly once per active pipeline.
 * Duplicates are ignored (still logged as SKIP_DUPLICATE for diagnosis).
 */
export function logFlow01Step(
  step: Flow01EvidenceStep | string,
  detail?: Record<string, unknown>,
): void {
  if (!active || active.closed) {
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[FLOW-01]", step, {
        ...(detail ?? {}),
        skipped: "NO_ACTIVE_PIPELINE",
      });
    }
    return;
  }

  if (active.steps.includes(step)) {
    // Avoid re-emitting the token name (would look like a contract duplicate).
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[FLOW-01]", "SKIP_DUPLICATE", {
        step,
        ...(detail ?? {}),
        pipelineId: active.id,
      });
    }
    return;
  }

  active.steps.push(step);
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-01]", step, {
      ...(detail ?? {}),
      pipelineId: active.id,
    });
  }

  if (step === "FLOW01_T4_COMPLETED") {
    active.closed = true;
  }
}

export function stopFlow01(reason: string, detail?: Record<string, unknown>): void {
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-01]", "STOP", {
      reason,
      ...(detail ?? {}),
      ...(active ? { pipelineId: active.id } : {}),
    });
  }
  if (active) active.closed = true;
}

/** @internal vitest */
export function __resetFlow01EvidenceForTests(): void {
  active = null;
}
