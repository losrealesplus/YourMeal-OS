/**
 * RELEASE-SMOKE · S2 Auth (platform capability).
 *
 * Certifies that Authentication → Canonical Session remains an available
 * release capability, aligned with PS-002-C / FCR-008 tokens:
 *   LOGIN → LOGIN_OK → CANONICAL_SESSION
 *
 * Does NOT run a full Playwright suite (no Bootstrap/Dashboard journey).
 * Binds to the already-certified platform Auth gate (`ps002c-pass`) and
 * the executable Auth runner contract on main.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { PS002_CANONICAL_STEPS } from "./canonical-pipeline.mjs";

export const RELEASE_SMOKE_S2_MAPPED_TOKENS = Object.freeze([
  "LOGIN",
  "LOGIN_OK",
  "CANONICAL_SESSION",
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
 * }} S2Result
 */

/**
 * @param {{ cwd?: string, packageJsonPath?: string, envExamplePath?: string }} [opts]
 * @returns {S2Result}
 */
export function runReleaseSmokeS2Auth(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const packageJsonPath =
    opts.packageJsonPath ?? path.join(cwd, "package.json");
  const envExamplePath =
    opts.envExamplePath ?? path.join(cwd, ".env.example");
  /** @type {string[]} */
  const checks = [];

  // 1) Auth runner script on main
  if (!fs.existsSync(packageJsonPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — cannot verify Auth runner.",
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
        "RELEASE-SMOKE S2 requires the PS-002-C Auth runner on main.",
      ].join("\n"),
    };
  }
  checks.push("ps002_canonical_auth_script_present");

  // 2) Canonical FCR-008 prefix = Auth session contract
  const prefix = PS002_CANONICAL_STEPS.slice(0, 3);
  const expected = [...RELEASE_SMOKE_S2_MAPPED_TOKENS];
  if (
    prefix.length !== 3 ||
    prefix[0] !== "LOGIN" ||
    prefix[1] !== "LOGIN_OK" ||
    prefix[2] !== "CANONICAL_SESSION"
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "PS-002-C canonical pipeline no longer starts with LOGIN → LOGIN_OK → CANONICAL_SESSION.",
        `Observed prefix: ${prefix.join(" → ") || "(empty)"}`,
      ].join("\n"),
    };
  }
  checks.push("fcr008_auth_prefix_intact");

  // 3) Platform Auth certification tag
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
        "RELEASE-SMOKE S2 reuses platform Auth certification — tag required on the clone.",
      ].join("\n"),
    };
  }

  // 4) Credential slots documented (not inventing secrets)
  if (!fs.existsSync(envExamplePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing .env.example — Auth credential slots undocumented.",
    };
  }
  const example = fs.readFileSync(envExamplePath, "utf8");
  for (const key of ["PS002_EMAIL", "PS002_PASSWORD"]) {
    if (!example.includes(key)) {
      return {
        ok: false,
        checks,
        reason: `${key} is not documented in .env.example (Auth attempt slots).`,
      };
    }
  }
  checks.push("ps002_credential_slots_documented");

  // 5) Auth surface present in repo (route / module) — no Playwright
  const authCandidates = [
    path.join(cwd, "src/auth"),
    path.join(cwd, "src/routes/auth"),
    path.join(cwd, "src/pages/auth"),
  ];
  const authSurface = authCandidates.find((p) => fs.existsSync(p));
  if (!authSurface) {
    // fallback: any file mentioning /auth/admin route under src
    const hasAuthAdmin = walkHas(cwd, "src", (name, content) => {
      return name.endsWith(".tsx") || name.endsWith(".ts")
        ? content.includes("/auth/admin") || content.includes("auth/admin")
        : false;
    });
    if (!hasAuthAdmin) {
      return {
        ok: false,
        checks,
        reason:
          "No Auth surface found under src/ (expected auth module or /auth/admin route).",
      };
    }
  }
  checks.push("auth_surface_present");

  return {
    ok: true,
    checks,
    mapped_tokens: expected,
    source: "ps002c-pass + FCR-008 Auth prefix (no full Playwright suite)",
  };
}

/**
 * Shallow walk (depth-limited) for a predicate on file contents.
 * @param {string} root
 * @param {string} rel
 * @param {(name: string, content: string) => boolean} pred
 */
function walkHas(root, rel, pred) {
  const base = path.join(root, rel);
  if (!fs.existsSync(base)) return false;
  /** @type {string[]} */
  const stack = [base];
  let seen = 0;
  while (stack.length && seen < 400) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "node_modules" || ent.name === "dist") continue;
        stack.push(full);
      } else if (ent.isFile()) {
        seen += 1;
        try {
          const content = fs.readFileSync(full, "utf8");
          if (pred(full, content)) return true;
        } catch {
          /* ignore */
        }
      }
    }
  }
  return false;
}
