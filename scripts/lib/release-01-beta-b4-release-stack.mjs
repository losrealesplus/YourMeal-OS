/**
 * RELEASE-01-BETA · B4 Release Stack.
 *
 * Certifies Deploy + Rollback remain available as the beta release stack:
 *   release-deploy-pass · release-rollback-pass (+ PASS actas) · B3 CERTIFIED
 *
 * Does NOT re-run Deploy/Rollback. Does NOT open B5 Acceptance or FLOW-05.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const RELEASE_01_BETA_B4_STACK_TAGS = Object.freeze([
  "release-deploy-pass",
  "release-rollback-pass",
]);

export const RELEASE_01_BETA_B4_PRECONDITIONS = Object.freeze([
  "release_01_beta_b3_acta_certified",
  "release_deploy_pass_tag_present",
  "release_rollback_pass_tag_present",
  "release_deploy_pass_acta_present",
  "release_rollback_pass_acta_present",
]);

const STACK_ACTA = Object.freeze({
  "release-deploy-pass":
    "docs/10-validation/release-deploy/RELEASE_DEPLOY_PASS_ACTA.md",
  "release-rollback-pass":
    "docs/10-validation/release-rollback/RELEASE_ROLLBACK_PASS_ACTA.md",
});

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
 * }} B4Result
 */

/**
 * @param {string} cwd
 * @param {string} tag
 * @returns {{ ok: true, sha: string } | { ok: false, reason: string }}
 */
function resolvePassTag(cwd, tag) {
  try {
    const sha = execFileSync("git", ["rev-parse", "--verify", tag], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!/^[0-9a-f]{40}$/i.test(sha)) {
      return {
        ok: false,
        reason: `git tag ${tag} did not resolve to a commit SHA.`,
      };
    }
    return { ok: true, sha };
  } catch {
    return {
      ok: false,
      reason: [
        `Missing git tag ${tag}.`,
        "RELEASE-01-BETA B4 anchors Deploy · Rollback — both tags required.",
      ].join("\n"),
    };
  }
}

/**
 * @param {string} tag
 */
function checkIdForTag(tag) {
  return `${tag.replace(/-/g, "_")}_tag_present`;
}

/**
 * @param {string} tag
 */
function actaCheckIdForTag(tag) {
  return `${tag.replace(/-/g, "_")}_acta_present`;
}

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {B4Result}
 */
export function runRelease01BetaB4ReleaseStack(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const b3Acta = path.join(
    cwd,
    "docs/10-validation/release-01-beta/RELEASE_01_BETA_003_B3_ACTA.md",
  );
  if (!fs.existsSync(b3Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_01_BETA_003_B3_ACTA.md — B4 requires B3 CERTIFIED.",
    };
  }
  const b3Text = fs.readFileSync(b3Acta, "utf8");
  if (!/CERTIFIED desde `main`/i.test(b3Text)) {
    return {
      ok: false,
      checks,
      reason:
        "RELEASE_01_BETA_003_B3_ACTA.md is not CERTIFIED from main — Land Check B3 first.",
    };
  }
  checks.push("release_01_beta_b3_acta_certified");

  for (const tag of RELEASE_01_BETA_B4_STACK_TAGS) {
    const resolved = resolvePassTag(cwd, tag);
    if (!resolved.ok) {
      return { ok: false, checks, reason: resolved.reason };
    }
    checks.push(checkIdForTag(tag));
  }

  for (const tag of RELEASE_01_BETA_B4_STACK_TAGS) {
    const rel = STACK_ACTA[tag];
    const actaPath = path.join(cwd, rel);
    if (!fs.existsSync(actaPath)) {
      return {
        ok: false,
        checks,
        reason: `Missing ${rel} (${tag} certification evidence).`,
      };
    }
    checks.push(actaCheckIdForTag(tag));
  }

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "RELEASE_01_BETA_B4_STARTED",
      "RELEASE_01_BETA_B4_COMPLETED",
    ],
    source:
      "deploy · rollback-pass + PASS actas · B3 CERTIFIED (no B5 · no FLOW-05 · no Deploy/Rollback re-run)",
  };
}
