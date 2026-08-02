/**
 * RELEASE-SMOKE · Capability driver (platform — not domain).
 *
 * Emits [RELEASE-SMOKE] RELEASE_SMOKE_S* tokens for certified scenarios.
 * S1 = preflight only in RELEASE-SMOKE-001.
 */
import {
  runReleaseSmokeS1Preflight,
} from "./release-smoke-s1-preflight.mjs";

/**
 * @param {{ root: string, through?: 1|2|3|4 | null }} opts
 * @returns {{ ok: boolean, steps: string[], reason?: string, evidence?: Record<string, unknown> }}
 */
export function runReleaseSmokeCapabilityDriver({ root, through = null }) {
  const max = through ?? 0;
  /** @type {string[]} */
  const steps = [];
  /** @type {Record<string, unknown>} */
  const evidence = {};

  if (max < 1) {
    return {
      ok: false,
      steps,
      reason: "Capability driver invoked with through < S1",
    };
  }

  // —— S1 · Preflight ——
  console.info("[RELEASE-SMOKE]", "RELEASE_SMOKE_S1_STARTED", {
    capability: "preflight",
  });
  steps.push("RELEASE_SMOKE_S1_STARTED");

  const s1 = runReleaseSmokeS1Preflight({ cwd: root });
  evidence.s1_checks = s1.checks;
  if (!s1.ok) {
    console.error("[RELEASE-SMOKE] S1 preflight FAIL:\n" + s1.reason);
    return {
      ok: false,
      steps,
      reason: s1.reason,
      evidence,
    };
  }

  console.info("[RELEASE-SMOKE]", "RELEASE_SMOKE_S1_COMPLETED", {
    capability: "preflight",
    checks: s1.checks,
  });
  steps.push("RELEASE_SMOKE_S1_COMPLETED");

  // S2–S4 intentionally not implemented in RELEASE-SMOKE-001
  if (max >= 2) {
    return {
      ok: false,
      steps,
      reason:
        "RELEASE-SMOKE S2+ not implemented (RELEASE-SMOKE-001 scope is S1 only)",
      evidence,
    };
  }

  return { ok: true, steps, evidence };
}
