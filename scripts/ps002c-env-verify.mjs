/**
 * PS-002-C · Environment Verification (DX)
 *
 * Turns `npm run bootstrap:e2e` into a diagnostic tool:
 *   READY   — environment can run PS-002-C
 *   BLOCKED — prints exactly what is missing + the fix command
 *
 * Browser policy (Playwright 1.49+): Chromium new headless via
 * `channel: "chromium"` — does NOT require chromium_headless_shell.
 * See docs/10-validation/PS002C_PLAYWRIGHT_HEADLESS_SHELL.md
 *
 * Does not run the auth test. Does not change Auth / Supabase / routes.
 *
 * Usage:
 *   npm run bootstrap:e2e
 *   npm run bootstrap:e2e -- --check-only
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  PS002C_BROWSER_POLICY,
  getPlaywrightBrowsersCacheDir,
  resolvePs002cBrowser,
} from "./lib/ps002c-playwright.mjs";
import {
  isInvalidVitePublishableKey,
  readVitePublishableKeyFromEnvFile,
} from "./lib/ps002c-vite-env.mjs";

const require = createRequire(import.meta.url);
const CHECK_ONLY = process.argv.includes("--check-only");
const ROOT = process.cwd();
const DOC =
  "docs/10-validation/PS002C_PLAYWRIGHT_HEADLESS_SHELL.md";
const INTEGRITY_DOC = "docs/10-validation/PS002C_CHROMIUM_INTEGRITY.md";

/** @typedef {{ id: string, label: string, ok: boolean, detail?: string, fix?: string }} Step */

/** @type {Step[]} */
const steps = [];

