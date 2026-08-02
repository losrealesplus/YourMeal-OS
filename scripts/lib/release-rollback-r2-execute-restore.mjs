/**
 * RELEASE-ROLLBACK · R2 Execute Rollback / Restore.
 *
 * Certifies the frozen execute/restore procedure for the deployed platform:
 *   R1 CERTIFIED + RELEASE_ROLLBACK_EXECUTE + release-deploy-pass tip
 *
 * Does NOT run remote restore. Does NOT open R3.
 * Does NOT touch CI, infra secrets, FLOW-05, or release-01-beta.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const RELEASE_ROLLBACK_R2_PRECONDITIONS = Object.freeze([
  "release_rollback_r1_acta_certified",
  "release_rollback_execute_procedure_present",
  "release_deploy_pass_tag_present",
  "release_rollback_runner_present",
]);

/**
 * @typedef {{
 *   ok: true,
 *   checks: string[],
 *   mapped_tokens: string[],
 *   source: string,
 * } | {
 *   ok: false,
 *   reason: string,
 *   checks: string[],
 * }} R2Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {R2Result}
 */
export function runReleaseRollbackR2ExecuteRestore(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const r1Acta = path.join(
    cwd,
    "docs/10-validation/release-rollback/RELEASE_ROLLBACK_001_R1_ACTA.md",
  );
  if (!fs.existsSync(r1Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_ROLLBACK_001_R1_ACTA.md — R2 requires R1 CERTIFIED.",
    };
  }
  const r1Text = fs.readFileSync(r1Acta, "utf8");
  if (!/CERTIFIED desde `main`/i.test(r1Text)) {
    return {
      ok: false,
      checks,
      reason:
        "RELEASE_ROLLBACK_001_R1_ACTA.md is not CERTIFIED from main — Land Check R1 first.",
    };
  }
  checks.push("release_rollback_r1_acta_certified");

  const executePath = path.join(
    cwd,
    "docs/10-validation/release-rollback/RELEASE_ROLLBACK_EXECUTE.md",
  );
  if (!fs.existsSync(executePath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_ROLLBACK_EXECUTE.md (canonical execute/restore procedure).",
    };
  }
  const executeText = fs.readFileSync(executePath, "utf8");
  if (
    !/Canonical steps/i.test(executeText) ||
    !/release-deploy-pass/.test(executeText) ||
    !/RELEASE_ROLLBACK_R2_/.test(executeText)
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "RELEASE_ROLLBACK_EXECUTE.md is incomplete.",
        "Expected Canonical steps, release-deploy-pass, and RELEASE_ROLLBACK_R2_ markers.",
      ].join("\n"),
    };
  }
  checks.push("release_rollback_execute_procedure_present");

  try {
    const tag = execFileSync(
      "git",
      ["rev-parse", "--verify", "release-deploy-pass"],
      {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();
    if (!/^[0-9a-f]{40}$/i.test(tag)) {
      return {
        ok: false,
        checks,
        reason: "git tag release-deploy-pass did not resolve to a commit SHA.",
      };
    }
    checks.push("release_deploy_pass_tag_present");
  } catch {
    return {
      ok: false,
      checks,
      reason: [
        "Missing git tag release-deploy-pass.",
        "RELEASE-ROLLBACK R2 restore target requires the Deploy pass tip.",
      ].join("\n"),
    };
  }

  const runnerPath = path.join(
    cwd,
    "docs/10-validation/release-rollback/RELEASE_ROLLBACK_RUNNER.md",
  );
  if (!fs.existsSync(runnerPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing RELEASE_ROLLBACK_RUNNER.md.",
    };
  }
  checks.push("release_rollback_runner_present");

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "RELEASE_ROLLBACK_R2_STARTED",
      "RELEASE_ROLLBACK_R2_COMPLETED",
    ],
    source:
      "R1 CERTIFIED + RELEASE_ROLLBACK_EXECUTE + release-deploy-pass (no R3 · no remote restore · no infra)",
  };
}
