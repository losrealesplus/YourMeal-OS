/**
 * RELEASE-01 · Capability driver (product SaaS — blocks P1–P5).
 *
 * P1 = Platform Foundation
 * P2 = Core Business
 * P3 = Operations
 * P4 = Administration (Billing · Reports · Notifications · Audit · Configuration)
 * P5 = not implemented in this delivery
 */
import { runRelease01P1PlatformFoundation } from "./release-01-p1-platform-foundation.mjs";
import { runRelease01P2CoreBusiness } from "./release-01-p2-core-business.mjs";
import { runRelease01P3Operations } from "./release-01-p3-operations.mjs";
import { runRelease01P4Administration } from "./release-01-p4-administration.mjs";

/**
 * @param {{ root: string, through?: 1|2|3|4|5 | null }} opts
 * @returns {{ ok: boolean, steps: string[], reason?: string, evidence?: Record<string, unknown> }}
 */
export function runRelease01CapabilityDriver({ root, through = null }) {
  const max = through ?? 0;
  /** @type {string[]} */
  const steps = [];
  /** @type {Record<string, unknown>} */
  const evidence = {};

  if (max < 1) {
    return {
      ok: false,
      steps,
      reason: "Capability driver invoked with through < P1",
    };
  }

  console.info("[RELEASE-01]", "RELEASE_01_P1_STARTED", {
    segment: "platform_foundation",
  });
  steps.push("RELEASE_01_P1_STARTED");

  const p1 = runRelease01P1PlatformFoundation({ cwd: root });
  evidence.p1_checks = p1.checks;
  if (!p1.ok) {
    console.error("[RELEASE-01] P1 FAIL:\n" + p1.reason);
    return { ok: false, steps, reason: p1.reason, evidence };
  }
  evidence.p1_mapped_tokens = p1.mapped_tokens;
  evidence.p1_source = p1.source;

  console.info("[RELEASE-01]", "RELEASE_01_P1_COMPLETED", {
    segment: "platform_foundation",
    mapped_tokens: p1.mapped_tokens,
    source: p1.source,
    checks: p1.checks,
  });
  steps.push("RELEASE_01_P1_COMPLETED");

  if (max < 2) return { ok: true, steps, evidence };

  console.info("[RELEASE-01]", "RELEASE_01_P2_STARTED", {
    segment: "core_business",
  });
  steps.push("RELEASE_01_P2_STARTED");

  const p2 = runRelease01P2CoreBusiness({ cwd: root });
  evidence.p2_checks = p2.checks;
  if (!p2.ok) {
    console.error("[RELEASE-01] P2 FAIL:\n" + p2.reason);
    return { ok: false, steps, reason: p2.reason, evidence };
  }
  evidence.p2_mapped_tokens = p2.mapped_tokens;
  evidence.p2_source = p2.source;

  console.info("[RELEASE-01]", "RELEASE_01_P2_COMPLETED", {
    segment: "core_business",
    mapped_tokens: p2.mapped_tokens,
    source: p2.source,
    checks: p2.checks,
  });
  steps.push("RELEASE_01_P2_COMPLETED");

  if (max < 3) return { ok: true, steps, evidence };

  console.info("[RELEASE-01]", "RELEASE_01_P3_STARTED", {
    segment: "operations",
  });
  steps.push("RELEASE_01_P3_STARTED");

  const p3 = runRelease01P3Operations({ cwd: root });
  evidence.p3_checks = p3.checks;
  if (!p3.ok) {
    console.error("[RELEASE-01] P3 FAIL:\n" + p3.reason);
    return { ok: false, steps, reason: p3.reason, evidence };
  }
  evidence.p3_mapped_tokens = p3.mapped_tokens;
  evidence.p3_source = p3.source;

  console.info("[RELEASE-01]", "RELEASE_01_P3_COMPLETED", {
    segment: "operations",
    mapped_tokens: p3.mapped_tokens,
    source: p3.source,
    checks: p3.checks,
  });
  steps.push("RELEASE_01_P3_COMPLETED");

  if (max < 4) return { ok: true, steps, evidence };

  console.info("[RELEASE-01]", "RELEASE_01_P4_STARTED", {
    segment: "administration",
  });
  steps.push("RELEASE_01_P4_STARTED");

  const p4 = runRelease01P4Administration({ cwd: root });
  evidence.p4_checks = p4.checks;
  if (!p4.ok) {
    console.error("[RELEASE-01] P4 FAIL:\n" + p4.reason);
    return { ok: false, steps, reason: p4.reason, evidence };
  }
  evidence.p4_mapped_tokens = p4.mapped_tokens;
  evidence.p4_source = p4.source;

  console.info("[RELEASE-01]", "RELEASE_01_P4_COMPLETED", {
    segment: "administration",
    mapped_tokens: p4.mapped_tokens,
    source: p4.source,
    checks: p4.checks,
  });
  steps.push("RELEASE_01_P4_COMPLETED");

  if (max < 5) return { ok: true, steps, evidence };

  return {
    ok: false,
    steps,
    reason:
      "P5+ capability drivers are not implemented — stop at RELEASE-01-004 (P4 only).",
    evidence,
  };
}
