/**
 * RELEASE-01-BETA · B3 Platform Capabilities.
 *
 * Certifies Track B platform gates remain available for beta acceptance:
 *   release-smoke-pass · release-crossflow-pass · release-e2e-pass (+ PASS actas)
 *
 * Does NOT re-run Smoke/Cross-flow/E2E. Does NOT open Deploy/Rollback (B4) or B5.
 * Does NOT open FLOW-05.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const RELEASE_01_BETA_B3_PLATFORM_TAGS = Object.freeze([
  "release-smoke-pass",
  "release-crossflow-pass",
  "release-e2e-pass",
]);

export const RELEASE_01_BETA_B3_PRECONDITIONS = Object.freeze([
  "release_01_beta_b2_acta_certified",
  "release_smoke_pass_tag_present",
  "release_crossflow_pass_tag_present",
  "release_e2e_pass_tag_present",
  "release_smoke_pass_acta_present",
  "release_crossflow_pass_acta_present",
  "release_e2e_pass_acta_present",
]);

const PLATFORM_ACTA = Object.freeze({
  "release-smoke-pass":
    "docs/10-validation/release-smoke/RELEASE_SMOKE_PASS_ACTA.md",
  "release-crossflow-pass":
    "docs/10-validation/release-crossflow/RELEASE_CROSSFLOW_PASS_ACTA.md",
  "release-e2e-pass": "docs/10-validation/release-e2e/RELEASE_E2E_PASS_ACTA.md",
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
 * }} B3Result
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
        "RELEASE-01-BETA B3 anchors Smoke · Cross-flow · E2E — all three tags required.",
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
 * @returns {B3Result}
 */
export function runRelease01BetaB3PlatformCapabilities(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const b2Acta = path.join(
    cwd,
    "docs/10-validation/release-01-beta/RELEASE_01_BETA_002_B2_ACTA.md",
  );
  if (!fs.existsSync(b2Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_01_BETA_002_B2_ACTA.md — B3 requires B2 CERTIFIED.",
    };
  }
  const b2Text = fs.readFileSync(b2Acta, "utf8");
  if (!/CERTIFIED desde `main`/i.test(b2Text)) {
    return {
      ok: false,
      checks,
      reason:
        "RELEASE_01_BETA_002_B2_ACTA.md is not CERTIFIED from main — Land Check B2 first.",
    };
  }
  checks.push("release_01_beta_b2_acta_certified");

  for (const tag of RELEASE_01_BETA_B3_PLATFORM_TAGS) {
    const resolved = resolvePassTag(cwd, tag);
    if (!resolved.ok) {
      return { ok: false, checks, reason: resolved.reason };
    }
    checks.push(checkIdForTag(tag));
  }

  for (const tag of RELEASE_01_BETA_B3_PLATFORM_TAGS) {
    const rel = PLATFORM_ACTA[tag];
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
      "RELEASE_01_BETA_B3_STARTED",
      "RELEASE_01_BETA_B3_COMPLETED",
    ],
    source:
      "smoke · crossflow · e2e-pass + PASS actas · B2 CERTIFIED (no B4+ · no Deploy/Rollback · no FLOW-05)",
  };
}
