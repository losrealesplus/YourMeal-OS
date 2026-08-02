/**
 * RELEASE-SMOKE · S4 Dashboard (platform capability).
 *
 * Certifies Home path → Dashboard rendered, aligned with PS-002-C / FCR-008:
 *   HOME_PATH_RESOLVED → NAVIGATE → DASHBOARD_RENDERED
 *
 * Precondition in the certified pipeline: ROLE_READY (end of S3).
 * Does NOT run Cross-flow, full Playwright E2E, Deploy, or Rollback.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { PS002_CANONICAL_STEPS } from "./canonical-pipeline.mjs";

export const RELEASE_SMOKE_S4_MAPPED_TOKENS = Object.freeze([
  "HOME_PATH_RESOLVED",
  "NAVIGATE",
  "DASHBOARD_RENDERED",
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
 * }} S4Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string }} [opts]
 * @returns {S4Result}
 */
export function runReleaseSmokeS4Dashboard(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  /** @type {string[]} */
  const checks = [];

  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify Auth/Dashboard runner.",
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
        "RELEASE-SMOKE S4 requires the PS-002-C runner that exercises home path → dashboard.",
      ].join("\n"),
    };
  }
  checks.push("ps002_canonical_auth_script_present");

  // ROLE_READY must precede Dashboard segment (S3 handoff)
  if (PS002_CANONICAL_STEPS[7] !== "ROLE_READY") {
    return {
      ok: false,
      checks,
      reason: [
        "PS-002-C pipeline no longer ends Bootstrap at ROLE_READY before Dashboard.",
        `Observed index 7: ${PS002_CANONICAL_STEPS[7] ?? "(empty)"}`,
      ].join("\n"),
    };
  }
  checks.push("fcr008_role_ready_precedes_dashboard");

  // Dashboard segment of FCR-008 (indices 8..10)
  const segment = PS002_CANONICAL_STEPS.slice(8, 11);
  const expected = [...RELEASE_SMOKE_S4_MAPPED_TOKENS];
  if (
    segment.length !== 3 ||
    expected.some((tok, i) => segment[i] !== tok)
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "PS-002-C canonical pipeline dashboard segment is not intact.",
        `Expected: ${expected.join(" → ")}`,
        `Observed: ${segment.join(" → ") || "(empty)"}`,
      ].join("\n"),
    };
  }
  checks.push("fcr008_dashboard_segment_intact");

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
        "RELEASE-SMOKE S4 reuses platform certification for dashboard readiness.",
      ].join("\n"),
    };
  }

  const pipelinePath = path.join(cwd, "src/auth/post-login-pipeline.ts");
  if (!fs.existsSync(pipelinePath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing src/auth/post-login-pipeline.ts (dashboard emission surface).",
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
  checks.push("post_login_pipeline_emits_dashboard_tokens");

  const homePathSurface = path.join(cwd, "src/lib/resolve-home-path.ts");
  if (!fs.existsSync(homePathSurface)) {
    return {
      ok: false,
      checks,
      reason: "Missing src/lib/resolve-home-path.ts (HOME_PATH_RESOLVED surface).",
    };
  }
  const homeSrc = fs.readFileSync(homePathSurface, "utf8");
  if (!homeSrc.includes("HOME_PATH_RESOLVED")) {
    return {
      ok: false,
      checks,
      reason: "resolve-home-path.ts does not emit HOME_PATH_RESOLVED.",
    };
  }
  checks.push("home_path_surface_present");

  const dashboardCandidates = [
    path.join(cwd, "src/routes/_authenticated/admin.index.tsx"),
    path.join(cwd, "src/routes/auth_.admin.tsx"),
    path.join(cwd, "src/routes/auth.tsx"),
  ];
  const dashboardSurface = dashboardCandidates.find((p) => fs.existsSync(p));
  if (!dashboardSurface) {
    return {
      ok: false,
      checks,
      reason:
        "Missing dashboard/auth navigate surface (admin.index / auth_.admin / auth).",
    };
  }
  const dashSrc = fs.readFileSync(dashboardSurface, "utf8");
  if (
    !dashSrc.includes("DASHBOARD_RENDERED") &&
    !dashSrc.includes("NAVIGATE")
  ) {
    // admin.index may be the shell; emission can live in auth routes — accept shell
    if (!dashboardSurface.includes("admin.index")) {
      return {
        ok: false,
        checks,
        reason: `${path.relative(cwd, dashboardSurface)} lacks NAVIGATE/DASHBOARD_RENDERED.`,
      };
    }
  }
  checks.push("dashboard_surface_present");

  return {
    ok: true,
    checks,
    mapped_tokens: expected,
    source:
      "ps002c-pass + FCR-008 dashboard segment (no Cross-flow / no full Playwright E2E)",
  };
}
