/**
 * RELEASE-E2E · Capability driver (pilot journey — not Smoke/Cross-flow re-run).
 *
 * E1 = Platform Entry (RELEASE-SMOKE)
 * E2…E4 = not implemented in RELEASE-E2E-001
 */
import { runReleaseE2eE1PlatformEntry } from "./release-e2e-e1-platform-entry.mjs";

/**
 * @param {{ root: string, through?: 1|2|3|4 | null }} opts
 * @returns {{ ok: boolean, steps: string[], reason?: string, evidence?: Record<string, unknown> }}
 */
export function runReleaseE2eCapabilityDriver({ root, through = null }) {
  const max = through ?? 0;
  /** @type {string[]} */
  const steps = [];
  /** @type {Record<string, unknown>} */
  const evidence = {};

  if (max < 1) {
    return {
      ok: false,
      steps,
      reason: "Capability driver invoked with through < E1",
    };
  }

  console.info("[RELEASE-E2E]", "RELEASE_E2E_E1_STARTED", {
    segment: "platform_entry",
  });
  steps.push("RELEASE_E2E_E1_STARTED");

  const e1 = runReleaseE2eE1PlatformEntry({ cwd: root });
  evidence.e1_checks = e1.checks;
  if (!e1.ok) {
    console.error("[RELEASE-E2E] E1 FAIL:\n" + e1.reason);
    return { ok: false, steps, reason: e1.reason, evidence };
  }
  evidence.e1_mapped_tokens = e1.mapped_tokens;
  evidence.e1_source = e1.source;

  console.info("[RELEASE-E2E]", "RELEASE_E2E_E1_COMPLETED", {
    segment: "platform_entry",
    mapped_tokens: e1.mapped_tokens,
    source: e1.source,
    checks: e1.checks,
  });
  steps.push("RELEASE_E2E_E1_COMPLETED");

  if (max < 2) return { ok: true, steps, evidence };

  return {
    ok: false,
    steps,
    reason:
      "RELEASE-E2E E2+ not implemented (E1 only · Evidence before Implementation)",
    evidence,
  };
}
