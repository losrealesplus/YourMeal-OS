/**
 * RELEASE-DEPLOY · Capability driver (reproducible deploy — not Smoke/E2E re-run).
 *
 * D1 = Deploy Preflight (release-e2e-pass + Spec/Gate)
 * D2 = Publish / Apply (future · RELEASE-DEPLOY-002)
 * D3 = Post-deploy Verify (future · RELEASE-DEPLOY-003)
 */
import { runReleaseDeployD1Preflight } from "./release-deploy-d1-preflight.mjs";

/**
 * @param {{ root: string, through?: 1|2|3 | null }} opts
 * @returns {{ ok: boolean, steps: string[], reason?: string, evidence?: Record<string, unknown> }}
 */
export function runReleaseDeployCapabilityDriver({ root, through = null }) {
  const max = through ?? 0;
  /** @type {string[]} */
  const steps = [];
  /** @type {Record<string, unknown>} */
  const evidence = {};

  if (max < 1) {
    return {
      ok: false,
      steps,
      reason: "Capability driver invoked with through < D1",
    };
  }

  console.info("[RELEASE-DEPLOY]", "RELEASE_DEPLOY_D1_STARTED", {
    segment: "preflight",
  });
  steps.push("RELEASE_DEPLOY_D1_STARTED");

  const d1 = runReleaseDeployD1Preflight({ cwd: root });
  evidence.d1_checks = d1.checks;
  if (!d1.ok) {
    console.error("[RELEASE-DEPLOY] D1 FAIL:\n" + d1.reason);
    return { ok: false, steps, reason: d1.reason, evidence };
  }
  evidence.d1_mapped_tokens = d1.mapped_tokens;
  evidence.d1_source = d1.source;

  console.info("[RELEASE-DEPLOY]", "RELEASE_DEPLOY_D1_COMPLETED", {
    segment: "preflight",
    mapped_tokens: d1.mapped_tokens,
    source: d1.source,
    checks: d1.checks,
  });
  steps.push("RELEASE_DEPLOY_D1_COMPLETED");

  if (max < 2) return { ok: true, steps, evidence };

  return {
    ok: false,
    steps,
    reason:
      "D2 Publish/Apply driver not implemented (RELEASE-DEPLOY-002). Do not invent publish.",
    evidence,
  };
}
