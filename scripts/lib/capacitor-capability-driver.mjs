/**
 * Capacitor · Capability driver (Distribution C1–C5).
 *
 * C1 = Platform Preparation (CAPACITOR-001)
 * C2…C5 = not implemented in this delivery
 *
 * Tenant-agnostic — Core SaaS → Capacitor → Android / iOS.
 * Core Integrity Rule: Distribution does not alter Core SaaS behavior.
 * Rule: each block certifies exactly one Distribution state transition.
 */
import { CAPACITOR_SEGMENTS } from "./capacitor-canonical-pipeline.mjs";
import { runCapacitorC1PlatformPreparation } from "./capacitor-c1-platform-preparation.mjs";

/**
 * @param {{ root: string, through?: 1|2|3|4|5 | 0 | null }} opts
 * @returns {{ ok: boolean, steps: string[], reason?: string, evidence?: Record<string, unknown> }}
 */
export function runCapacitorCapabilityDriver({ root, through = null }) {
  const max = through ?? 0;
  /** @type {string[]} */
  const steps = [];
  /** @type {Record<string, unknown>} */
  const evidence = { segments: CAPACITOR_SEGMENTS };

  if (max < 1) {
    return {
      ok: true,
      steps,
      evidence: {
        ...evidence,
        note: "CERTIFIED_THROUGH=0 — runner institutionalizes contract only",
      },
    };
  }

  console.info("[CAPACITOR]", "CAPACITOR_C1_STARTED", {
    segment: CAPACITOR_SEGMENTS[1],
  });
  steps.push("CAPACITOR_C1_STARTED");

  const c1 = runCapacitorC1PlatformPreparation({ cwd: root });
  evidence.c1_checks = c1.checks;
  if (!c1.ok) {
    console.error("[CAPACITOR] C1 FAIL:\n" + c1.reason);
    return { ok: false, steps, reason: c1.reason, evidence };
  }
  evidence.c1_mapped_tokens = c1.mapped_tokens;
  evidence.c1_source = c1.source;

  console.info("[CAPACITOR]", "CAPACITOR_C1_COMPLETED", {
    segment: CAPACITOR_SEGMENTS[1],
    mapped_tokens: c1.mapped_tokens,
    source: c1.source,
    checks: c1.checks,
  });
  steps.push("CAPACITOR_C1_COMPLETED");

  if (max < 2) return { ok: true, steps, evidence };

  return {
    ok: false,
    steps,
    reason:
      "C2+ block drivers are not implemented — stop at CAPACITOR-001 (C1 Platform Preparation only).",
    evidence,
  };
}
