/**
 * RELEASE-01-BETA · Capability driver (beta acceptance — composes Track B).
 *
 * B1 = Foundation (locks · ps002c-pass · Spec/Gate)
 * B2 = Canonical Flows (flow01–04-pass · B1 CERTIFIED)
 * B3 = Platform Capabilities (smoke · crossflow · e2e-pass · B2 CERTIFIED)
 * B4 = Release Stack (deploy · rollback-pass · B3 CERTIFIED)
 * B5 = Beta Acceptance (future · RELEASE-01-BETA-005)
 */
import { runRelease01BetaB1Foundation } from "./release-01-beta-b1-foundation.mjs";
import { runRelease01BetaB2CanonicalFlows } from "./release-01-beta-b2-canonical-flows.mjs";
import { runRelease01BetaB3PlatformCapabilities } from "./release-01-beta-b3-platform-capabilities.mjs";
import { runRelease01BetaB4ReleaseStack } from "./release-01-beta-b4-release-stack.mjs";

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

  console.info("[RELEASE-01-BETA]", "RELEASE_01_BETA_B2_STARTED", {
    segment: "canonical_flows",
  });
  steps.push("RELEASE_01_BETA_B2_STARTED");

  const b2 = runRelease01BetaB2CanonicalFlows({ cwd: root });
  evidence.b2_checks = b2.checks;
  if (!b2.ok) {
    console.error("[RELEASE-01-BETA] B2 FAIL:\n" + b2.reason);
    return { ok: false, steps, reason: b2.reason, evidence };
  }
  evidence.b2_mapped_tokens = b2.mapped_tokens;
  evidence.b2_source = b2.source;

  console.info("[RELEASE-01-BETA]", "RELEASE_01_BETA_B2_COMPLETED", {
    segment: "canonical_flows",
    mapped_tokens: b2.mapped_tokens,
    source: b2.source,
    checks: b2.checks,
  });
  steps.push("RELEASE_01_BETA_B2_COMPLETED");

  if (max < 3) return { ok: true, steps, evidence };

  console.info("[RELEASE-01-BETA]", "RELEASE_01_BETA_B3_STARTED", {
    segment: "platform_capabilities",
  });
  steps.push("RELEASE_01_BETA_B3_STARTED");

  const b3 = runRelease01BetaB3PlatformCapabilities({ cwd: root });
  evidence.b3_checks = b3.checks;
  if (!b3.ok) {
    console.error("[RELEASE-01-BETA] B3 FAIL:\n" + b3.reason);
    return { ok: false, steps, reason: b3.reason, evidence };
  }
  evidence.b3_mapped_tokens = b3.mapped_tokens;
  evidence.b3_source = b3.source;

  console.info("[RELEASE-01-BETA]", "RELEASE_01_BETA_B3_COMPLETED", {
    segment: "platform_capabilities",
    mapped_tokens: b3.mapped_tokens,
    source: b3.source,
    checks: b3.checks,
  });
  steps.push("RELEASE_01_BETA_B3_COMPLETED");

  if (max < 4) return { ok: true, steps, evidence };

  console.info("[RELEASE-01-BETA]", "RELEASE_01_BETA_B4_STARTED", {
    segment: "release_stack",
  });
  steps.push("RELEASE_01_BETA_B4_STARTED");

  const b4 = runRelease01BetaB4ReleaseStack({ cwd: root });
  evidence.b4_checks = b4.checks;
  if (!b4.ok) {
    console.error("[RELEASE-01-BETA] B4 FAIL:\n" + b4.reason);
    return { ok: false, steps, reason: b4.reason, evidence };
  }
  evidence.b4_mapped_tokens = b4.mapped_tokens;
  evidence.b4_source = b4.source;

  console.info("[RELEASE-01-BETA]", "RELEASE_01_BETA_B4_COMPLETED", {
    segment: "release_stack",
    mapped_tokens: b4.mapped_tokens,
    source: b4.source,
    checks: b4.checks,
  });
  steps.push("RELEASE_01_BETA_B4_COMPLETED");

  if (max < 5) return { ok: true, steps, evidence };

  return {
    ok: false,
    steps,
    reason:
      "B5 Beta Acceptance driver not implemented (RELEASE-01-BETA-005). Do not invent Acceptance.",
    evidence,
  };
}
