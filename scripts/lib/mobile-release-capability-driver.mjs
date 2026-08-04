/**
 * MOBILE-RELEASE · Capability driver (MR1–MR5).
 *
 * MR1 = Preparation (MR01-001)
 * MR2 = Android Build (MR01-002)
 * MR3 = Android Signing (MR01-003)
 * MR4…MR5 = not implemented in this delivery
 *
 * Tenant-agnostic — Core SaaS → Capacitor → private delivery.
 * Core Integrity Rule: Mobile Release does not alter Core SaaS behavior.
 */
import { MOBILE_RELEASE_SEGMENTS } from "./mobile-release-canonical-pipeline.mjs";
import { runMobileReleaseMr1Preparation } from "./mobile-release-mr1-preparation.mjs";
import { runMobileReleaseMr2AndroidBuild } from "./mobile-release-mr2-android-build.mjs";
import { runMobileReleaseMr3AndroidSigning } from "./mobile-release-mr3-android-signing.mjs";

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

  console.info("[MOBILE-RELEASE]", "MOBILE_RELEASE_MR2_STARTED", {
    segment: MOBILE_RELEASE_SEGMENTS[2],
  });
  steps.push("MOBILE_RELEASE_MR2_STARTED");

  const mr2 = runMobileReleaseMr2AndroidBuild({ cwd: root });
  evidence.mr2_checks = mr2.checks;
  if (!mr2.ok) {
    console.error("[MOBILE-RELEASE] MR2 FAIL:\n" + mr2.reason);
    return { ok: false, steps, reason: mr2.reason, evidence };
  }
  evidence.mr2_mapped_tokens = mr2.mapped_tokens;
  evidence.mr2_source = mr2.source;
  evidence.mr2_artifacts = mr2.artifacts ?? null;

  console.info("[MOBILE-RELEASE]", "MOBILE_RELEASE_MR2_COMPLETED", {
    segment: MOBILE_RELEASE_SEGMENTS[2],
    mapped_tokens: mr2.mapped_tokens,
    source: mr2.source,
    checks: mr2.checks,
  });
  steps.push("MOBILE_RELEASE_MR2_COMPLETED");

  if (max < 3) return { ok: true, steps, evidence };

  console.info("[MOBILE-RELEASE]", "MOBILE_RELEASE_MR3_STARTED", {
    segment: MOBILE_RELEASE_SEGMENTS[3],
  });
  steps.push("MOBILE_RELEASE_MR3_STARTED");

  const mr3 = runMobileReleaseMr3AndroidSigning({ cwd: root });
  evidence.mr3_checks = mr3.checks;
  if (!mr3.ok) {
    console.error("[MOBILE-RELEASE] MR3 FAIL:\n" + mr3.reason);
    return { ok: false, steps, reason: mr3.reason, evidence };
  }
  evidence.mr3_mapped_tokens = mr3.mapped_tokens;
  evidence.mr3_source = mr3.source;
  evidence.mr3_signing = mr3.signing ?? null;

  console.info("[MOBILE-RELEASE]", "MOBILE_RELEASE_MR3_COMPLETED", {
    segment: MOBILE_RELEASE_SEGMENTS[3],
    mapped_tokens: mr3.mapped_tokens,
    source: mr3.source,
    checks: mr3.checks,
  });
  steps.push("MOBILE_RELEASE_MR3_COMPLETED");

  if (max < 4) return { ok: true, steps, evidence };

  return {
    ok: false,
    steps,
    reason:
      "MR4 block driver is not implemented — stop at MR01-003 (Android Signing only).",
    evidence,
  };
}
