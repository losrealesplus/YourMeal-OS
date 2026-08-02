/**
 * RELEASE-SMOKE · S1 Preflight (platform capability).
 *
 * Certifies that the minimum smoke environment contract is documented and
 * verifiable — not that live Auth/Supabase credentials work (that is S2+).
 *
 * No Playwright · no browser · no network · no domain entities.
 */
import fs from "node:fs";
import path from "node:path";

export const RELEASE_SMOKE_OFFICIAL_PROJECT_ID = "djangucecsphnejplvic";

/**
 * @typedef {{ ok: true, checks: string[] } | { ok: false, reason: string, checks: string[] }} S1Result
 */

/**
 * @param {{ cwd?: string, envExamplePath?: string, packageJsonPath?: string }} [opts]
 * @returns {S1Result}
 */
export function runReleaseSmokeS1Preflight(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const envExamplePath =
    opts.envExamplePath ?? path.join(cwd, ".env.example");
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  if (!fs.existsSync(envExamplePath)) {
    return {
      ok: false,
      checks,
      reason: [
        "Missing .env.example at repository root.",
        "Smoke S1 requires a documented environment contract.",
        "Fix: restore .env.example with VITE_SUPABASE_* and project id.",
      ].join("\n"),
    };
  }
  checks.push("env_example_exists");

  const example = fs.readFileSync(envExamplePath, "utf8");

  if (!example.includes(RELEASE_SMOKE_OFFICIAL_PROJECT_ID)) {
    return {
      ok: false,
      checks,
      reason: [
        `Official Supabase project id missing from .env.example (${RELEASE_SMOKE_OFFICIAL_PROJECT_ID}).`,
        "Smoke S1 requires a single documented project source of truth.",
      ].join("\n"),
    };
  }
  checks.push("official_project_id_documented");

  for (const key of [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PROJECT_ID",
  ]) {
    if (!example.includes(`${key}=`) && !example.includes(`${key} =`)) {
      return {
        ok: false,
        checks,
        reason: [
          `${key} is not documented in .env.example.`,
          "Smoke S1 requires publicable Vite auth keys to be named in the template.",
        ].join("\n"),
      };
    }
  }
  checks.push("vite_supabase_keys_documented");

  // Template must keep REPLACE_ME placeholders — never commit a "ready" fake key.
  if (!/VITE_SUPABASE_PUBLISHABLE_KEY=.*REPLACE_ME/.test(example)) {
    return {
      ok: false,
      checks,
      reason: [
        "VITE_SUPABASE_PUBLISHABLE_KEY in .env.example must keep a REPLACE_ME placeholder.",
        "Do not invent or commit real publishable keys in the template.",
        "Local secrets belong in gitignored .env only.",
      ].join("\n"),
    };
  }
  checks.push("no_invented_publishable_key_in_template");

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify smoke runner script.",
    };
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return {
      ok: false,
      checks,
      reason: "package.json is not valid JSON.",
    };
  }
  if (!pkg?.scripts?.["test:release-smoke"]) {
    return {
      ok: false,
      checks,
      reason: [
        'Missing npm script "test:release-smoke" in package.json.',
        "Land Check / Gate require the canonical runner on main.",
      ].join("\n"),
    };
  }
  checks.push("test_release_smoke_script_present");

  return { ok: true, checks };
}
