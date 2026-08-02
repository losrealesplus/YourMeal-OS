/**
 * RELEASE-SMOKE · S3 Bootstrap (platform capability).
 *
 * Certifies Bootstrap → Identity ready, aligned with PS-002-C / FCR-008:
 *   BOOTSTRAP_START → IDENTITY_READY → PROFILE_READY
 *   → MEMBERSHIP_READY → ROLE_READY
 *
 * Does NOT certify Dashboard (HOME_PATH / NAVIGATE / DASHBOARD_RENDERED).
 * Does NOT run a full Playwright E2E suite.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { PS002_CANONICAL_STEPS } from "./canonical-pipeline.mjs";

export const RELEASE_SMOKE_S3_MAPPED_TOKENS = Object.freeze([
  "BOOTSTRAP_START",
  "IDENTITY_READY",
  "PROFILE_READY",
  "MEMBERSHIP_READY",
  "ROLE_READY",
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
 * }} S3Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {S3Result}
 */
export function runReleaseSmokeS3Bootstrap(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify bootstrap/Auth runner.",
    };
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return { ok: false, checks, reason: "package.json is not valid JSON." };
  }
  if (!pkg?.scripts?.["test:ps002-canonical-auth"]) {
    return {
      ok: false,
      checks,
      reason: [
        'Missing npm script "test:ps002-canonical-auth".',
        "RELEASE-SMOKE S3 requires the PS-002-C runner that exercises bootstrap.",
      ].join("\n"),
    };
  }
  checks.push("ps002_canonical_auth_script_present");

  // Bootstrap segment of FCR-008 (indices 3..7)
  const segment = PS002_CANONICAL_STEPS.slice(3, 8);
  const expected = [...RELEASE_SMOKE_S3_MAPPED_TOKENS];
  if (
    segment.length !== 5 ||
    expected.some((tok, i) => segment[i] !== tok)
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "PS-002-C canonical pipeline bootstrap segment is not intact.",
        `Expected: ${expected.join(" → ")}`,
        `Observed: ${segment.join(" → ") || "(empty)"}`,
      ].join("\n"),
    };
  }
  // Ensure Dashboard tokens are NOT required for S3
  if (
    segment.includes("DASHBOARD_RENDERED") ||
    segment.includes("HOME_PATH_RESOLVED")
  ) {
    return {
      ok: false,
      checks,
      reason: "S3 bootstrap segment must not include Dashboard tokens.",
    };
  }
  checks.push("fcr008_bootstrap_segment_intact");

  try {
    const tag = execFileSync("git", ["rev-parse", "--verify", "ps002c-pass"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!/^[0-9a-f]{40}$/i.test(tag)) {
      return {
        ok: false,
        checks,
        reason: "git tag ps002c-pass did not resolve to a commit SHA.",
      };
    }
    checks.push("ps002c_pass_tag_present");
  } catch {
    return {
      ok: false,
      checks,
      reason: [
        "Missing git tag ps002c-pass.",
        "RELEASE-SMOKE S3 reuses platform certification for bootstrap readiness.",
      ].join("\n"),
    };
  }

  const pipelinePath = path.join(cwd, "src/auth/post-login-pipeline.ts");
  if (!fs.existsSync(pipelinePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing src/auth/post-login-pipeline.ts (bootstrap emission surface).",
    };
  }
  const pipelineSrc = fs.readFileSync(pipelinePath, "utf8");
  for (const tok of expected) {
    if (!pipelineSrc.includes(tok)) {
      return {
        ok: false,
        checks,
        reason: `${tok} is not present in post-login-pipeline.ts.`,
      };
    }
  }
  // Dashboard tokens may exist in the file later — S3 must not require them as PASS.
  checks.push("post_login_pipeline_emits_bootstrap_tokens");

  const bootstrapSurface = [
    path.join(cwd, "src/lib/admin-auth-bootstrap.ts"),
    path.join(cwd, "src/auth/session.ts"),
  ].find((p) => fs.existsSync(p));
  if (!bootstrapSurface) {
    return {
      ok: false,
      checks,
      reason:
        "Missing bootstrap surface (expected src/lib/admin-auth-bootstrap.ts or src/auth/session.ts).",
    };
  }
  checks.push("bootstrap_surface_present");

  return {
    ok: true,
    checks,
    mapped_tokens: expected,
    source:
      "ps002c-pass + FCR-008 bootstrap segment (no Dashboard / no full Playwright E2E)",
  };
}
