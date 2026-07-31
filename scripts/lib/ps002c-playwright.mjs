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
 * Resolve Chromium binary required by channel: "chromium" (new headless).
 * Does not require chromium_headless_shell.
 *
 * @param {{
 *   executablePath?: () => string,
 *   launch?: Function,
 * }} [chromiumApi]
 * @returns {{ ok: true, executablePath: string } | { ok: false, reason: string }}
 */
export function resolvePs002cBrowser(chromiumApi) {
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

  return { ok: true, executablePath };
}
