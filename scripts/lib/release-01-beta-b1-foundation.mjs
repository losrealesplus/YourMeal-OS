/**
 * RELEASE-01-BETA · B1 Foundation.
 *
 * Certifies Foundation anchors remain available for beta acceptance:
 *   Platform / foundation locks · ps002c-pass · Beta Spec/Gate
 *
 * Does NOT reopen PS. Does NOT open B2–B5.
 * Does NOT touch FLOW-05, Deploy/Rollback execution, or business logic.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { RELEASE_01_BETA_CANONICAL_STEPS } from "./release-01-beta-canonical-pipeline.mjs";

export const RELEASE_01_BETA_B1_PRECONDITIONS = Object.freeze([
  "release_01_beta_canonical_script_present",
  "release_01_beta_canonical_pipeline_intact",
  "foundation_locks_present",
  "ps002c_pass_tag_present",
  "ps002c_pass_acta_present",
  "release_01_beta_spec_present",
  "release_01_beta_gate_present",
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
 * }} B1Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {B1Result}
 */
export function runRelease01BetaB1Foundation(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify RELEASE-01-BETA runner.",
    };
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return { ok: false, checks, reason: "package.json is not valid JSON." };
  }
  if (!pkg?.scripts?.["test:release-01-beta"]) {
    return {
      ok: false,
      checks,
      reason: [
        'Missing npm script "test:release-01-beta".',
        "RELEASE-01-BETA B1 requires the canonical Beta runner on main.",
      ].join("\n"),
    };
  }
  checks.push("release_01_beta_canonical_script_present");

  if (
    RELEASE_01_BETA_CANONICAL_STEPS.length !== 10 ||
    RELEASE_01_BETA_CANONICAL_STEPS[0] !== "RELEASE_01_BETA_B1_STARTED" ||
    RELEASE_01_BETA_CANONICAL_STEPS[9] !== "RELEASE_01_BETA_B5_COMPLETED"
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "RELEASE-01-BETA canonical pipeline is not intact (expected B1…B5 STARTED/COMPLETED).",
        `Observed: ${RELEASE_01_BETA_CANONICAL_STEPS.join(" → ") || "(empty)"}`,
      ].join("\n"),
    };
  }
  checks.push("release_01_beta_canonical_pipeline_intact");

  const platformClosed = path.join(cwd, "docs/00-status/PLATFORM_V1_CLOSED.md");
  const identityLock = path.join(
    cwd,
    "docs/00-status/IDENTITY_FOUNDATION_LOCK_v1.md",
  );
  if (!fs.existsSync(platformClosed) || !fs.existsSync(identityLock)) {
    return {
      ok: false,
      checks,
      reason: [
        "Missing Foundation locks (PLATFORM_V1_CLOSED.md and/or IDENTITY_FOUNDATION_LOCK_v1.md).",
        "RELEASE-01-BETA B1 anchors Platform / foundation locks — documents required.",
      ].join("\n"),
    };
  }
  checks.push("foundation_locks_present");

  try {
    const tag = execFileSync("git", ["rev-parse", "--verify", "ps002c-pass"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!/^[0-9a-f]{40}$/i.test(tag)) {
      return {
        ok: false,
        checks,
        reason: "git tag ps002c-pass did not resolve to a commit SHA.",
      };
    }
    checks.push("ps002c_pass_tag_present");
  } catch {
    return {
      ok: false,
      checks,
      reason: [
        "Missing git tag ps002c-pass.",
        "RELEASE-01-BETA B1 anchors PS-002C certification — tag required.",
      ].join("\n"),
    };
  }

  const passActa = path.join(
    cwd,
    "docs/10-validation/platform-stabilization/PS002C_PASS_ACTA.md",
  );
  if (!fs.existsSync(passActa)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing PS002C_PASS_ACTA.md (PS-002C certification evidence).",
    };
  }
  checks.push("ps002c_pass_acta_present");

  const specPath = path.join(cwd, "docs/00-status/RELEASE_01_BETA_SPEC.md");
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing RELEASE_01_BETA_SPEC.md.",
    };
  }
  checks.push("release_01_beta_spec_present");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/release-01-beta/RELEASE_01_BETA_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing RELEASE_01_BETA_GATE.md.",
    };
  }
  checks.push("release_01_beta_gate_present");

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "RELEASE_01_BETA_B1_STARTED",
      "RELEASE_01_BETA_B1_COMPLETED",
    ],
    source:
      "foundation locks · ps002c-pass · Beta Spec/Gate (no B2+ · no FLOW-05 · no tag)",
  };
}
