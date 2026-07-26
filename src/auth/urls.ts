/**
 * Auth redirect URLs derived from the current origin + known router paths.
 * Do not hardcode production hosts here — Site URL / allowlist lives in Supabase Dashboard.
 */

/** Dedicated OAuth / PKCE return path (TanStack route `/auth/callback`). */
export const AUTH_CALLBACK_PATH = "/auth/callback" as const;

/** Password recovery path (existing route). */
export const AUTH_RESET_PASSWORD_PATH = "/reset-password" as const;

/** Customer / primary login path. */
export const AUTH_LOGIN_PATH = "/auth" as const;

/** Post-callback destinations allowed via `?next=` (open-redirect safe). */
export const AUTH_ALLOWED_NEXT_PATHS = [
  AUTH_RESET_PASSWORD_PATH,
  AUTH_LOGIN_PATH,
  "/auth/admin",
  "/app",
  "/admin",
  "/saas",
] as const;

export type AuthAllowedNextPath = (typeof AUTH_ALLOWED_NEXT_PATHS)[number];

export function authOrigin(origin?: string): string {
  if (origin) return origin.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  return "";
}

export function oauthRedirectTo(origin?: string): string {
  return `${authOrigin(origin)}${AUTH_CALLBACK_PATH}`;
}

/**
 * Build `/auth/callback` optionally with a sanitized `next` path.
 * Used for email confirm + password recovery so PKCE `code` is exchanged
 * before navigating to the product surface.
 */
export function authCallbackUrl(
  origin?: string,
  next?: AuthAllowedNextPath | string,
): string {
  const base = `${authOrigin(origin)}${AUTH_CALLBACK_PATH}`;
  const safe = next ? safeAuthNextPath(next) : null;
  if (!safe) return base;
  const url = new URL(base);
  url.searchParams.set("next", safe);
  return url.toString();
}

/**
 * Password recovery must land on `/auth/callback` first (PKCE exchange),
 * then continue to `/reset-password` with an established recovery session.
 */
export function passwordResetRedirectTo(origin?: string): string {
  return authCallbackUrl(origin, AUTH_RESET_PASSWORD_PATH);
}

/**
 * Signup confirmation returns through the same PKCE callback, then customer login.
 * (mailer_autoconfirm=false on the official project — no session until confirm.)
 */
export function emailConfirmRedirectTo(origin?: string): string {
  return authCallbackUrl(origin, AUTH_LOGIN_PATH);
}

/** Sanitize `next` query values — path-only, allowlisted. */
export function safeAuthNextPath(
  raw: string | null | undefined,
): AuthAllowedNextPath | null {
  if (!raw) return null;
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (decoded.includes("://") || decoded.includes("\\")) return null;
  const path = decoded.split(/[?#]/)[0] ?? "";
  if (
    (AUTH_ALLOWED_NEXT_PATHS as readonly string[]).includes(path)
  ) {
    return path as AuthAllowedNextPath;
  }
  return null;
}
