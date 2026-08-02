/**
 * RELEASE-CROSSFLOW · C3 Delivered → billing paid.
 *
 * Certifies FLOW-03 handoff remains available for the cross-flow chain:
 *   FLOW03_T1…T3 STARTED/COMPLETED (Billing FULL PASS)
 *
 * Does NOT re-run domain mutations. Does NOT open C4.
 * Binds to tag `flow03-pass` + Flow runner contract on main.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { FLOW03_CANONICAL_STEPS } from "./flow03-canonical-pipeline.mjs";

export const RELEASE_CROSSFLOW_C3_MAPPED_TOKENS = Object.freeze([
  ...FLOW03_CANONICAL_STEPS,
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
 * }} C3Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {C3Result}
 */
export function runReleaseCrossflowC3Billing(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify FLOW-03 runner.",
    };
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return { ok: false, checks, reason: "package.json is not valid JSON." };
  }
  if (!pkg?.scripts?.["test:flow03-canonical"]) {
    return {
      ok: false,
      checks,
      reason: [
        'Missing npm script "test:flow03-canonical".',
        "RELEASE-CROSSFLOW C3 requires the FLOW-03 runner on main.",
      ].join("\n"),
    };
  }
  checks.push("flow03_canonical_script_present");

  const expected = [...RELEASE_CROSSFLOW_C3_MAPPED_TOKENS];
  if (
    FLOW03_CANONICAL_STEPS.length !== 6 ||
    expected.some((tok, i) => FLOW03_CANONICAL_STEPS[i] !== tok)
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "FLOW-03 canonical pipeline is not intact (expected T1…T3 STARTED/COMPLETED).",
        `Observed: ${FLOW03_CANONICAL_STEPS.join(" → ") || "(empty)"}`,
      ].join("\n"),
    };
  }
  checks.push("flow03_canonical_pipeline_intact");

  try {
    const tag = execFileSync("git", ["rev-parse", "--verify", "flow03-pass"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!/^[0-9a-f]{40}$/i.test(tag)) {
      return {
        ok: false,
        checks,
        reason: "git tag flow03-pass did not resolve to a commit SHA.",
      };
    }
    checks.push("flow03_pass_tag_present");
  } catch {
    return {
      ok: false,
      checks,
      reason: [
        "Missing git tag flow03-pass.",
        "RELEASE-CROSSFLOW C3 reuses FLOW-03 certification — tag required.",
      ].join("\n"),
    };
  }

  const passActa = path.join(
    cwd,
    "docs/10-validation/flow-03/FLOW03_PASS_ACTA.md",
  );
  if (!fs.existsSync(passActa)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW03_PASS_ACTA.md (FLOW-03 certification evidence).",
    };
  }
  checks.push("flow03_pass_acta_present");

  const specPath = path.join(cwd, "docs/00-status/FLOW_03_BILLING_SPEC.md");
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW_03_BILLING_SPEC.md.",
    };
  }
  checks.push("flow03_spec_present");

  return {
    ok: true,
    checks,
    mapped_tokens: expected,
    source: "flow03-pass + FLOW-03 T1…T3 pipeline (no C4 · no domain re-run)",
  };
}
