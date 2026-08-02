/**
 * RELEASE-CROSSFLOW · C4 Production → inventory sealed.
 *
 * Certifies FLOW-04 handoff remains available for the cross-flow chain:
 *   FLOW04_T1…T3 STARTED/COMPLETED (Inventory Consumption FULL PASS)
 *
 * Completes RELEASE-CROSSFLOW when chained after C1–C3.
 * Does NOT re-run domain mutations. Does NOT open E2E / Deploy / Rollback.
 * Binds to tag `flow04-pass` + Flow runner contract on main.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { FLOW04_CANONICAL_STEPS } from "./flow04-canonical-pipeline.mjs";

export const RELEASE_CROSSFLOW_C4_MAPPED_TOKENS = Object.freeze([
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
 * }} C4Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {C4Result}
 */
export function runReleaseCrossflowC4Inventory(opts = {}) {
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
        "RELEASE-CROSSFLOW C4 requires the FLOW-04 runner on main.",
      ].join("\n"),
    };
  }
  checks.push("flow04_canonical_script_present");

  const expected = [...RELEASE_CROSSFLOW_C4_MAPPED_TOKENS];
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
        "RELEASE-CROSSFLOW C4 reuses FLOW-04 certification — tag required.",
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
      "flow04-pass + FLOW-04 T1…T3 pipeline (no E2E / Deploy / Rollback · no domain re-run)",
  };
}
