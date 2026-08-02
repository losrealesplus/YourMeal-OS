/**
 * RELEASE-ROLLBACK · Capability driver (controlled recovery — not Deploy/E2E re-run).
 *
 * R1 = Detect / Decide (release-deploy-pass + Spec/Gate)
 * R2 = Execute Rollback / Restore (R1 CERTIFIED + execute procedure + deploy tip)
 * R3 = Post-rollback Verify (R2 CERTIFIED + verify procedure + preview surface)
 */
import { runReleaseRollbackR1DetectDecide } from "./release-rollback-r1-detect-decide.mjs";
import { runReleaseRollbackR2ExecuteRestore } from "./release-rollback-r2-execute-restore.mjs";
import { runReleaseRollbackR3PostRollbackVerify } from "./release-rollback-r3-post-rollback-verify.mjs";

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

  console.info("[RELEASE-ROLLBACK]", "RELEASE_ROLLBACK_R3_STARTED", {
    segment: "post_rollback_verify",
  });
  steps.push("RELEASE_ROLLBACK_R3_STARTED");

  const r3 = runReleaseRollbackR3PostRollbackVerify({ cwd: root });
  evidence.r3_checks = r3.checks;
  if (!r3.ok) {
    console.error("[RELEASE-ROLLBACK] R3 FAIL:\n" + r3.reason);
    return { ok: false, steps, reason: r3.reason, evidence };
  }
  evidence.r3_mapped_tokens = r3.mapped_tokens;
  evidence.r3_source = r3.source;

  console.info("[RELEASE-ROLLBACK]", "RELEASE_ROLLBACK_R3_COMPLETED", {
    segment: "post_rollback_verify",
    mapped_tokens: r3.mapped_tokens,
    source: r3.source,
    checks: r3.checks,
  });
  steps.push("RELEASE_ROLLBACK_R3_COMPLETED");

  return { ok: true, steps, evidence };
}
