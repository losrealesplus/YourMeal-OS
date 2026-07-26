/**
 * Auth surface feature toggles (INFRA-005 / PRODUCT-001).
 *
 * OAuth social (Google/Apple) remains fully implemented in `oauth.ts` and
 * `/auth/callback`. That flag only controls UI exposure on `/auth`.
 *
 * Phone OTP is implemented in `credentials.ts` (`signInWithOtp` / `verifyOtp`),
 * but the official Supabase project has `phone=false` / no SMS provider.
 * The phone tab stays hidden until Phone Auth is configured and this flag is on.
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
 * Whether Google/Apple OAuth buttons are shown on the customer login screen.
 * Defaults to **false** while identity validation is active.
 */
export function isOAuthSocialEnabled(): boolean {
  return flagFromEnv("VITE_AUTH_OAUTH_SOCIAL_ENABLED") ?? false;
}

/**
 * Whether the Phone OTP tab is shown on `/auth`.
 * Defaults to **false** — PRODUCT-001 audit: Phone Auth not configured
 * (`Unsupported phone provider` / `external.phone=false`).
 *
 * Reactivate only after Dashboard Phone Auth + SMS provider are live, then
 * set `VITE_AUTH_PHONE_ENABLED=true` and rebuild.
 */
export function isPhoneAuthEnabled(): boolean {
  return flagFromEnv("VITE_AUTH_PHONE_ENABLED") ?? false;
}