function record(id, label, ok, detail = "", fix = "") {
  steps.push({ id, label, ok, detail, fix });
  const mark = ok ? "✓" : "✗";
  console.log(`${mark} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok && fix) console.log(`  Fix: ${fix}`);
}

function printBanner(ready) {
  const line = "=====================================";
  console.log(`\n${line}\n`);
  if (ready) {
    console.log(`YourMeal OS
Environment Ready

${steps.map((s) => `✓ ${s.label}`).join("\n")}

Ready to run

npm run test:ps002-canonical-auth
`);
  } else {
    const failed = steps.find((s) => !s.ok);
    console.log(`YourMeal OS
Environment BLOCKED

Falta exactamente:
${failed?.label ?? "unknown"}

${failed?.detail ? `${failed.detail}\n` : ""}${
      failed?.fix ? `Ejecute:\n\n${failed.fix}\n` : ""
    }
`);
  }
  console.log(line);
}

function stopIfFailed() {
  if (steps.some((s) => !s.ok)) {
    printBanner(false);
    process.exit(2);
  }
}

function checkNode() {
  record(
    "node",
    "Node",
    typeof process.versions.node === "string",
    process.versions.node,
    "Install Node.js 20+ (https://nodejs.org)",
  );
}

function checkNpm() {
  const r = spawnSync("npm", ["--version"], { encoding: "utf8" });
  const ok = r.status === 0;
  record(
    "npm",
    "npm",
    ok,
    ok ? r.stdout.trim() : r.stderr?.trim() || "npm not found",
    "Install npm (comes with Node.js)",
  );
}

async function checkDotenv() {
  try {
    await import("dotenv/config");
    record("dotenv", "dotenv", true, "loaded");
  } catch (e) {
    record(
      "dotenv",
      "dotenv",
      false,
      e instanceof Error ? e.message : String(e),
      "npm install",
    );
  }
}

function checkEnvFile() {
  const envPath = path.join(ROOT, ".env");
  const ok = fs.existsSync(envPath);
  record(
    "env",
    ".env",
    ok,
    ok ? "present" : "missing at repository root",
    "cp .env.example .env",
  );
  return ok;
}

function checkCredentials() {
  const email = (process.env.PS002_EMAIL || "").trim();
  const password = (process.env.PS002_PASSWORD || "").trim();
  const ok = Boolean(email && password);
  record(
    "ps002",
    "PS002 credentials",
    ok,
    ok
      ? "PS002_EMAIL / PS002_PASSWORD set"
      : "PS002_EMAIL and/or PS002_PASSWORD empty",
    "Set PS002_EMAIL and PS002_PASSWORD in local .env (never commit)",
  );
}

function checkVitePublishableKey() {
  const envPath = path.join(ROOT, ".env");
  const fromFile = readVitePublishableKeyFromEnvFile(envPath);
  const key =
    fromFile !== null
      ? fromFile
      : (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
  const ok = !isInvalidVitePublishableKey(key);
  record(
    "vite_key",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    ok,
    ok
      ? "set (non-placeholder)"
      : key
        ? "contains REPLACE_ME placeholder — browser would get Invalid API key"
        : "missing or empty",
    [
      "Invalid VITE_SUPABASE_PUBLISHABLE_KEY. Replace placeholder with the project's real publishable key.",
      "Set VITE_SUPABASE_PUBLISHABLE_KEY in .env (project djangucecsphnejplvic).",
      "SUPABASE_PUBLISHABLE_KEY alone does NOT reach the Vite SPA — restart npm run dev after editing.",
      "Never commit real keys.",
    ].join("\n"),
  );
}

function checkPlaywrightPackage() {
  try {
    const pkgPath = require.resolve("playwright/package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    record("playwright", "Playwright", true, `v${pkg.version}`);
    return true;
  } catch (e) {
    record(
      "playwright",
      "Playwright",
      false,
      e instanceof Error ? e.message : String(e),
      "npm install",
    );
    return false;
  }
}

function installBrowsers() {
  const cmd = PS002C_BROWSER_POLICY.installCommand;
  console.log(`\n→ Installing browsers for PS-002-C policy (${cmd})…\n`);
  console.log(
    "  Policy: Chromium new headless (channel: chromium) — no headless_shell\n",
  );
  const r = spawnSync("npx", ["playwright", ...PS002C_BROWSER_POLICY.installArgs], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "inherit",
    env: {
      ...process.env,
      // Avoid GC remove→redownload loops that hang some operator installs
      PLAYWRIGHT_SKIP_BROWSER_GC: process.env.PLAYWRIGHT_SKIP_BROWSER_GC || "1",
    },
  });
  return r.status === 0;
}

function recordChromium() {
  const resolved = resolvePs002cBrowser();
  const cache = getPlaywrightBrowsersCacheDir();
  if (resolved.ok) {
    record(
      "chromium",
      "Chromium (new headless / channel: chromium)",
      true,
      resolved.executablePath,
    );
    record(
      "integrity",
      "Chromium integrity",
      true,
      `INSTALLATION_COMPLETE + platform resources · ${resolved.integrity.browserDirectory}`,
    );
    record(
      "policy",
      "Browser policy",
      true,
      `${PS002C_BROWSER_POLICY.id} · headless_shell not required`,
    );
    return true;
  }

  const incomplete = /Chromium installation incomplete/i.test(
    resolved.reason || "",
  );
  record(
    "chromium",
    incomplete
      ? "Chromium integrity (installation incomplete)"
      : "Chromium (new headless / channel: chromium)",
    false,
    incomplete
      ? resolved.reason
      : [
          "Chromium binary missing or unresolved.",
          `Cache inspected: ${cache}`,
          "headless_shell is NOT required for PS-002-C.",
          `Doc: ${DOC}`,
        ].join(" "),
    incomplete
      ? [
          PS002C_BROWSER_POLICY.installCommand,
          "",
          "First remove the broken browser directory (see detail above),",
          "then reinstall. Do NOT run bare: npx playwright install",
          `Doc: ${INTEGRITY_DOC}`,
        ].join("\n")
      : `${PS002C_BROWSER_POLICY.installCommand}\n\nDo NOT run bare: npx playwright install\n(that command may hang after Chromium 100% / headless_shell).`,
  );
  return false;
}

async function main() {
  console.log(`
YourMeal OS · PS-002-C Environment Verification
${CHECK_ONLY ? "(check-only · no install)\n" : ""}`);

  checkNode();
  stopIfFailed();

  checkNpm();
  stopIfFailed();

  await checkDotenv();
  stopIfFailed();

  const hasEnv = checkEnvFile();
  if (hasEnv) {
    checkVitePublishableKey();
    stopIfFailed();
    checkCredentials();
  } else {
    record(
      "vite_key",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      false,
      "skipped · .env missing",
      "cp .env.example .env && set VITE_SUPABASE_PUBLISHABLE_KEY (not REPLACE_ME)",
    );
    record(
      "ps002",
      "PS002 credentials",
      false,
      "skipped · .env missing",
      "cp .env.example .env && set PS002_EMAIL / PS002_PASSWORD",
    );
  }
  stopIfFailed();

  checkPlaywrightPackage();
  stopIfFailed();

  let ok = recordChromium();
  if (!ok && !CHECK_ONLY) {
    console.log(
      "\n→ Chromium incomplete for channel: chromium (new headless).",
    );
    if (!installBrowsers()) {
      record(
        "install",
        "Playwright install",
        false,
        [
          `${PS002C_BROWSER_POLICY.installCommand} exited non-zero.`,
          "Bare `npx playwright install` is not the fix (may hang on headless_shell).",
          `Doc: ${DOC}`,
        ].join(" "),
        PS002C_BROWSER_POLICY.installCommand,
      );
      printBanner(false);
      process.exit(2);
    }
    // clear previous chromium/integrity failure so banner reflects re-check
    for (const id of ["chromium", "integrity", "policy"]) {
      const idx = steps.findIndex((s) => s.id === id);
      if (idx >= 0) steps.splice(idx, 1);
    }
    ok = recordChromium();
    if (!ok) {
      record(
        "install",
        "Playwright install",
        false,
        [
          "Install finished but Chromium still missing or incomplete.",
          `Cache: ${getPlaywrightBrowsersCacheDir()}`,
          "If integrity fails after install, delete the chromium-<rev> directory and retry.",
          `Doc: ${INTEGRITY_DOC}`,
        ].join(" "),
        PS002C_BROWSER_POLICY.installCommand,
      );
    }
  }

  const ready = steps.every((s) => s.ok);
  printBanner(ready);
  process.exit(ready ? 0 : 2);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(2);
});
