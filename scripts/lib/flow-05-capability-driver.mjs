/**
 * FLOW-05 · Capability driver (customer journey B1–B8).
 *
 * B1 = Registration (FLOW05-001)
 * B2 = Authentication (FLOW05-002)
 * B3 = Order Creation (FLOW05-003)
 * B4 = Production (FLOW05-004)
 * B5 = Route Planning (FLOW05-005)
 * B6…B8 = not implemented in this delivery
 *
 * Tenant-agnostic — EatClean is the first tenant, not the contract.
 * Rule: each block certifies exactly one state transition.
 */
import { FLOW05_SEGMENTS } from "./flow-05-canonical-pipeline.mjs";
import { runFlow05B1Registration } from "./flow-05-b1-registration.mjs";
import { runFlow05B2Authentication } from "./flow-05-b2-authentication.mjs";
import { runFlow05B3OrderCreation } from "./flow-05-b3-order-creation.mjs";
import { runFlow05B4Production } from "./flow-05-b4-production.mjs";
import { runFlow05B5RoutePlanning } from "./flow-05-b5-route-planning.mjs";

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

  console.info("[FLOW-05]", "FLOW05_B3_STARTED", {
    segment: FLOW05_SEGMENTS[3],
  });
  steps.push("FLOW05_B3_STARTED");

  const b3 = runFlow05B3OrderCreation({ cwd: root });
  evidence.b3_checks = b3.checks;
  if (!b3.ok) {
    console.error("[FLOW-05] B3 FAIL:\n" + b3.reason);
    return { ok: false, steps, reason: b3.reason, evidence };
  }
  evidence.b3_mapped_tokens = b3.mapped_tokens;
  evidence.b3_source = b3.source;

  console.info("[FLOW-05]", "FLOW05_B3_COMPLETED", {
    segment: FLOW05_SEGMENTS[3],
    mapped_tokens: b3.mapped_tokens,
    source: b3.source,
    checks: b3.checks,
  });
  steps.push("FLOW05_B3_COMPLETED");

  if (max < 4) return { ok: true, steps, evidence };

  console.info("[FLOW-05]", "FLOW05_B4_STARTED", {
    segment: FLOW05_SEGMENTS[4],
  });
  steps.push("FLOW05_B4_STARTED");

  const b4 = runFlow05B4Production({ cwd: root });
  evidence.b4_checks = b4.checks;
  if (!b4.ok) {
    console.error("[FLOW-05] B4 FAIL:\n" + b4.reason);
    return { ok: false, steps, reason: b4.reason, evidence };
  }
  evidence.b4_mapped_tokens = b4.mapped_tokens;
  evidence.b4_source = b4.source;

  console.info("[FLOW-05]", "FLOW05_B4_COMPLETED", {
    segment: FLOW05_SEGMENTS[4],
    mapped_tokens: b4.mapped_tokens,
    source: b4.source,
    checks: b4.checks,
  });
  steps.push("FLOW05_B4_COMPLETED");

  if (max < 5) return { ok: true, steps, evidence };

  console.info("[FLOW-05]", "FLOW05_B5_STARTED", {
    segment: FLOW05_SEGMENTS[5],
  });
  steps.push("FLOW05_B5_STARTED");

  const b5 = runFlow05B5RoutePlanning({ cwd: root });
  evidence.b5_checks = b5.checks;
  if (!b5.ok) {
    console.error("[FLOW-05] B5 FAIL:\n" + b5.reason);
    return { ok: false, steps, reason: b5.reason, evidence };
  }
  evidence.b5_mapped_tokens = b5.mapped_tokens;
  evidence.b5_source = b5.source;

  console.info("[FLOW-05]", "FLOW05_B5_COMPLETED", {
    segment: FLOW05_SEGMENTS[5],
    mapped_tokens: b5.mapped_tokens,
    source: b5.source,
    checks: b5.checks,
  });
  steps.push("FLOW05_B5_COMPLETED");

  if (max < 6) return { ok: true, steps, evidence };

  return {
    ok: false,
    steps,
    reason:
      "B6+ block drivers are not implemented — stop at FLOW05-005 (B5 Route Planning only).",
    evidence,
  };
}
