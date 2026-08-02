/**
 * RELEASE-E2E · E2 Order → Delivery.
 *
 * Certifies FLOW-01 remains available for the E2E journey:
 *   FLOW01_T1…T4 STARTED/COMPLETED (Order → Preparation → Delivery)
 *
 * Does NOT re-run FLOW-01 domain mutations. Does NOT open E3/E4.
 * Does NOT use Playwright. Binds to tag `flow01-pass` on main.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { FLOW01_CANONICAL_STEPS } from "./flow01-canonical-pipeline.mjs";

export const RELEASE_E2E_E2_MAPPED_TOKENS = Object.freeze([
  ...FLOW01_CANONICAL_STEPS,
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
 * }} E2Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {E2Result}
 */
export function runReleaseE2eE2OrderDelivery(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify FLOW-01 runner.",
    };
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return { ok: false, checks, reason: "package.json is not valid JSON." };
  }
  if (!pkg?.scripts?.["test:flow01-canonical"]) {
    return {
      ok: false,
      checks,
      reason: [
        'Missing npm script "test:flow01-canonical".',
        "RELEASE-E2E E2 requires the FLOW-01 runner on main.",
      ].join("\n"),
    };
  }
  checks.push("flow01_canonical_script_present");

  const expected = [...RELEASE_E2E_E2_MAPPED_TOKENS];
  if (
    FLOW01_CANONICAL_STEPS.length !== 8 ||
    expected.some((tok, i) => FLOW01_CANONICAL_STEPS[i] !== tok)
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "FLOW-01 canonical pipeline is not intact (expected T1…T4 STARTED/COMPLETED).",
        `Observed: ${FLOW01_CANONICAL_STEPS.join(" → ") || "(empty)"}`,
      ].join("\n"),
    };
  }
  checks.push("flow01_canonical_pipeline_intact");

  try {
    const tag = execFileSync("git", ["rev-parse", "--verify", "flow01-pass"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!/^[0-9a-f]{40}$/i.test(tag)) {
      return {
        ok: false,
        checks,
        reason: "git tag flow01-pass did not resolve to a commit SHA.",
      };
    }
    checks.push("flow01_pass_tag_present");
  } catch {
    return {
      ok: false,
      checks,
      reason: [
        "Missing git tag flow01-pass.",
        "RELEASE-E2E E2 reuses FLOW-01 certification — tag required.",
      ].join("\n"),
    };
  }

  const passActa = path.join(
    cwd,
    "docs/10-validation/flow-01/FLOW01_PASS_ACTA.md",
  );
  if (!fs.existsSync(passActa)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW01_PASS_ACTA.md (FLOW-01 certification evidence).",
    };
  }
  checks.push("flow01_pass_acta_present");

  const specPath = path.join(
    cwd,
    "docs/00-status/FLOW_01_KITCHEN_DELIVERY_SPEC.md",
  );
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW_01_KITCHEN_DELIVERY_SPEC.md.",
    };
  }
  checks.push("flow01_spec_present");

  return {
    ok: true,
    checks,
    mapped_tokens: expected,
    source:
      "flow01-pass + FLOW-01 T1…T4 pipeline (no E3+ · no FLOW-01 domain re-run)",
  };
}
