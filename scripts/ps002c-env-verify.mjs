/**
 * PS-002-C · Environment Verification (DX)
 *
 * Turns `npm run bootstrap:e2e` into a diagnostic tool:
 *   READY   — environment can run PS-002-C
 *   BLOCKED — prints exactly what is missing + the fix command
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

const require = createRequire(import.meta.url);
const CHECK_ONLY = process.argv.includes("--check-only");
const ROOT = process.cwd();

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

/**
 * @param {string} dir
 * @param {string[]} names
 */
function findFile(dir, names) {
  if (!fs.existsSync(dir)) return "";
  const stack = [dir];
  let guard = 0;
  while (stack.length && guard++ < 400) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (ent.isFile() && names.includes(ent.name)) return full;
      if (ent.isDirectory()) stack.push(full);
    }
  }
  return "";
}

function inspectBrowsers() {
  let chromiumPath = "";
  let headlessPath = "";

  try {
    const { chromium } = require("playwright");
    chromiumPath = chromium.executablePath();
  } catch {
    /* resolved via cache scan */
  }

  const cacheRoot =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    path.join(
      process.env.HOME || process.env.USERPROFILE || "",
      ".cache",
      "ms-playwright",
    );

  try {
    if (fs.existsSync(cacheRoot)) {
      const entries = fs.readdirSync(cacheRoot);
      const headlessDir = entries.find((e) =>
        e.startsWith("chromium_headless_shell-"),
      );
      if (headlessDir) {
        headlessPath =
          findFile(path.join(cacheRoot, headlessDir), [
            "headless_shell",
            "chrome-headless-shell",
          ]) || "";
      }
      if (!chromiumPath) {
        const chromiumDir = entries.find(
          (e) => e.startsWith("chromium-") && !e.includes("headless"),
        );
        if (chromiumDir) {
          chromiumPath =
            findFile(path.join(cacheRoot, chromiumDir), [
              "chrome",
              "Chromium",
              "chrome.exe",
            ]) || "";
        }
      }
    }
  } catch {
    /* ignore */
  }

  const chromiumOk = Boolean(chromiumPath && fs.existsSync(chromiumPath));
  const pathLooksHeadless = /headless/i.test(chromiumPath);
  const headlessOk =
    Boolean(headlessPath && fs.existsSync(headlessPath)) ||
    (chromiumOk && pathLooksHeadless);

  return { chromiumOk, headlessOk, chromiumPath, headlessPath };
}

function recordBrowsers(info) {
  record(
    "chromium",
    "Chromium",
    info.chromiumOk,
    info.chromiumOk
      ? info.chromiumPath
      : "chromium-* binary not found in Playwright cache",
    "npx playwright install",
  );
  record(
    "headless",
    "Headless Shell",
    info.headlessOk,
    info.headlessOk
      ? info.headlessPath || info.chromiumPath
      : "chromium_headless_shell-* not found (Playwright 1.49+ needs this)",
    "npx playwright install",
  );
}

function installBrowsers() {
  console.log("\n→ Installing Playwright browsers (npx playwright install)…\n");
  const r = spawnSync("npx", ["playwright", "install"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "inherit",
  });
  return r.status === 0;
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
  if (hasEnv) checkCredentials();
  else {
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

  let info = inspectBrowsers();
  if ((!info.chromiumOk || !info.headlessOk) && !CHECK_ONLY) {
    console.log(
      "\n→ Browsers incomplete (need Chromium and/or Headless Shell).",
    );
    if (!installBrowsers()) {
      record(
        "install",
        "Playwright install",
        false,
        "npx playwright install exited non-zero",
        "npx playwright install",
      );
      printBanner(false);
      process.exit(2);
    }
    info = inspectBrowsers();
  }

  recordBrowsers(info);

  const ready = steps.every((s) => s.ok);
  printBanner(ready);
  process.exit(ready ? 0 : 2);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(2);
});
