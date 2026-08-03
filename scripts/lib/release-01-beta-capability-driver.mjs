/**
 * RELEASE-01-BETA · Capability driver (beta acceptance — composes Track B).
 *
 * B1 = Foundation (locks · ps002c-pass · Spec/Gate)
 * B2 = Canonical Flows (future · RELEASE-01-BETA-002)
 * B3 = Platform Capabilities (future · RELEASE-01-BETA-003)
 * B4 = Release Stack (future · RELEASE-01-BETA-004)
 * B5 = Beta Acceptance (future · RELEASE-01-BETA-005)
 */
import { runRelease01BetaB1Foundation } from "./release-01-beta-b1-foundation.mjs";

/**
 * @param {{ root: string, through?: 1|2|3|4|5 | null }} opts
 * @returns {{ ok: boolean, steps: string[], reason?: string, evidence?: Record<string, unknown> }}
 */
export function runRelease01BetaCapabilityDriver({ root, through = null }) {
  const max = through ?? 0;
  /** @type {string[]} */
  const steps = [];
  /** @type {Record<string, unknown>} */
  const evidence = {};

  if (max < 1) {
    return {
      ok: false,
      steps,
      reason: "Capability driver invoked with through < B1",
    };
  }

  console.info("[RELEASE-01-BETA]", "RELEASE_01_BETA_B1_STARTED", {
    segment: "foundation",
  });
  steps.push("RELEASE_01_BETA_B1_STARTED");

  const b1 = runRelease01BetaB1Foundation({ cwd: root });
  evidence.b1_checks = b1.checks;
  if (!b1.ok) {
    console.error("[RELEASE-01-BETA] B1 FAIL:\n" + b1.reason);
    return { ok: false, steps, reason: b1.reason, evidence };
  }
  evidence.b1_mapped_tokens = b1.mapped_tokens;
  evidence.b1_source = b1.source;

  console.info("[RELEASE-01-BETA]", "RELEASE_01_BETA_B1_COMPLETED", {
    segment: "foundation",
    mapped_tokens: b1.mapped_tokens,
    source: b1.source,
    checks: b1.checks,
  });
  steps.push("RELEASE_01_BETA_B1_COMPLETED");

  if (max < 2) return { ok: true, steps, evidence };

  return {
    ok: false,
    steps,
    reason:
      "B2 Canonical Flows driver not implemented (RELEASE-01-BETA-002). Do not invent Flow re-runs.",
    evidence,
  };
}
