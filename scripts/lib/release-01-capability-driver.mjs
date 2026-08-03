/**
 * RELEASE-01 · Capability driver (product SaaS — blocks P1–P5).
 *
 * P1 = Platform Foundation (Auth · Tenant · RBAC · Profiles · Localization · Settings)
 * P2 = Core Business (Dish Library · Ingredients · Recipes · Customers · Orders)
 * P3…P5 = not implemented in this delivery
 */
import { runRelease01P1PlatformFoundation } from "./release-01-p1-platform-foundation.mjs";
import { runRelease01P2CoreBusiness } from "./release-01-p2-core-business.mjs";

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

  return {
    ok: false,
    steps,
    reason:
      "P3+ capability drivers are not implemented — stop at RELEASE-01-002 (P2 only).",
    evidence,
  };
}
