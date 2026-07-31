/**
 * PS-002-C environment preflight (developer experience only).
 * Does not change auth/test logic — only BLOCKED reasons before LOGIN.
 */
import fs from "node:fs";
import path from "node:path";
import { resolvePs002cBrowser } from "./ps002c-playwright.mjs";

/**
 * @typedef {{ ok: true } | { ok: false, reason: string }} PreflightResult
 */

/**
 * Ordered environment checks. First failure wins (clear BLOCKED message).
 *
 * @param {{
 *   cwd?: string,
 *   email?: string,
 *   password?: string,
 *   baseUrl?: string,
 *   route?: string,
 *   probeServer?: (url: string) => Promise<{ ok: boolean, error?: string, status?: number }>,
 *   resolveBrowser?: () => { ok: true, executablePath?: string } | { ok: false, reason: string },
 * }} [opts]
 * @returns {Promise<PreflightResult>}
 */
export async function runPs002cPreflight(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const envPath = path.join(cwd, ".env");
  const email = (opts.email ?? process.env.PS002_EMAIL ?? "").trim();
  const password = (opts.password ?? process.env.PS002_PASSWORD ?? "").trim();
  const baseUrl =
    opts.baseUrl ?? process.env.PS_BASE_URL ?? "http://127.0.0.1:8080";
  const route = opts.route ?? process.env.PS002_ROUTE ?? "/auth/admin";
  const resolveBrowser = opts.resolveBrowser ?? resolvePs002cBrowser;
  const probe =
    opts.probeServer ??
    (async (url) => {
      try {
        const res = await fetch(url, { method: "GET", redirect: "manual" });
        return { ok: true, status: res.status };
      } catch (e) {
        return {
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    });

  if (!fs.existsSync(envPath)) {
    return {
      ok: false,
      reason: [
        "Missing .env file at repository root.",
        "Fix: cp .env.example .env",
        "Then fill SUPABASE_* / VITE_SUPABASE_* and PS002_EMAIL / PS002_PASSWORD.",
        "Never commit .env (it is gitignored).",
      ].join("\n"),
    };
  }

  if (!email) {
    return {
      ok: false,
      reason: [
        "PS002_EMAIL is missing or empty.",
        "Fix: set PS002_EMAIL in your local .env (see .env.example).",
      ].join("\n"),
    };
  }

  if (!password) {
    return {
      ok: false,
      reason: [
        "PS002_PASSWORD is missing or empty.",
        "Fix: set PS002_PASSWORD in your local .env (see .env.example).",
        "Do not commit real passwords.",
      ].join("\n"),
    };
  }

  const browser = resolveBrowser();
  if (!browser.ok) {
    return { ok: false, reason: browser.reason };
  }

  const server = await probe(`${baseUrl.replace(/\/$/, "")}${route}`);
  if (!server.ok) {
    return {
      ok: false,
      reason: [
        "Dev server is not responding.",
        `Probed: ${baseUrl}${route}`,
        server.error ? `Detail: ${server.error}` : "",
        "Fix (terminal 1): VITE_BOOTSTRAP_MODE=false npm run dev -- --host 127.0.0.1 --port 8080",
        "Then re-run: npm run test:ps002-canonical-auth",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  return { ok: true };
}
