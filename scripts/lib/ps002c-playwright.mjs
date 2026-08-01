/**
 * PS-002-C · Playwright browser policy (infra only)
 *
 * Playwright 1.49+ default headless uses `chromium_headless_shell`.
 * Official alternative: Chromium "new headless" via `channel: "chromium"`,
 * which requires the full Chromium build and does NOT need headless_shell.
 *
 * Sources (official):
 * - https://playwright.dev/docs/browsers#chromium-new-headless-mode
 * - https://github.com/microsoft/playwright/issues/33566
 * - https://playwright.dev/docs/release-notes#version-149
 *
 * Install that matches this policy:
 *   npx playwright install chromium --no-shell
 *
 * Integrity: existence of the Chromium executable is NOT enough.
 * Playwright writes INSTALLATION_COMPLETE only after a full unzip; macOS
 * also requires Chromium Framework.framework (dlopen target).
 * See docs/10-validation/PS002C_CHROMIUM_INTEGRITY.md
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** @type {const} */
export const PS002C_BROWSER_POLICY = {
  id: "chromium-new-headless",
  /** @type {{ headless: true, channel: "chromium" }} */
  launchOptions: {
    headless: true,
    channel: "chromium",
  },
  /** CLI args after `npx playwright` */
  installArgs: ["install", "chromium", "--no-shell"],
  installCommand: "npx playwright install chromium --no-shell",
  docs: [
    "https://playwright.dev/docs/browsers#chromium-new-headless-mode",
    "https://github.com/microsoft/playwright/issues/33566",
  ],
};

const INTEGRITY_DOC = "docs/10-validation/PS002C_CHROMIUM_INTEGRITY.md";

/**
 * OS cache dir used by Playwright (same rules as playwright-core registry).
 * @returns {string}
 */
export function getPlaywrightBrowsersCacheDir() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH === "0") {
    const pkg = path.dirname(require.resolve("playwright-core/package.json"));
    return path.join(pkg, ".local-browsers");
  }
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
    return path.resolve(process.env.PLAYWRIGHT_BROWSERS_PATH);
  }
  let cacheDirectory;
  if (process.platform === "linux") {
    cacheDirectory =
      process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache");
  } else if (process.platform === "darwin") {
    cacheDirectory = path.join(os.homedir(), "Library", "Caches");
  } else if (process.platform === "win32") {
    cacheDirectory =
      process.env.LOCALAPPDATA ||
      path.join(os.homedir(), "AppData", "Local");
  } else {
    cacheDirectory = path.join(os.homedir(), ".cache");
  }
  return path.join(cacheDirectory, "ms-playwright");
}

/**
 * Browser revision directory that should contain INSTALLATION_COMPLETE.
 * @param {string} executablePath
 * @returns {string}
 */
