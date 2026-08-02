/**
 * RELEASE-DEPLOY · D2 Publish / Apply.
 *
 * Certifies the frozen publish/apply procedure for the certified platform:
 *   D1 CERTIFIED + RELEASE_DEPLOY_PUBLISH + build:web artifact contract
 *
 * Does NOT run remote deploy. Does NOT open D3.
 * Does NOT touch CI, infra secrets, Rollback, FLOW-05, or release-01-beta.
 */
import fs from "node:fs";
import path from "node:path";

export const RELEASE_DEPLOY_D2_PRECONDITIONS = Object.freeze([
  "release_deploy_d1_acta_certified",
  "release_deploy_publish_procedure_present",
  "release_deploy_build_web_script_present",
  "release_deploy_vite_config_present",
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
 * }} D2Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {D2Result}
 */
export function runReleaseDeployD2PublishApply(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  const d1Acta = path.join(
    cwd,
    "docs/10-validation/release-deploy/RELEASE_DEPLOY_001_D1_ACTA.md",
  );
  if (!fs.existsSync(d1Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_DEPLOY_001_D1_ACTA.md — D2 requires D1 CERTIFIED.",
    };
  }
  const d1Text = fs.readFileSync(d1Acta, "utf8");
  if (!/CERTIFIED desde `main`/i.test(d1Text)) {
    return {
      ok: false,
      checks,
      reason:
        "RELEASE_DEPLOY_001_D1_ACTA.md is not CERTIFIED from main — Land Check D1 first.",
    };
  }
  checks.push("release_deploy_d1_acta_certified");

  const publishPath = path.join(
    cwd,
    "docs/10-validation/release-deploy/RELEASE_DEPLOY_PUBLISH.md",
  );
  if (!fs.existsSync(publishPath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_DEPLOY_PUBLISH.md (canonical publish/apply procedure).",
    };
  }
  const publishText = fs.readFileSync(publishPath, "utf8");
  if (
    !/Canonical steps/i.test(publishText) ||
    !/build:web/.test(publishText) ||
    !/RELEASE_DEPLOY_D2_/.test(publishText)
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "RELEASE_DEPLOY_PUBLISH.md is incomplete.",
        "Expected Canonical steps, build:web, and RELEASE_DEPLOY_D2_ markers.",
      ].join("\n"),
    };
  }
  checks.push("release_deploy_publish_procedure_present");

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify build:web artifact script.",
    };
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return { ok: false, checks, reason: "package.json is not valid JSON." };
  }
  if (!pkg?.scripts?.["build:web"]) {
    return {
      ok: false,
      checks,
      reason: [
        'Missing npm script "build:web".',
        "RELEASE-DEPLOY D2 requires a reproducible web artifact script.",
      ].join("\n"),
    };
  }
  checks.push("release_deploy_build_web_script_present");

  const viteCandidates = [
    "vite.config.ts",
    "vite.config.mts",
    "vite.config.js",
    "vite.config.mjs",
  ];
  const viteFound = viteCandidates.some((f) =>
    fs.existsSync(path.join(cwd, f)),
  );
  if (!viteFound) {
    return {
      ok: false,
      checks,
      reason:
        "Missing vite.config.* — D2 publish/apply requires a Vite web build entry.",
    };
  }
  checks.push("release_deploy_vite_config_present");

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "RELEASE_DEPLOY_D2_STARTED",
      "RELEASE_DEPLOY_D2_COMPLETED",
    ],
    source:
      "D1 CERTIFIED + RELEASE_DEPLOY_PUBLISH + build:web (no D3 · no remote deploy · no infra)",
  };
}
