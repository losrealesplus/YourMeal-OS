/**
 * RELEASE-E2E · E3 Incident → Billing.
 *
 * Certifies FLOW-02 + FLOW-03 remain available for the E2E journey:
 *   FLOW02_T1…T3 STARTED/COMPLETED (Delivery Incidents)
 *   FLOW03_T1…T3 STARTED/COMPLETED (Billing)
 *
 * Does NOT re-run FLOW-02/03 domain mutations. Does NOT open E4.
 * Does NOT use Playwright. Binds to tags `flow02-pass` + `flow03-pass` on main.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { FLOW02_CANONICAL_STEPS } from "./flow02-canonical-pipeline.mjs";
import { FLOW03_CANONICAL_STEPS } from "./flow03-canonical-pipeline.mjs";

export const RELEASE_E2E_E3_MAPPED_TOKENS = Object.freeze([
  ...FLOW02_CANONICAL_STEPS,
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
 * }} E3Result
 */

/**
 * @param {string} cwd
 * @param {string} tagName
 * @param {string[]} checks
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
function requirePassTag(cwd, tagName, checks) {
  try {
    const tag = execFileSync("git", ["rev-parse", "--verify", tagName], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!/^[0-9a-f]{40}$/i.test(tag)) {
      return {
        ok: false,
        reason: `git tag ${tagName} did not resolve to a commit SHA.`,
      };
    }
    checks.push(`${tagName.replace(/-/g, "_")}_tag_present`);
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: [
        `Missing git tag ${tagName}.`,
        "RELEASE-E2E E3 reuses FLOW-02 + FLOW-03 certification — tags required.",
      ].join("\n"),
    };
  }
}

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {E3Result}
 */
export function runReleaseE2eE3IncidentBilling(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify FLOW-02 / FLOW-03 runners.",
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
        "RELEASE-E2E E3 requires the FLOW-02 runner on main.",
      ].join("\n"),
    };
  }
  checks.push("flow02_canonical_script_present");

  if (!pkg?.scripts?.["test:flow03-canonical"]) {
    return {
      ok: false,
      checks,
      reason: [
        'Missing npm script "test:flow03-canonical".',
        "RELEASE-E2E E3 requires the FLOW-03 runner on main.",
      ].join("\n"),
    };
  }
  checks.push("flow03_canonical_script_present");

  if (
    FLOW02_CANONICAL_STEPS.length !== 6 ||
    FLOW02_CANONICAL_STEPS[0] !== "FLOW02_T1_STARTED" ||
    FLOW02_CANONICAL_STEPS[5] !== "FLOW02_T3_COMPLETED"
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

  if (
    FLOW03_CANONICAL_STEPS.length !== 6 ||
    FLOW03_CANONICAL_STEPS[0] !== "FLOW03_T1_STARTED" ||
    FLOW03_CANONICAL_STEPS[5] !== "FLOW03_T3_COMPLETED"
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

  const tag02 = requirePassTag(cwd, "flow02-pass", checks);
  if (!tag02.ok) return { ok: false, checks, reason: tag02.reason };

  const tag03 = requirePassTag(cwd, "flow03-pass", checks);
  if (!tag03.ok) return { ok: false, checks, reason: tag03.reason };

  const passActa02 = path.join(
    cwd,
    "docs/10-validation/flow-02/FLOW02_PASS_ACTA.md",
  );
  if (!fs.existsSync(passActa02)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW02_PASS_ACTA.md (FLOW-02 certification evidence).",
    };
  }
  checks.push("flow02_pass_acta_present");

  const passActa03 = path.join(
    cwd,
    "docs/10-validation/flow-03/FLOW03_PASS_ACTA.md",
  );
  if (!fs.existsSync(passActa03)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW03_PASS_ACTA.md (FLOW-03 certification evidence).",
    };
  }
  checks.push("flow03_pass_acta_present");

  const spec02 = path.join(
    cwd,
    "docs/00-status/FLOW_02_DELIVERY_INCIDENTS_SPEC.md",
  );
  if (!fs.existsSync(spec02)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW_02_DELIVERY_INCIDENTS_SPEC.md.",
    };
  }
  checks.push("flow02_spec_present");

  const spec03 = path.join(cwd, "docs/00-status/FLOW_03_BILLING_SPEC.md");
  if (!fs.existsSync(spec03)) {
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
    mapped_tokens: [...RELEASE_E2E_E3_MAPPED_TOKENS],
    source:
      "flow02-pass + flow03-pass · FLOW-02 T1…T3 + FLOW-03 T1…T3 (no E4 · no domain re-run)",
  };
}
