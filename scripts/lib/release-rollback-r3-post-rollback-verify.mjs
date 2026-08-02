/**
 * RELEASE-ROLLBACK · R3 Post-rollback Verify.
 *
 * Certifies minimal post-restore surface for the recovered platform:
 *   R2 CERTIFIED + RELEASE_ROLLBACK_VERIFY + preview + app entry + release-deploy-pass
 *
 * Does NOT re-run E2E / Playwright / Deploy. Does NOT open RELEASE-01-BETA.
 * Does NOT touch CI, infra secrets, or FLOW-05.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const RELEASE_ROLLBACK_R3_PRECONDITIONS = Object.freeze([
  "release_rollback_r2_acta_certified",
  "release_rollback_verify_procedure_present",
  "release_rollback_preview_script_present",
  "release_rollback_app_entry_present",
  "release_deploy_pass_tag_present",
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
 * }} R3Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {R3Result}
 */
export function runReleaseRollbackR3PostRollbackVerify(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  const r2Acta = path.join(
    cwd,
    "docs/10-validation/release-rollback/RELEASE_ROLLBACK_002_R2_ACTA.md",
  );
  if (!fs.existsSync(r2Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_ROLLBACK_002_R2_ACTA.md — R3 requires R2 CERTIFIED.",
    };
  }
  const r2Text = fs.readFileSync(r2Acta, "utf8");
  if (!/CERTIFIED desde `main`/i.test(r2Text)) {
    return {
      ok: false,
      checks,
      reason:
        "RELEASE_ROLLBACK_002_R2_ACTA.md is not CERTIFIED from main — Land Check R2 first.",
    };
  }
  checks.push("release_rollback_r2_acta_certified");

  const verifyPath = path.join(
    cwd,
    "docs/10-validation/release-rollback/RELEASE_ROLLBACK_VERIFY.md",
  );
  if (!fs.existsSync(verifyPath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_ROLLBACK_VERIFY.md (canonical post-rollback verify procedure).",
    };
  }
  const verifyText = fs.readFileSync(verifyPath, "utf8");
  if (
    !/Canonical steps/i.test(verifyText) ||
    !/preview/.test(verifyText) ||
    !/RELEASE_ROLLBACK_R3_/.test(verifyText)
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "RELEASE_ROLLBACK_VERIFY.md is incomplete.",
        "Expected Canonical steps, preview, and RELEASE_ROLLBACK_R3_ markers.",
      ].join("\n"),
    };
  }
  checks.push("release_rollback_verify_procedure_present");

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify preview surface script.",
    };
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return { ok: false, checks, reason: "package.json is not valid JSON." };
  }
  if (!pkg?.scripts?.preview) {
    return {
      ok: false,
      checks,
      reason: [
        'Missing npm script "preview".',
        "RELEASE-ROLLBACK R3 requires a post-restore surface script.",
      ].join("\n"),
    };
  }
  checks.push("release_rollback_preview_script_present");

  const entryOk =
    fs.existsSync(path.join(cwd, "index.html")) ||
    fs.existsSync(path.join(cwd, "src"));
  if (!entryOk) {
    return {
      ok: false,
      checks,
      reason:
        "Missing app entry (index.html or src/) — R3 cannot confirm operable surface.",
    };
  }
  checks.push("release_rollback_app_entry_present");

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
        "RELEASE-ROLLBACK R3 still anchors to the certified Deploy tip.",
      ].join("\n"),
    };
  }

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "RELEASE_ROLLBACK_R3_STARTED",
      "RELEASE_ROLLBACK_R3_COMPLETED",
    ],
    source:
      "R2 CERTIFIED + RELEASE_ROLLBACK_VERIFY + preview + release-deploy-pass (no BETA · no E2E re-run · no infra)",
  };
}
