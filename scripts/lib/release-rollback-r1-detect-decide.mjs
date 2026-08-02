/**
 * RELEASE-ROLLBACK · R1 Detect / Decide.
 *
 * Certifies rollback activation preconditions for the deployed platform:
 *   release-deploy-pass + Rollback Spec/Gate/Runner artifacts
 *
 * Does NOT execute restore. Does NOT open R2/R3.
 * Does NOT touch CI, infra, FLOW-05, or release-01-beta.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { RELEASE_ROLLBACK_CANONICAL_STEPS } from "./release-rollback-canonical-pipeline.mjs";

export const RELEASE_ROLLBACK_R1_PRECONDITIONS = Object.freeze([
  "release_rollback_canonical_script_present",
  "release_rollback_canonical_pipeline_intact",
  "release_deploy_pass_tag_present",
  "release_deploy_pass_acta_present",
  "release_rollback_spec_present",
  "release_rollback_gate_present",
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
 * }} R1Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {R1Result}
 */
export function runReleaseRollbackR1DetectDecide(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify RELEASE-ROLLBACK runner.",
    };
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return { ok: false, checks, reason: "package.json is not valid JSON." };
  }
  if (!pkg?.scripts?.["test:release-rollback"]) {
    return {
      ok: false,
      checks,
      reason: [
        'Missing npm script "test:release-rollback".',
        "RELEASE-ROLLBACK R1 requires the canonical Rollback runner on main.",
      ].join("\n"),
    };
  }
  checks.push("release_rollback_canonical_script_present");

  if (
    RELEASE_ROLLBACK_CANONICAL_STEPS.length !== 6 ||
    RELEASE_ROLLBACK_CANONICAL_STEPS[0] !== "RELEASE_ROLLBACK_R1_STARTED" ||
    RELEASE_ROLLBACK_CANONICAL_STEPS[5] !== "RELEASE_ROLLBACK_R3_COMPLETED"
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "RELEASE-ROLLBACK canonical pipeline is not intact (expected R1…R3 STARTED/COMPLETED).",
        `Observed: ${RELEASE_ROLLBACK_CANONICAL_STEPS.join(" → ") || "(empty)"}`,
      ].join("\n"),
    };
  }
  checks.push("release_rollback_canonical_pipeline_intact");

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
        "RELEASE-ROLLBACK R1 anchors to RELEASE-DEPLOY certification — tag required.",
      ].join("\n"),
    };
  }

  const passActa = path.join(
    cwd,
    "docs/10-validation/release-deploy/RELEASE_DEPLOY_PASS_ACTA.md",
  );
  if (!fs.existsSync(passActa)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_DEPLOY_PASS_ACTA.md (RELEASE-DEPLOY certification evidence).",
    };
  }
  checks.push("release_deploy_pass_acta_present");

  const specPath = path.join(cwd, "docs/00-status/RELEASE_ROLLBACK_SPEC.md");
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing RELEASE_ROLLBACK_SPEC.md.",
    };
  }
  checks.push("release_rollback_spec_present");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/release-rollback/RELEASE_ROLLBACK_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing RELEASE_ROLLBACK_GATE.md.",
    };
  }
  checks.push("release_rollback_gate_present");

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "RELEASE_ROLLBACK_R1_STARTED",
      "RELEASE_ROLLBACK_R1_COMPLETED",
    ],
    source:
      "release-deploy-pass + Rollback Spec/Gate (no R2+ · no restore · no infra)",
  };
}
