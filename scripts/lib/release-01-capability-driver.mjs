/**
 * RELEASE-01 · Capability driver (product SaaS — blocks P1–P5).
 *
 * P1 = Platform Foundation (Auth · Tenant · RBAC · Profiles · Localization · Settings)
 * P2…P5 = not implemented in this delivery
 */
import { runRelease01P1PlatformFoundation } from "./release-01-p1-platform-foundation.mjs";

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

  return {
    ok: false,
    steps,
    reason:
      "P2+ capability drivers are not implemented — stop at RELEASE-01-001 (P1 only).",
    evidence,
  };
}
