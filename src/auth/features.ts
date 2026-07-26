/**
 * Auth surface feature toggles — Identity Freeze v1 / CLOSEOUT-001.
 *
 * Defaults are OFF. Implementations stay in tree for future activation:
 * - OAuth: `oauth.ts` + `/auth/callback` (Google/Apple UI gated)
 * - Phone OTP: `credentials.ts` (tab gated until SMS provider is live)
 *
 * Do not delete OAuth/Phone code to “clean up”; flip flags after Dashboard
 * providers are configured. See docs/00-status/IDENTITY_FREEZE_v1.md.
 */

function readFlag(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const s = String(value).trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return undefined;
}

function viteEnvFlag(name: string): unknown {
  try {
    return (import.meta.env as Record<string, unknown>)[name];
  } catch {
    return undefined;
  }
}

function flagFromEnv(name: string): boolean | undefined {
  // process.env first — reliable under Vitest / SSR; Vite also injects VITE_*.
  const fromProcess = readFlag(process.env[name]);
  if (fromProcess !== undefined) return fromProcess;
  return readFlag(viteEnvFlag(name));
}

/**
 * Google/Apple buttons on `/auth`.
 * Default: **false** (Identity Freeze — providers not product-enabled).
 * Activate: Dashboard Google/Apple ON → `VITE_AUTH_OAUTH_SOCIAL_ENABLED=true` → rebuild.
 */
export function isOAuthSocialEnabled(): boolean {
  return flagFromEnv("VITE_AUTH_OAUTH_SOCIAL_ENABLED") ?? false;
}

/**
 * Phone OTP tab on `/auth`.
 * Default: **false** (Phone Auth off — `Unsupported phone provider`).
 * Activate: Dashboard Phone + SMS → validate OTP → `VITE_AUTH_PHONE_ENABLED=true` → rebuild.
 */
export function isPhoneAuthEnabled(): boolean {
  return flagFromEnv("VITE_AUTH_PHONE_ENABLED") ?? false;
}
