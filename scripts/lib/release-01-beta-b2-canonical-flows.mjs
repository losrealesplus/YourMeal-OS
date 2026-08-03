/**
 * RELEASE-01-BETA · B2 Canonical Flows.
 *
 * Certifies FLOW-01…04 remain available as the beta domain journey:
 *   flow01-pass · flow02-pass · flow03-pass · flow04-pass (+ PASS actas)
 *
 * Does NOT re-run Flow runners. Does NOT open FLOW-05 or B3–B5.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const RELEASE_01_BETA_B2_FLOW_TAGS = Object.freeze([
  "flow01-pass",
  "flow02-pass",
  "flow03-pass",
  "flow04-pass",
]);

export const RELEASE_01_BETA_B2_PRECONDITIONS = Object.freeze([
  "release_01_beta_b1_acta_certified",
  "flow01_pass_tag_present",
  "flow02_pass_tag_present",
  "flow03_pass_tag_present",
  "flow04_pass_tag_present",
  "flow01_pass_acta_present",
  "flow02_pass_acta_present",
  "flow03_pass_acta_present",
  "flow04_pass_acta_present",
]);

const FLOW_ACTA = Object.freeze({
  "flow01-pass": "docs/10-validation/flow-01/FLOW01_PASS_ACTA.md",
  "flow02-pass": "docs/10-validation/flow-02/FLOW02_PASS_ACTA.md",
  "flow03-pass": "docs/10-validation/flow-03/FLOW03_PASS_ACTA.md",
  "flow04-pass": "docs/10-validation/flow-04/FLOW04_PASS_ACTA.md",
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
 * }} B2Result
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
        "RELEASE-01-BETA B2 anchors FLOW-01…04 certification — all four tags required.",
      ].join("\n"),
    };
  }
}

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {B2Result}
 */
export function runRelease01BetaB2CanonicalFlows(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const b1Acta = path.join(
    cwd,
    "docs/10-validation/release-01-beta/RELEASE_01_BETA_001_B1_ACTA.md",
  );
  if (!fs.existsSync(b1Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_01_BETA_001_B1_ACTA.md — B2 requires B1 CERTIFIED.",
    };
  }
  const b1Text = fs.readFileSync(b1Acta, "utf8");
  if (!/CERTIFIED desde `main`/i.test(b1Text)) {
    return {
      ok: false,
      checks,
      reason:
        "RELEASE_01_BETA_001_B1_ACTA.md is not CERTIFIED from main — Land Check B1 first.",
    };
  }
  checks.push("release_01_beta_b1_acta_certified");

  for (const tag of RELEASE_01_BETA_B2_FLOW_TAGS) {
    const resolved = resolvePassTag(cwd, tag);
    if (!resolved.ok) {
      return { ok: false, checks, reason: resolved.reason };
    }
    checks.push(`${tag.replace(/-/g, "_")}_tag_present`);
  }

  for (const tag of RELEASE_01_BETA_B2_FLOW_TAGS) {
    const rel = FLOW_ACTA[tag];
    const actaPath = path.join(cwd, rel);
    if (!fs.existsSync(actaPath)) {
      return {
        ok: false,
        checks,
        reason: `Missing ${rel} (${tag} certification evidence).`,
      };
    }
    checks.push(`${tag.replace(/-/g, "_")}_acta_present`);
  }

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "RELEASE_01_BETA_B2_STARTED",
      "RELEASE_01_BETA_B2_COMPLETED",
    ],
    source:
      "flow01–04-pass + PASS actas · B1 CERTIFIED (no B3+ · no FLOW-05 · no Flow re-run)",
  };
}
