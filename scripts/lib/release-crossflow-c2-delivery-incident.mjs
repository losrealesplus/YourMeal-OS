/**
 * RELEASE-CROSSFLOW · C2 Delivery incident → recovery / delivered.
 *
 * Certifies FLOW-02 handoff remains available for the cross-flow chain:
 *   FLOW02_T1…T3 STARTED/COMPLETED (Delivery Incidents FULL PASS)
 *
 * Does NOT re-run domain mutations. Does NOT open C3/C4.
 * Binds to tag `flow02-pass` + Flow runner contract on main.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { FLOW02_CANONICAL_STEPS } from "./flow02-canonical-pipeline.mjs";

export const RELEASE_CROSSFLOW_C2_MAPPED_TOKENS = Object.freeze([
  ...FLOW02_CANONICAL_STEPS,
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
 * }} C2Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {C2Result}
 */
export function runReleaseCrossflowC2DeliveryIncident(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify FLOW-02 runner.",
    };
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return { ok: false, checks, reason: "package.json is not valid JSON." };
  }
  if (!pkg?.scripts?.["test:flow02-canonical"]) {
    return {
      ok: false,
      checks,
      reason: [
        'Missing npm script "test:flow02-canonical".',
        "RELEASE-CROSSFLOW C2 requires the FLOW-02 runner on main.",
      ].join("\n"),
    };
  }
  checks.push("flow02_canonical_script_present");

  const expected = [...RELEASE_CROSSFLOW_C2_MAPPED_TOKENS];
  if (
    FLOW02_CANONICAL_STEPS.length !== 6 ||
    expected.some((tok, i) => FLOW02_CANONICAL_STEPS[i] !== tok)
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "FLOW-02 canonical pipeline is not intact (expected T1…T3 STARTED/COMPLETED).",
        `Observed: ${FLOW02_CANONICAL_STEPS.join(" → ") || "(empty)"}`,
      ].join("\n"),
    };
  }
  checks.push("flow02_canonical_pipeline_intact");

  try {
    const tag = execFileSync("git", ["rev-parse", "--verify", "flow02-pass"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!/^[0-9a-f]{40}$/i.test(tag)) {
      return {
        ok: false,
        checks,
        reason: "git tag flow02-pass did not resolve to a commit SHA.",
      };
    }
    checks.push("flow02_pass_tag_present");
  } catch {
    return {
      ok: false,
      checks,
      reason: [
        "Missing git tag flow02-pass.",
        "RELEASE-CROSSFLOW C2 reuses FLOW-02 certification — tag required.",
      ].join("\n"),
    };
  }

  const passActa = path.join(
    cwd,
    "docs/10-validation/flow-02/FLOW02_PASS_ACTA.md",
  );
  if (!fs.existsSync(passActa)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW02_PASS_ACTA.md (FLOW-02 certification evidence).",
    };
  }
  checks.push("flow02_pass_acta_present");

  const specPath = path.join(
    cwd,
    "docs/00-status/FLOW_02_DELIVERY_INCIDENTS_SPEC.md",
  );
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW_02_DELIVERY_INCIDENTS_SPEC.md.",
    };
  }
  checks.push("flow02_spec_present");

  return {
    ok: true,
    checks,
    mapped_tokens: expected,
    source: "flow02-pass + FLOW-02 T1…T3 pipeline (no C3+ · no domain re-run)",
  };
}
