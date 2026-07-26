/**
 * Auth surface feature toggles (INFRA-005).
 *
 * OAuth social (Google/Apple) remains fully implemented in `oauth.ts` and
 * `/auth/callback`. This flag only controls UI exposure on `/auth`.
 *
 * Reactivate: set `VITE_AUTH_OAUTH_SOCIAL_ENABLED=true` in `.env` and rebuild.
 * Default: disabled — identity validation focuses on email/password.
 */

function readFlag(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const s = String(value).trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return undefined;
}

function viteEnvFlag(): unknown {
  try {
    return import.meta.env.VITE_AUTH_OAUTH_SOCIAL_ENABLED;
  } catch {
    return undefined;
  }
}

/**
 * Whether Google/Apple OAuth buttons are shown on the customer login screen.
 * Defaults to **false** while INFRA-005 identity validation is active.
 */
export function isOAuthSocialEnabled(): boolean {
  // process.env first — reliable under Vitest / SSR; Vite also injects VITE_*.
  const fromProcess = readFlag(process.env.VITE_AUTH_OAUTH_SOCIAL_ENABLED);
  if (fromProcess !== undefined) return fromProcess;

  const fromVite = readFlag(viteEnvFlag());
  if (fromVite !== undefined) return fromVite;

  return false;
}
