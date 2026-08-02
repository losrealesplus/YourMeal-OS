/**
 * RELEASE-DEPLOY · D3 Post-deploy Verify.
 *
 * Certifies minimal post-publish surface for the certified platform:
 *   D2 CERTIFIED + RELEASE_DEPLOY_VERIFY + preview + app entry + release-e2e-pass
 *
 * Does NOT re-run E2E / Playwright. Does NOT open Rollback.
 * Does NOT touch CI, infra secrets, FLOW-05, or release-01-beta.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const RELEASE_DEPLOY_D3_PRECONDITIONS = Object.freeze([
  "release_deploy_d2_acta_certified",
  "release_deploy_verify_procedure_present",
  "release_deploy_preview_script_present",
  "release_deploy_app_entry_present",
  "release_e2e_pass_tag_present",
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
 * }} D3Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {D3Result}
 */
export function runReleaseDeployD3PostDeployVerify(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  const d2Acta = path.join(
    cwd,
    "docs/10-validation/release-deploy/RELEASE_DEPLOY_002_D2_ACTA.md",
  );
  if (!fs.existsSync(d2Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_DEPLOY_002_D2_ACTA.md — D3 requires D2 CERTIFIED.",
    };
  }
  const d2Text = fs.readFileSync(d2Acta, "utf8");
  if (!/CERTIFIED desde `main`/i.test(d2Text)) {
    return {
      ok: false,
      checks,
      reason:
        "RELEASE_DEPLOY_002_D2_ACTA.md is not CERTIFIED from main — Land Check D2 first.",
    };
  }
  checks.push("release_deploy_d2_acta_certified");

  const verifyPath = path.join(
    cwd,
    "docs/10-validation/release-deploy/RELEASE_DEPLOY_VERIFY.md",
  );
  if (!fs.existsSync(verifyPath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_DEPLOY_VERIFY.md (canonical post-deploy verify procedure).",
    };
  }
  const verifyText = fs.readFileSync(verifyPath, "utf8");
  if (
    !/Canonical steps/i.test(verifyText) ||
    !/preview/.test(verifyText) ||
    !/RELEASE_DEPLOY_D3_/.test(verifyText)
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "RELEASE_DEPLOY_VERIFY.md is incomplete.",
        "Expected Canonical steps, preview, and RELEASE_DEPLOY_D3_ markers.",
      ].join("\n"),
    };
  }
  checks.push("release_deploy_verify_procedure_present");

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
        "RELEASE-DEPLOY D3 requires a post-publish surface script.",
      ].join("\n"),
    };
  }
  checks.push("release_deploy_preview_script_present");

  const entryOk =
    fs.existsSync(path.join(cwd, "index.html")) ||
    fs.existsSync(path.join(cwd, "src"));
  if (!entryOk) {
    return {
      ok: false,
      checks,
      reason:
        "Missing app entry (index.html or src/) — D3 cannot confirm operable surface.",
    };
  }
  checks.push("release_deploy_app_entry_present");

  try {
    const tag = execFileSync(
      "git",
      ["rev-parse", "--verify", "release-e2e-pass"],
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
        reason: "git tag release-e2e-pass did not resolve to a commit SHA.",
      };
    }
    checks.push("release_e2e_pass_tag_present");
  } catch {
    return {
      ok: false,
      checks,
      reason: [
        "Missing git tag release-e2e-pass.",
        "RELEASE-DEPLOY D3 still anchors to the certified platform.",
      ].join("\n"),
    };
  }

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "RELEASE_DEPLOY_D3_STARTED",
      "RELEASE_DEPLOY_D3_COMPLETED",
    ],
    source:
      "D2 CERTIFIED + RELEASE_DEPLOY_VERIFY + preview + release-e2e-pass (no Rollback · no E2E re-run · no infra)",
  };
}
