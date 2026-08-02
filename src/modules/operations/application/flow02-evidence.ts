/**
 * FLOW-02 · Canonical evidence (Delivery Incidents)
 *
 * Mirrors FLOW-01 / FCR-008 console contract:
 *   console.info("[FLOW-02]", "FLOW02_T1_STARTED", { … })
 *
 * Spec: docs/00-status/FLOW_02_DELIVERY_INCIDENTS_SPEC.md (FROZEN)
 * Tokens are immutable; once-only per active pipeline.
 */

export const FLOW02_EVIDENCE_STEPS = [
  "FLOW02_T1_STARTED",
  "FLOW02_T1_COMPLETED",
  "FLOW02_T2_STARTED",
  "FLOW02_T2_COMPLETED",
  "FLOW02_T3_STARTED",
  "FLOW02_T3_COMPLETED",
] as const;

export type Flow02EvidenceStep = (typeof FLOW02_EVIDENCE_STEPS)[number];

type ActiveFlow02Pipeline = {
  id: string;
  steps: string[];
  closed: boolean;
};

let active: ActiveFlow02Pipeline | null = null;

function newPipelineId(): string {
  return `flow02-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Start a FLOW-02 evidence pipeline (exception-path certification). */
export function beginFlow02Pipeline(
  detail?: Record<string, unknown>,
): string {
  active = { id: newPipelineId(), steps: [], closed: false };
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-02]", "PIPELINE_BEGIN", {
      ...(detail ?? {}),
      pipelineId: active.id,
    });
  }
  return active.id;
}

export function getObservedFlow02Steps(): string[] {
  return active ? [...active.steps] : [];
}

export function hasFlow02Step(step: Flow02EvidenceStep | string): boolean {
  return Boolean(active && !active.closed && active.steps.includes(step));
}

export function isFlow02PipelineActive(): boolean {
  return Boolean(active && !active.closed);
}

/** Ensure prior tokens exist before emitting the next transition. */
export function assertFlow02Prefix(
  required: readonly Flow02EvidenceStep[],
): void {
  if (!active || active.closed) {
    throw new Error("FLOW-02 pipeline not active");
  }
  for (const step of required) {
    if (!active.steps.includes(step)) {
      throw new Error(`FLOW-02 missing prefix step ${step}`);
    }
  }
}

/**
 * Emit a FLOW-02 evidence token exactly once per active pipeline.
 * Duplicates are ignored (still logged as SKIP_DUPLICATE for diagnosis).
 */
export function logFlow02Step(
  step: Flow02EvidenceStep | string,
  detail?: Record<string, unknown>,
): void {
  if (!active || active.closed) {
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[FLOW-02]", step, {
        ...(detail ?? {}),
        skipped: "NO_ACTIVE_PIPELINE",
      });
    }
    return;
  }

  if (active.steps.includes(step)) {
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[FLOW-02]", "SKIP_DUPLICATE", {
        step,
        ...(detail ?? {}),
        pipelineId: active.id,
      });
    }
    return;
  }

  active.steps.push(step);
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-02]", step, {
      ...(detail ?? {}),
      pipelineId: active.id,
    });
  }

  if (step === "FLOW02_T3_COMPLETED") {
    active.closed = true;
  }
}

export function stopFlow02(reason: string, detail?: Record<string, unknown>): void {
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-02]", "STOP", {
      reason,
      ...(detail ?? {}),
      ...(active ? { pipelineId: active.id } : {}),
    });
  }
  if (active) active.closed = true;
}

/** @internal vitest */
export function __resetFlow02EvidenceForTests(): void {
  active = null;
}
