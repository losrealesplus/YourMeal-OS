/**
 * RELEASE-E2E · E1 Platform Entry.
 *
 * Certifies RELEASE-SMOKE remains available as the E2E journey entry:
 *   RELEASE_SMOKE_S1…S4 STARTED/COMPLETED (Platform FULL PASS)
 *
 * Does NOT re-run Smoke capability drivers. Does NOT open E2/E3/E4.
 * Does NOT use Playwright. Binds to tag `release-smoke-pass` on main.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { RELEASE_SMOKE_CANONICAL_STEPS } from "./release-smoke-canonical-pipeline.mjs";

export const RELEASE_E2E_E1_MAPPED_TOKENS = Object.freeze([
  ...RELEASE_SMOKE_CANONICAL_STEPS,
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
 * }} E1Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {E1Result}
 */
export function runReleaseE2eE1PlatformEntry(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify RELEASE-SMOKE runner.",
    };
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return { ok: false, checks, reason: "package.json is not valid JSON." };
  }
  if (!pkg?.scripts?.["test:release-smoke"]) {
    return {
      ok: false,
      checks,
      reason: [
        'Missing npm script "test:release-smoke".',
        "RELEASE-E2E E1 requires the RELEASE-SMOKE runner on main.",
      ].join("\n"),
    };
  }
  checks.push("release_smoke_canonical_script_present");

  const expected = [...RELEASE_E2E_E1_MAPPED_TOKENS];
  if (
    RELEASE_SMOKE_CANONICAL_STEPS.length !== 8 ||
    expected.some((tok, i) => RELEASE_SMOKE_CANONICAL_STEPS[i] !== tok)
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "RELEASE-SMOKE canonical pipeline is not intact (expected S1…S4 STARTED/COMPLETED).",
        `Observed: ${RELEASE_SMOKE_CANONICAL_STEPS.join(" → ") || "(empty)"}`,
      ].join("\n"),
    };
  }
  checks.push("release_smoke_canonical_pipeline_intact");

  try {
    const tag = execFileSync(
      "git",
      ["rev-parse", "--verify", "release-smoke-pass"],
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
        reason: "git tag release-smoke-pass did not resolve to a commit SHA.",
      };
    }
    checks.push("release_smoke_pass_tag_present");
  } catch {
    return {
      ok: false,
      checks,
      reason: [
        "Missing git tag release-smoke-pass.",
        "RELEASE-E2E E1 reuses RELEASE-SMOKE certification — tag required.",
      ].join("\n"),
    };
  }

  const passActa = path.join(
    cwd,
    "docs/10-validation/release-smoke/RELEASE_SMOKE_PASS_ACTA.md",
  );
  if (!fs.existsSync(passActa)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_SMOKE_PASS_ACTA.md (RELEASE-SMOKE certification evidence).",
    };
  }
  checks.push("release_smoke_pass_acta_present");

  const specPath = path.join(cwd, "docs/00-status/RELEASE_SMOKE_SPEC.md");
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing RELEASE_SMOKE_SPEC.md.",
    };
  }
  checks.push("release_smoke_spec_present");

  return {
    ok: true,
    checks,
    mapped_tokens: expected,
    source:
      "release-smoke-pass + RELEASE-SMOKE S1…S4 pipeline (no E2+ · no Smoke re-run)",
  };
}
