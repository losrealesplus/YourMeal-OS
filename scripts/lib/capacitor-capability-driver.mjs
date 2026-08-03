/**
 * Capacitor · Capability driver (Distribution C1–C5).
 *
 * C1 = Platform Preparation (CAPACITOR-001)
 * C2 = Native Shell (CAPACITOR-002)
 * C3 = Android Platform (CAPACITOR-003)
 * C4 = iOS Platform (CAPACITOR-004)
 * C5 = Acceptance / Distribution Certified (CAPACITOR-005)
 *
 * Tenant-agnostic — Core SaaS → Capacitor → Android / iOS.
 * Core Integrity Rule: Distribution does not alter Core SaaS behavior.
 * Rule: each block certifies exactly one Distribution state transition.
 */
import { CAPACITOR_SEGMENTS } from "./capacitor-canonical-pipeline.mjs";
import { runCapacitorC1PlatformPreparation } from "./capacitor-c1-platform-preparation.mjs";
import { runCapacitorC2NativeShell } from "./capacitor-c2-native-shell.mjs";
import { runCapacitorC3AndroidPlatform } from "./capacitor-c3-android-platform.mjs";
import { runCapacitorC4IosPlatform } from "./capacitor-c4-ios-platform.mjs";
import { runCapacitorC5Acceptance } from "./capacitor-c5-acceptance.mjs";

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

  console.info("[CAPACITOR]", "CAPACITOR_C2_STARTED", {
    segment: CAPACITOR_SEGMENTS[2],
  });
  steps.push("CAPACITOR_C2_STARTED");

  const c2 = runCapacitorC2NativeShell({ cwd: root });
  evidence.c2_checks = c2.checks;
  if (!c2.ok) {
    console.error("[CAPACITOR] C2 FAIL:\n" + c2.reason);
    return { ok: false, steps, reason: c2.reason, evidence };
  }
  evidence.c2_mapped_tokens = c2.mapped_tokens;
  evidence.c2_source = c2.source;

  console.info("[CAPACITOR]", "CAPACITOR_C2_COMPLETED", {
    segment: CAPACITOR_SEGMENTS[2],
    mapped_tokens: c2.mapped_tokens,
    source: c2.source,
    checks: c2.checks,
  });
  steps.push("CAPACITOR_C2_COMPLETED");

  if (max < 3) return { ok: true, steps, evidence };

  console.info("[CAPACITOR]", "CAPACITOR_C3_STARTED", {
    segment: CAPACITOR_SEGMENTS[3],
  });
  steps.push("CAPACITOR_C3_STARTED");

  const c3 = runCapacitorC3AndroidPlatform({ cwd: root });
  evidence.c3_checks = c3.checks;
  if (!c3.ok) {
    console.error("[CAPACITOR] C3 FAIL:\n" + c3.reason);
    return { ok: false, steps, reason: c3.reason, evidence };
  }
  evidence.c3_mapped_tokens = c3.mapped_tokens;
  evidence.c3_source = c3.source;

  console.info("[CAPACITOR]", "CAPACITOR_C3_COMPLETED", {
    segment: CAPACITOR_SEGMENTS[3],
    mapped_tokens: c3.mapped_tokens,
    source: c3.source,
    checks: c3.checks,
  });
  steps.push("CAPACITOR_C3_COMPLETED");

  if (max < 4) return { ok: true, steps, evidence };

  console.info("[CAPACITOR]", "CAPACITOR_C4_STARTED", {
    segment: CAPACITOR_SEGMENTS[4],
  });
  steps.push("CAPACITOR_C4_STARTED");

  const c4 = runCapacitorC4IosPlatform({ cwd: root });
  evidence.c4_checks = c4.checks;
  if (!c4.ok) {
    console.error("[CAPACITOR] C4 FAIL:\n" + c4.reason);
    return { ok: false, steps, reason: c4.reason, evidence };
  }
  evidence.c4_mapped_tokens = c4.mapped_tokens;
  evidence.c4_source = c4.source;

  console.info("[CAPACITOR]", "CAPACITOR_C4_COMPLETED", {
    segment: CAPACITOR_SEGMENTS[4],
    mapped_tokens: c4.mapped_tokens,
    source: c4.source,
    checks: c4.checks,
  });
  steps.push("CAPACITOR_C4_COMPLETED");

  if (max < 5) return { ok: true, steps, evidence };

  console.info("[CAPACITOR]", "CAPACITOR_C5_STARTED", {
    segment: CAPACITOR_SEGMENTS[5],
  });
  steps.push("CAPACITOR_C5_STARTED");

  const c5 = runCapacitorC5Acceptance({ cwd: root });
  evidence.c5_checks = c5.checks;
  if (!c5.ok) {
    console.error("[CAPACITOR] C5 FAIL:\n" + c5.reason);
    return { ok: false, steps, reason: c5.reason, evidence };
  }
  evidence.c5_mapped_tokens = c5.mapped_tokens;
  evidence.c5_source = c5.source;

  console.info("[CAPACITOR]", "CAPACITOR_C5_COMPLETED", {
    segment: CAPACITOR_SEGMENTS[5],
    mapped_tokens: c5.mapped_tokens,
    source: c5.source,
    checks: c5.checks,
  });
  steps.push("CAPACITOR_C5_COMPLETED");

  return { ok: true, steps, evidence };
}
