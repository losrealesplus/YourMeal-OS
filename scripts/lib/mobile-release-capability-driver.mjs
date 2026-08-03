/**
 * MOBILE-RELEASE · Capability driver (MR1–MR5).
 *
 * MR1 = Preparation (MR01-001)
 * MR2…MR5 = not implemented in this delivery
 *
 * Tenant-agnostic — Core SaaS → Capacitor → private delivery.
 * Core Integrity Rule: Mobile Release does not alter Core SaaS behavior.
 */
import { MOBILE_RELEASE_SEGMENTS } from "./mobile-release-canonical-pipeline.mjs";
import { runMobileReleaseMr1Preparation } from "./mobile-release-mr1-preparation.mjs";

/**
 * @param {{ root: string, through?: 1|2|3|4|5 | 0 | null }} opts
 * @returns {{ ok: boolean, steps: string[], reason?: string, evidence?: Record<string, unknown> }}
 */
export function runMobileReleaseCapabilityDriver({ root, through = null }) {
  const max = through ?? 0;
  /** @type {string[]} */
  const steps = [];
  /** @type {Record<string, unknown>} */
  const evidence = { segments: MOBILE_RELEASE_SEGMENTS };

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

  console.info("[MOBILE-RELEASE]", "MOBILE_RELEASE_MR1_STARTED", {
    segment: MOBILE_RELEASE_SEGMENTS[1],
  });
  steps.push("MOBILE_RELEASE_MR1_STARTED");

  const mr1 = runMobileReleaseMr1Preparation({ cwd: root });
  evidence.mr1_checks = mr1.checks;
  if (!mr1.ok) {
    console.error("[MOBILE-RELEASE] MR1 FAIL:\n" + mr1.reason);
    return { ok: false, steps, reason: mr1.reason, evidence };
  }
  evidence.mr1_mapped_tokens = mr1.mapped_tokens;
  evidence.mr1_source = mr1.source;

  console.info("[MOBILE-RELEASE]", "MOBILE_RELEASE_MR1_COMPLETED", {
    segment: MOBILE_RELEASE_SEGMENTS[1],
    mapped_tokens: mr1.mapped_tokens,
    source: mr1.source,
    checks: mr1.checks,
  });
  steps.push("MOBILE_RELEASE_MR1_COMPLETED");

  if (max < 2) return { ok: true, steps, evidence };

  return {
    ok: false,
    steps,
    reason:
      "MR2 block driver is not implemented — stop at MR01-001 (Preparation only).",
    evidence,
  };
}
