/**
 * RELEASE-ROLLBACK · Capability driver (controlled recovery — not Deploy/E2E re-run).
 *
 * R1 = Detect / Decide (release-deploy-pass + Spec/Gate)
 * R2 = Execute Rollback / Restore (R1 CERTIFIED + execute procedure + deploy tip)
 * R3 = Post-rollback Verify (future · RELEASE-ROLLBACK-003)
 */
import { runReleaseRollbackR1DetectDecide } from "./release-rollback-r1-detect-decide.mjs";
import { runReleaseRollbackR2ExecuteRestore } from "./release-rollback-r2-execute-restore.mjs";

/**
 * @param {{ root: string, through?: 1|2|3 | null }} opts
 * @returns {{ ok: boolean, steps: string[], reason?: string, evidence?: Record<string, unknown> }}
 */
export function runReleaseRollbackCapabilityDriver({ root, through = null }) {
  const max = through ?? 0;
  /** @type {string[]} */
  const steps = [];
  /** @type {Record<string, unknown>} */
  const evidence = {};

  if (max < 1) {
    return {
      ok: false,
      steps,
      reason: "Capability driver invoked with through < R1",
    };
  }

  console.info("[RELEASE-ROLLBACK]", "RELEASE_ROLLBACK_R1_STARTED", {
    segment: "detect_decide",
  });
  steps.push("RELEASE_ROLLBACK_R1_STARTED");

  const r1 = runReleaseRollbackR1DetectDecide({ cwd: root });
  evidence.r1_checks = r1.checks;
  if (!r1.ok) {
    console.error("[RELEASE-ROLLBACK] R1 FAIL:\n" + r1.reason);
    return { ok: false, steps, reason: r1.reason, evidence };
  }
  evidence.r1_mapped_tokens = r1.mapped_tokens;
  evidence.r1_source = r1.source;

  console.info("[RELEASE-ROLLBACK]", "RELEASE_ROLLBACK_R1_COMPLETED", {
    segment: "detect_decide",
    mapped_tokens: r1.mapped_tokens,
    source: r1.source,
    checks: r1.checks,
  });
  steps.push("RELEASE_ROLLBACK_R1_COMPLETED");

  if (max < 2) return { ok: true, steps, evidence };

  console.info("[RELEASE-ROLLBACK]", "RELEASE_ROLLBACK_R2_STARTED", {
    segment: "execute_rollback_restore",
  });
  steps.push("RELEASE_ROLLBACK_R2_STARTED");

  const r2 = runReleaseRollbackR2ExecuteRestore({ cwd: root });
  evidence.r2_checks = r2.checks;
  if (!r2.ok) {
    console.error("[RELEASE-ROLLBACK] R2 FAIL:\n" + r2.reason);
    return { ok: false, steps, reason: r2.reason, evidence };
  }
  evidence.r2_mapped_tokens = r2.mapped_tokens;
  evidence.r2_source = r2.source;

  console.info("[RELEASE-ROLLBACK]", "RELEASE_ROLLBACK_R2_COMPLETED", {
    segment: "execute_rollback_restore",
    mapped_tokens: r2.mapped_tokens,
    source: r2.source,
    checks: r2.checks,
  });
  steps.push("RELEASE_ROLLBACK_R2_COMPLETED");

  if (max < 3) return { ok: true, steps, evidence };

  return {
    ok: false,
    steps,
    reason:
      "R3 Post-rollback Verify driver not implemented (RELEASE-ROLLBACK-003). Do not invent verify.",
    evidence,
  };
}
