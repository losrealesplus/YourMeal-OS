/**
 * RELEASE-E2E · E4 Inventory → Operational Close.
 *
 * Certifies FLOW-04 remains available for the E2E journey:
 *   FLOW04_T1…T3 STARTED/COMPLETED (Inventory Consumption)
 *
 * Completes RELEASE-E2E when chained after E1–E3.
 * Does NOT re-run FLOW-04 domain mutations.
 * Does NOT open Deploy · Rollback · FLOW-05 · RELEASE-01-BETA.
 * Does NOT use Playwright. Binds to tag `flow04-pass` on main.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { FLOW04_CANONICAL_STEPS } from "./flow04-canonical-pipeline.mjs";

export const RELEASE_E2E_E4_MAPPED_TOKENS = Object.freeze([
  ...FLOW04_CANONICAL_STEPS,
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
 * }} E4Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {E4Result}
 */
export function runReleaseE2eE4InventoryClose(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify FLOW-04 runner.",
    };
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return { ok: false, checks, reason: "package.json is not valid JSON." };
  }
  if (!pkg?.scripts?.["test:flow04-canonical"]) {
    return {
      ok: false,
      checks,
      reason: [
        'Missing npm script "test:flow04-canonical".',
        "RELEASE-E2E E4 requires the FLOW-04 runner on main.",
      ].join("\n"),
    };
  }
  checks.push("flow04_canonical_script_present");

  const expected = [...RELEASE_E2E_E4_MAPPED_TOKENS];
  if (
    FLOW04_CANONICAL_STEPS.length !== 6 ||
    expected.some((tok, i) => FLOW04_CANONICAL_STEPS[i] !== tok)
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "FLOW-04 canonical pipeline is not intact (expected T1…T3 STARTED/COMPLETED).",
        `Observed: ${FLOW04_CANONICAL_STEPS.join(" → ") || "(empty)"}`,
      ].join("\n"),
    };
  }
  checks.push("flow04_canonical_pipeline_intact");

  try {
    const tag = execFileSync("git", ["rev-parse", "--verify", "flow04-pass"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!/^[0-9a-f]{40}$/i.test(tag)) {
      return {
        ok: false,
        checks,
        reason: "git tag flow04-pass did not resolve to a commit SHA.",
      };
    }
    checks.push("flow04_pass_tag_present");
  } catch {
    return {
      ok: false,
      checks,
      reason: [
        "Missing git tag flow04-pass.",
        "RELEASE-E2E E4 reuses FLOW-04 certification — tag required.",
      ].join("\n"),
    };
  }

  const passActa = path.join(
    cwd,
    "docs/10-validation/flow-04/FLOW04_PASS_ACTA.md",
  );
  if (!fs.existsSync(passActa)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW04_PASS_ACTA.md (FLOW-04 certification evidence).",
    };
  }
  checks.push("flow04_pass_acta_present");

  const specPath = path.join(
    cwd,
    "docs/00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md",
  );
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW_04_INVENTORY_CONSUMPTION_SPEC.md.",
    };
  }
  checks.push("flow04_spec_present");

  return {
    ok: true,
    checks,
    mapped_tokens: expected,
    source:
      "flow04-pass + FLOW-04 T1…T3 pipeline (no Deploy · Rollback · FLOW-05 · no domain re-run)",
  };
}
