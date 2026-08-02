/**
 * FLOW-03 · Canonical evidence (Billing)
 *
 * Mirrors FLOW-02 / FLOW-01 console contract:
 *   console.info("[FLOW-03]", "FLOW03_T1_STARTED", { … })
 *
 * Spec: docs/00-status/FLOW_03_BILLING_SPEC.md (FROZEN)
 * Tokens are immutable; once-only per active pipeline.
 */

export const FLOW03_EVIDENCE_STEPS = [
  "FLOW03_T1_STARTED",
  "FLOW03_T1_COMPLETED",
  "FLOW03_T2_STARTED",
  "FLOW03_T2_COMPLETED",
  "FLOW03_T3_STARTED",
  "FLOW03_T3_COMPLETED",
] as const;

export type Flow03EvidenceStep = (typeof FLOW03_EVIDENCE_STEPS)[number];

type ActiveFlow03Pipeline = {
  id: string;
  steps: string[];
  closed: boolean;
};

let active: ActiveFlow03Pipeline | null = null;

function newPipelineId(): string {
  return `flow03-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Start a FLOW-03 evidence pipeline (billing certification). */
export function beginFlow03Pipeline(
  detail?: Record<string, unknown>,
): string {
  active = { id: newPipelineId(), steps: [], closed: false };
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-03]", "PIPELINE_BEGIN", {
      ...(detail ?? {}),
      pipelineId: active.id,
    });
  }
  return active.id;
}

export function getObservedFlow03Steps(): string[] {
  return active ? [...active.steps] : [];
}

export function hasFlow03Step(step: Flow03EvidenceStep | string): boolean {
  return Boolean(active && !active.closed && active.steps.includes(step));
}

export function isFlow03PipelineActive(): boolean {
  return Boolean(active && !active.closed);
}

/** Ensure prior tokens exist before emitting the next transition. */
export function assertFlow03Prefix(
  required: readonly Flow03EvidenceStep[],
): void {
  if (!active || active.closed) {
    throw new Error("FLOW-03 pipeline not active");
  }
  for (const step of required) {
    if (!active.steps.includes(step)) {
      throw new Error(`FLOW-03 missing prefix step ${step}`);
    }
  }
}

/**
 * Emit a FLOW-03 evidence token exactly once per active pipeline.
 * Duplicates are ignored (still logged as SKIP_DUPLICATE for diagnosis).
 */
export function logFlow03Step(
  step: Flow03EvidenceStep | string,
  detail?: Record<string, unknown>,
): void {
  if (!active || active.closed) {
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[FLOW-03]", step, {
        ...(detail ?? {}),
        skipped: "NO_ACTIVE_PIPELINE",
      });
    }
    return;
  }

  if (active.steps.includes(step)) {
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[FLOW-03]", "SKIP_DUPLICATE", {
        step,
        ...(detail ?? {}),
        pipelineId: active.id,
      });
    }
    return;
  }

  active.steps.push(step);
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-03]", step, {
      ...(detail ?? {}),
      pipelineId: active.id,
    });
  }

  if (step === "FLOW03_T3_COMPLETED") {
    active.closed = true;
  }
}

export function stopFlow03(reason: string, detail?: Record<string, unknown>): void {
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[FLOW-03]", "STOP", {
      reason,
      ...(detail ?? {}),
      ...(active ? { pipelineId: active.id } : {}),
    });
  }
  if (active) active.closed = true;
}

/** @internal vitest */
export function __resetFlow03EvidenceForTests(): void {
  active = null;
}
