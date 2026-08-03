/**
 * FLOW-05 · Capability driver (customer journey B1–B8).
 *
 * B1 = Registration (FLOW05-001)
 * B2 = Authentication (FLOW05-002)
 * B3…B8 = not implemented in this delivery
 *
 * Tenant-agnostic — EatClean is the first tenant, not the contract.
 */
import { FLOW05_SEGMENTS } from "./flow-05-canonical-pipeline.mjs";
import { runFlow05B1Registration } from "./flow-05-b1-registration.mjs";
import { runFlow05B2Authentication } from "./flow-05-b2-authentication.mjs";

/**
 * @param {{ root: string, through?: 1|2|3|4|5|6|7|8 | 0 | null }} opts
 * @returns {{ ok: boolean, steps: string[], reason?: string, evidence?: Record<string, unknown> }}
 */
export function runFlow05CapabilityDriver({ root, through = null }) {
  const max = through ?? 0;
  /** @type {string[]} */
  const steps = [];
  /** @type {Record<string, unknown>} */
  const evidence = { segments: FLOW05_SEGMENTS };

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

  console.info("[FLOW-05]", "FLOW05_B1_STARTED", {
    segment: FLOW05_SEGMENTS[1],
  });
  steps.push("FLOW05_B1_STARTED");

  const b1 = runFlow05B1Registration({ cwd: root });
  evidence.b1_checks = b1.checks;
  if (!b1.ok) {
    console.error("[FLOW-05] B1 FAIL:\n" + b1.reason);
    return { ok: false, steps, reason: b1.reason, evidence };
  }
  evidence.b1_mapped_tokens = b1.mapped_tokens;
  evidence.b1_source = b1.source;

  console.info("[FLOW-05]", "FLOW05_B1_COMPLETED", {
    segment: FLOW05_SEGMENTS[1],
    mapped_tokens: b1.mapped_tokens,
    source: b1.source,
    checks: b1.checks,
  });
  steps.push("FLOW05_B1_COMPLETED");

  if (max < 2) return { ok: true, steps, evidence };

  console.info("[FLOW-05]", "FLOW05_B2_STARTED", {
    segment: FLOW05_SEGMENTS[2],
  });
  steps.push("FLOW05_B2_STARTED");

  const b2 = runFlow05B2Authentication({ cwd: root });
  evidence.b2_checks = b2.checks;
  if (!b2.ok) {
    console.error("[FLOW-05] B2 FAIL:\n" + b2.reason);
    return { ok: false, steps, reason: b2.reason, evidence };
  }
  evidence.b2_mapped_tokens = b2.mapped_tokens;
  evidence.b2_source = b2.source;

  console.info("[FLOW-05]", "FLOW05_B2_COMPLETED", {
    segment: FLOW05_SEGMENTS[2],
    mapped_tokens: b2.mapped_tokens,
    source: b2.source,
    checks: b2.checks,
  });
  steps.push("FLOW05_B2_COMPLETED");

  if (max < 3) return { ok: true, steps, evidence };

  return {
    ok: false,
    steps,
    reason:
      "B3+ block drivers are not implemented — stop at FLOW05-002 (B2 Authentication only).",
    evidence,
  };
}
