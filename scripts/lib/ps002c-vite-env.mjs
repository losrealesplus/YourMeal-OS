/**
 * PS-002-C · Vite Supabase env checks (DX only).
 *
 * The browser SPA reads import.meta.env.VITE_SUPABASE_* (injected by Vite).
 * SUPABASE_PUBLISHABLE_KEY alone does NOT reach the frontend — operators who
 * leave VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME get
 * "Invalid API key" from Supabase before credentials are validated.
 *
 * No Auth / FCR-008 changes.
 */
import fs from "node:fs";
import dotenv from "dotenv";

/**
 * @param {string | undefined | null} value
 * @returns {boolean}
 */
export function isInvalidVitePublishableKey(value) {
  const v = (value ?? "").trim();
  if (!v) return true;
  return /REPLACE_ME/i.test(v);
}

/**
 * Read VITE_SUPABASE_PUBLISHABLE_KEY from a .env file (does not mutate process.env).
 * @param {string} envPath
 * @returns {string | null} trimmed value, or `null` if file/key is absent
 */
export function readVitePublishableKeyFromEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return null;
  const parsed = dotenv.parse(fs.readFileSync(envPath));
  if (!Object.prototype.hasOwnProperty.call(parsed, "VITE_SUPABASE_PUBLISHABLE_KEY")) {
    return null;
  }
  return String(parsed.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
}

/**
 * @param {string | undefined | null} value
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function validateVitePublishableKey(value) {
  if (!isInvalidVitePublishableKey(value)) {
    return { ok: true };
  }

  return {
    ok: false,
    reason: [
      "Invalid VITE_SUPABASE_PUBLISHABLE_KEY. Replace placeholder with the project's real publishable key.",
      "",
      "The browser (Vite) uses VITE_SUPABASE_PUBLISHABLE_KEY.",
      "SUPABASE_PUBLISHABLE_KEY alone does NOT authenticate the SPA.",
      "",
      "Fix:",
      "  1. Open Supabase Dashboard → project djangucecsphnejplvic → API keys",
      "  2. Copy the publishable key into .env as VITE_SUPABASE_PUBLISHABLE_KEY=…",
      "  3. Keep SUPABASE_PUBLISHABLE_KEY in sync (same value) for scripts if needed",
      "  4. Restart Vite (npm run dev) so import.meta.env is re-injected",
      "",
      "Never commit real keys. .env is gitignored.",
    ].join("\n"),
  };
}