export function resolveChromiumBrowserDirectory(executablePath) {
  let cur = path.dirname(executablePath);
  for (let i = 0; i < 10; i++) {
    const base = path.basename(cur);
    if (/^chromium-\d+/.test(base) && !base.includes("headless")) {
      return cur;
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  // Fallback: two levels up from chrome-linux/chrome, or six from MacOS/Chromium
  if (executablePath.includes(`${path.sep}chrome-mac${path.sep}`)) {
    return path.resolve(path.dirname(executablePath), "../../../..");
  }
  if (executablePath.includes(`${path.sep}chrome-linux${path.sep}`)) {
    return path.resolve(path.dirname(executablePath), "..");
  }
  if (executablePath.includes(`${path.sep}chrome-win${path.sep}`)) {
    return path.resolve(path.dirname(executablePath), "..");
  }
  return path.dirname(executablePath);
}

/**
 * Locate Chromium Framework binary inside the .framework bundle.
 * @param {string} frameworkDir
 * @returns {string}
 */
export function findChromiumFrameworkBinary(frameworkDir) {
  const candidates = [
    path.join(frameworkDir, "Chromium Framework"),
    path.join(frameworkDir, "Versions", "Current", "Chromium Framework"),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      /* ignore */
    }
  }
  const versionsDir = path.join(frameworkDir, "Versions");
  try {
    if (!fs.existsSync(versionsDir)) return "";
    for (const v of fs.readdirSync(versionsDir)) {
      if (v === "Current") continue;
      const p = path.join(versionsDir, v, "Chromium Framework");
      if (fs.existsSync(p)) return p;
    }
  } catch {
    /* ignore */
  }
  return "";
}

/**
 * Platform-aware integrity check for a Chromium install.
 * Existence of the launcher binary alone is insufficient (macOS Framework).
 *
 * @param {string} executablePath
 * @param {{ platform?: NodeJS.Platform }} [opts]
 * @returns {{
 *   ok: boolean,
 *   browserDirectory: string,
 *   missing: string[],
 *   checked: string[],
 * }}
 */
export function inspectChromiumIntegrity(executablePath, opts = {}) {
  const platform = opts.platform ?? process.platform;
  /** @type {string[]} */
  const missing = [];
  /** @type {string[]} */
  const checked = [];
  const browserDirectory = resolveChromiumBrowserDirectory(executablePath);

  const marker = path.join(browserDirectory, "INSTALLATION_COMPLETE");
  checked.push(marker);
  if (!fs.existsSync(marker)) {
    missing.push(`INSTALLATION_COMPLETE (${marker})`);
  }

  if (platform === "darwin" || executablePath.includes(`${path.sep}chrome-mac${path.sep}`)) {
    // .../Chromium.app/Contents/MacOS/Chromium
    const contentsDir = path.dirname(path.dirname(executablePath));
    const infoPlist = path.join(contentsDir, "Info.plist");
    const frameworkDir = path.join(
      contentsDir,
      "Frameworks",
      "Chromium Framework.framework",
    );
    checked.push(infoPlist, frameworkDir);
    if (!fs.existsSync(infoPlist)) {
      missing.push(`Info.plist (${infoPlist})`);
    }
    if (!fs.existsSync(frameworkDir)) {
      missing.push(`Chromium Framework.framework (${frameworkDir})`);
    } else {
      const frameworkBinary = findChromiumFrameworkBinary(frameworkDir);
      checked.push(
        frameworkBinary ||
          path.join(frameworkDir, "Versions", "Current", "Chromium Framework"),
      );
      if (!frameworkBinary) {
        missing.push(
          `Chromium Framework binary inside Chromium Framework.framework (${frameworkDir})`,
        );
      } else {
        const resourcesDir = path.join(path.dirname(frameworkBinary), "Resources");
        checked.push(resourcesDir);
        if (!fs.existsSync(resourcesDir)) {
          missing.push(`Framework Resources (${resourcesDir})`);
        }
      }
    }
  } else if (
    platform === "linux" ||
    executablePath.includes(`${path.sep}chrome-linux${path.sep}`)
  ) {
    const dir = path.dirname(executablePath);
    for (const name of ["icudtl.dat", "resources.pak"]) {
      const p = path.join(dir, name);
      checked.push(p);
      if (!fs.existsSync(p)) missing.push(`${name} (${p})`);
    }
  } else if (
    platform === "win32" ||
    executablePath.includes(`${path.sep}chrome-win${path.sep}`)
  ) {
    const dir = path.dirname(executablePath);
    for (const name of ["icudtl.dat", "resources.pak"]) {
      const p = path.join(dir, name);
      checked.push(p);
      if (!fs.existsSync(p)) missing.push(`${name} (${p})`);
    }
  }

  return {
    ok: missing.length === 0,
    browserDirectory,
    missing,
    checked,
  };
}

/**
 * @param {ReturnType<typeof inspectChromiumIntegrity>} integrity
 * @param {string} executablePath
 */
function incompleteReason(integrity, executablePath) {
  return [
    "Chromium installation incomplete",
    `Executable present: ${executablePath}`,
    `Browser directory: ${integrity.browserDirectory}`,
    "Missing required pieces:",
    ...integrity.missing.map((m) => `  - ${m}`),
    "A partial unzip leaves Chromium.app/chrome present but breaks launch (macOS: dlopen Chromium Framework.framework).",
    `Fix: rm -rf "${integrity.browserDirectory}" && ${PS002C_BROWSER_POLICY.installCommand}`,
    "Or: npm run bootstrap:e2e",
    "Do not trust READY from binary existence alone.",
    `See: ${INTEGRITY_DOC}`,
  ].join("\n");
}

/**
 * Resolve Chromium binary required by channel: "chromium" (new headless)
 * and verify install integrity (marker + framework / resources).
 *
 * Does not require chromium_headless_shell.
 *
 * @param {{
 *   executablePath?: () => string,
 *   launch?: Function,
 * }} [chromiumApi]
 * @param {{ platform?: NodeJS.Platform }} [opts]
 * @returns {{ ok: true, executablePath: string, integrity: ReturnType<typeof inspectChromiumIntegrity> } | { ok: false, reason: string }}
 */
export function resolvePs002cBrowser(chromiumApi, opts = {}) {
  let api = chromiumApi;
  if (!api) {
    try {
      api = require("playwright").chromium;
    } catch (e) {
      return {
        ok: false,
        reason: [
          "Playwright package is not available.",
          `Detail: ${e instanceof Error ? e.message : String(e)}`,
          "Fix: npm install",
        ].join("\n"),
      };
    }
  }

  if (typeof api?.launch !== "function") {
    return {
      ok: false,
      reason: [
        "Playwright is not available (chromium.launch missing).",
        "Fix: npm install",
      ].join("\n"),
    };
  }

  let executablePath = "";
  try {
    executablePath = api.executablePath();
  } catch (e) {
    return {
      ok: false,
      reason: [
        "Chromium executable path could not be resolved.",
        "PS-002-C uses Chromium new headless (channel: chromium) — not headless_shell.",
        `Fix: ${PS002C_BROWSER_POLICY.installCommand}`,
        `Detail: ${e instanceof Error ? e.message : String(e)}`,
        "See: docs/10-validation/PS002C_PLAYWRIGHT_HEADLESS_SHELL.md",
      ].join("\n"),
    };
  }

  if (!executablePath || !fs.existsSync(executablePath)) {
    return {
      ok: false,
      reason: [
        "Chromium binary is missing (required for channel: chromium).",
        executablePath
          ? `Expected path: ${executablePath}`
          : "Expected path: (unresolved)",
        `Cache: ${getPlaywrightBrowsersCacheDir()}`,
        "PS-002-C does not require chromium_headless_shell.",
        `Fix: ${PS002C_BROWSER_POLICY.installCommand}`,
        "Do not run bare `npx playwright install` — it may hang re-downloading browsers / headless_shell.",
        "See: docs/10-validation/PS002C_PLAYWRIGHT_HEADLESS_SHELL.md",
      ].join("\n"),
    };
  }

  if (/headless/i.test(executablePath)) {
    return {
      ok: false,
      reason: [
        "Resolved executable looks like headless_shell, but PS-002-C needs full Chromium.",
        `Path: ${executablePath}`,
        `Fix: ${PS002C_BROWSER_POLICY.installCommand}`,
        "See: docs/10-validation/PS002C_PLAYWRIGHT_HEADLESS_SHELL.md",
      ].join("\n"),
    };
  }

  const integrity = inspectChromiumIntegrity(executablePath, opts);
  if (!integrity.ok) {
    return {
      ok: false,
      reason: incompleteReason(integrity, executablePath),
    };
  }

  return { ok: true, executablePath, integrity };
}
