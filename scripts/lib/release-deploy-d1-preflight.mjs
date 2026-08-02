/**
 * RELEASE-DEPLOY · D1 Deploy Preflight.
 *
 * Certifies publish preconditions for the certified platform:
 *   release-e2e-pass + Deploy Spec/Gate/Runner artifacts
 *
 * Does NOT execute publish/apply. Does NOT open D2/D3.
 * Does NOT touch CI, infra, Rollback, FLOW-05, or release-01-beta.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { RELEASE_DEPLOY_CANONICAL_STEPS } from "./release-deploy-canonical-pipeline.mjs";

export const RELEASE_DEPLOY_D1_PRECONDITIONS = Object.freeze([
  "release_deploy_canonical_script_present",
  "release_deploy_canonical_pipeline_intact",
  "release_e2e_pass_tag_present",
  "release_e2e_pass_acta_present",
  "release_deploy_spec_present",
  "release_deploy_gate_present",
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
 * }} D1Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {D1Result}
 */
export function runReleaseDeployD1Preflight(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify RELEASE-DEPLOY runner.",
    };
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return { ok: false, checks, reason: "package.json is not valid JSON." };
  }
  if (!pkg?.scripts?.["test:release-deploy"]) {
    return {
      ok: false,
      checks,
      reason: [
        'Missing npm script "test:release-deploy".',
        "RELEASE-DEPLOY D1 requires the canonical Deploy runner on main.",
      ].join("\n"),
    };
  }
  checks.push("release_deploy_canonical_script_present");

  if (
    RELEASE_DEPLOY_CANONICAL_STEPS.length !== 6 ||
    RELEASE_DEPLOY_CANONICAL_STEPS[0] !== "RELEASE_DEPLOY_D1_STARTED" ||
    RELEASE_DEPLOY_CANONICAL_STEPS[5] !== "RELEASE_DEPLOY_D3_COMPLETED"
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "RELEASE-DEPLOY canonical pipeline is not intact (expected D1…D3 STARTED/COMPLETED).",
        `Observed: ${RELEASE_DEPLOY_CANONICAL_STEPS.join(" → ") || "(empty)"}`,
      ].join("\n"),
    };
  }
  checks.push("release_deploy_canonical_pipeline_intact");

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
        "RELEASE-DEPLOY D1 anchors to RELEASE-E2E certification — tag required.",
      ].join("\n"),
    };
  }

  const passActa = path.join(
    cwd,
    "docs/10-validation/release-e2e/RELEASE_E2E_PASS_ACTA.md",
  );
  if (!fs.existsSync(passActa)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_E2E_PASS_ACTA.md (RELEASE-E2E certification evidence).",
    };
  }
  checks.push("release_e2e_pass_acta_present");

  const specPath = path.join(cwd, "docs/00-status/RELEASE_DEPLOY_SPEC.md");
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing RELEASE_DEPLOY_SPEC.md.",
    };
  }
  checks.push("release_deploy_spec_present");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/release-deploy/RELEASE_DEPLOY_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing RELEASE_DEPLOY_GATE.md.",
    };
  }
  checks.push("release_deploy_gate_present");

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "RELEASE_DEPLOY_D1_STARTED",
      "RELEASE_DEPLOY_D1_COMPLETED",
    ],
    source:
      "release-e2e-pass + Deploy Spec/Gate (no D2+ · no publish/apply · no infra)",
  };
}
